import os
import re
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from bson import ObjectId
from firebase_admin import storage


# Import database and auth helpers
from database import get_database, close_database, CategoryModel, ProductModel, OrderModel, OrderItem
from auth import get_current_admin

# Load env variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB connection on startup
    db_conn = get_database()
    print("Connected to MongoDB database.")
    yield
    # Close connection on shutdown
    close_database()
    print("Closed MongoDB connection.")

app = FastAPI(
    title="Nyaningwe Cash & Carry - POS Sync Middleware",
    description="FastAPI service for POS synchronization and batch image ingestion using MongoDB & Firebase.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class POSItem(BaseModel):
    sku: str = Field(..., description="Barcode SKU")
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(..., ge=0)
    name: Optional[str] = Field(None, description="Optional name for insert fallback")


class POSSyncResponse(BaseModel):
    success: bool
    processed: int
    updated: List[str]
    created: List[str]
    failed: List[Dict[str, Any]]


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Nyaningwe POS Sync Middleware (MongoDB & Firebase)",
        "address": "41 Ed Mnangagwa St, Masvingo"
    }


@app.post("/api/pos/sync", response_model=POSSyncResponse)
async def sync_pos_products(items: List[POSItem]):
    """
    POS stock update endpoint.
    Accepts POS items list. Inserts or updates in MongoDB collection.
    """
    db = get_database()
    updated_skus = []
    created_skus = []
    failed_items = []

    # Ensure a default "Uncategorized" category exists in MongoDB
    default_cat_id = None
    try:
        cat = await db.categories.find_one({"slug": "uncategorized"})
        if cat:
            default_cat_id = str(cat["_id"])
        else:
            new_cat_res = await db.categories.insert_one({
                "name": "Uncategorized",
                "slug": "uncategorized"
            })
            default_cat_id = str(new_cat_res.inserted_id)
    except Exception as e:
        print(f"Error establishing default category: {e}")

    for item in items:
        try:
            # Query product by SKU
            product = await db.products.find_one({"sku": item.sku})
            
            if product:
                # Update stock and price
                await db.products.update_one(
                    {"sku": item.sku},
                    {"$set": {"price": item.price, "stock_quantity": item.stock_quantity}}
                )
                updated_skus.append(item.sku)
            else:
                # Create product
                product_name = item.name or f"POS Product {item.sku}"
                new_product = {
                    "sku": item.sku,
                    "name": product_name,
                    "price": item.price,
                    "stock_quantity": item.stock_quantity,
                    "description": "Synced from Point of Sale system.",
                    "category_id": default_cat_id,
                    "image_url": None,
                    "is_active": True
                }
                await db.products.insert_one(new_product)
                created_skus.append(item.sku)
        except Exception as e:
            failed_items.append({"sku": item.sku, "error": str(e)})

    return POSSyncResponse(
        success=len(failed_items) == 0,
        processed=len(items),
        updated=updated_skus,
        created=created_skus,
        failed=failed_items
    )


@app.post("/api/admin/bulk-upload-images")
async def bulk_upload_images(
    files: List[UploadFile] = File(...),
    admin_user: dict = Depends(get_current_admin)
):
    """
    Ingest a batch of image files. Strips extensions, matches with product SKU,
    uploads to Firebase Storage, and updates product image URL.
    Protected by Firebase JWT validation.
    """
    db = get_database()
    results = {
        "success": [],
        "failed": []
    }

    for file in files:
        filename = file.filename
        # Match SKU from image name
        match = re.match(r"^(.+)\.(jpg|jpeg|png|webp|gif)$", filename, re.IGNORECASE)
        if not match:
            results["failed"].append({
                "filename": filename,
                "reason": "Invalid image extension. Supported: JPG, PNG, WEBP, GIF."
            })
            continue

        sku = match.group(1).strip()
        file_ext = match.group(2).lower()
        content_type = f"image/{'jpeg' if file_ext in ['jpg', 'jpeg'] else file_ext}"

        try:
            # Check if product SKU exists in database
            product = await db.products.find_one({"sku": sku})
            if not product:
                results["failed"].append({
                    "filename": filename,
                    "reason": f"No product found matching SKU '{sku}'."
                })
                continue

            file_bytes = await file.read()
            storage_path = f"products/{sku}.{file_ext}"
            public_url = None

            # Attempt Firebase Storage upload
            try:
                bucket = storage.bucket()
                blob = bucket.blob(storage_path)
                blob.upload_from_string(file_bytes, content_type=content_type)
                blob.make_public()
                public_url = blob.public_url
            except Exception as e:
                # If storage is unconfigured or offline, provide a mock dev fallback URL
                if os.getenv("DEV_MODE", "true").lower() == "true":
                    public_url = f"https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop"
                else:
                    raise e

            # Update the image URL in the database
            await db.products.update_one(
                {"_id": product["_id"]},
                {"$set": {"image_url": public_url}}
            )

            results["success"].append({
                "filename": filename,
                "sku": sku,
                "image_url": public_url
            })
        except Exception as e:
            results["failed"].append({
                "filename": filename,
                "reason": f"Server processing error: {str(e)}"
            })

    return results


@app.post("/api/dev/seed-data")
async def seed_data():
    """
    Helper endpoint to insert sample categories and products for local development.
    """
    db = get_database()
    try:
        # Clear collections first to reset
        await db.categories.delete_many({})
        await db.products.delete_many({})
        await db.orders.delete_many({})

        # Insert Categories
        categories_to_seed = [
            {"name": "Bakery", "slug": "bakery"},
            {"name": "Beverages", "slug": "beverages"},
            {"name": "Dairy & Eggs", "slug": "dairy-eggs"},
            {"name": "Fresh Produce", "slug": "fresh-produce"},
            {"name": "Pantry & Groceries", "slug": "pantry-groceries"}
        ]
        
        cats_inserted = []
        for cat in categories_to_seed:
            res = await db.categories.insert_one(cat)
            cats_inserted.append({**cat, "id": str(res.inserted_id)})

        cats_by_slug = {c["slug"]: c["id"] for c in cats_inserted}

        # Insert Products
        products_to_seed = [
            {
                "sku": "6001234567891",
                "name": "Fresh Whole Wheat Bread",
                "price": 1.89,
                "stock_quantity": 25,
                "description": "Soft and fresh whole wheat sandwich bread.",
                "category_id": cats_by_slug.get("bakery"),
                "image_url": None,
                "is_active": True
            },
            {
                "sku": "6001234567892",
                "name": "Sparkling Orange Soda 500ml",
                "price": 1.15,
                "stock_quantity": 40,
                "description": "Vibrant and bubbly orange soda drink.",
                "category_id": cats_by_slug.get("beverages"),
                "image_url": None,
                "is_active": True
            },
            {
                "sku": "6001234567893",
                "name": "Farm Fresh Eggs Dozen",
                "price": 2.99,
                "stock_quantity": 18,
                "description": "Large farm-fresh brown eggs.",
                "category_id": cats_by_slug.get("dairy-eggs"),
                "image_url": None,
                "is_active": True
            },
            {
                "sku": "6001234567894",
                "name": "Ripe Sweet Bananas 1kg",
                "price": 1.50,
                "stock_quantity": 0,  # Out of stock example
                "description": "Sweet, ripe bananas from local farms.",
                "category_id": cats_by_slug.get("fresh-produce"),
                "image_url": None,
                "is_active": True
            },
            {
                "sku": "6001234567895",
                "name": "Premium Basmati Rice 2kg",
                "price": 4.95,
                "stock_quantity": 30,
                "description": "Aromatic, long-grain basmati rice.",
                "category_id": cats_by_slug.get("pantry-groceries"),
                "image_url": None,
                "is_active": True
            }
        ]

        await db.products.insert_many(products_to_seed)

        return {
            "success": True,
            "seeded_categories": len(categories_to_seed),
            "seeded_products": len(products_to_seed)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed MongoDB collections: {str(e)}"
        )


# ==========================================
# Storefront Endpoints
# ==========================================

@app.get("/api/products")
async def get_products():
    """
    Get all active products from MongoDB.
    """
    db = get_database()
    cursor = db.products.find({"is_active": True})
    prods = await cursor.to_list(length=1000)
    for p in prods:
        p["_id"] = str(p["_id"])
    return prods


@app.get("/api/categories")
async def get_categories():
    """
    Get all categories from MongoDB.
    """
    db = get_database()
    cursor = db.categories.find()
    cats = await cursor.to_list(length=100)
    for c in cats:
        c["_id"] = str(c["_id"])
    return cats


class OrderItemPayload(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)


class OrderPayload(BaseModel):
    customer_name: str
    customer_email: str
    items: List[OrderItemPayload]


@app.post("/api/orders")
async def place_order(payload: OrderPayload):
    """
    Submit an order. Verifies and decrements stock in MongoDB.
    """
    db = get_database()
    total_amount = 0
    order_items = []
    
    # 1. Verify and decrement stock inside MongoDB
    for item in payload.items:
        if not ObjectId.is_valid(item.product_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid product ID: {item.product_id}"
            )
            
        prod = await db.products.find_one({"_id": ObjectId(item.product_id)})
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Product not found: {item.product_id}"
            )
            
        if prod["stock_quantity"] < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Insufficient stock for {prod['name']}. Available: {prod['stock_quantity']}"
            )
            
        # Decrement stock count
        await db.products.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock_quantity": -item.quantity}}
        )
        
        total_amount += prod["price"] * item.quantity
        order_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_time_of_order": prod["price"]
        })
        
    # 2. Insert the completed order document
    new_order = {
        "customer_name": payload.customer_name,
        "customer_email": payload.customer_email,
        "status": "pending",
        "total_amount": total_amount,
        "created_at": datetime.utcnow(),
        "items": order_items
    }
    
    res = await db.orders.insert_one(new_order)
    return {
        "success": True,
        "order_id": str(res.inserted_id),
        "total_amount": total_amount
    }


# ==========================================
# Admin Console Endpoints
# ==========================================

@app.get("/api/admin/products")
async def get_admin_products(admin_user: dict = Depends(get_current_admin)):
    """
    Retrieve all products (active and inactive) for admin enrichment.
    """
    db = get_database()
    cursor = db.products.find()
    prods = await cursor.to_list(length=1000)
    for p in prods:
        p["_id"] = str(p["_id"])
    return prods


class ProductUpdatePayload(BaseModel):
    description: Optional[str] = None
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


@app.put("/api/admin/products/{product_id}")
async def update_product(
    product_id: str,
    payload: ProductUpdatePayload,
    admin_user: dict = Depends(get_current_admin)
):
    """
    Enrich a product with image URLs, categories, description, and status.
    Protected by Firebase.
    """
    db = get_database()
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid product ID format."
        )
        
    update_data = {}
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.category_id is not None:
        update_data["category_id"] = payload.category_id
    if payload.image_url is not None:
        update_data["image_url"] = payload.image_url
    if payload.is_active is not None:
        update_data["is_active"] = payload.is_active
        
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No fields were provided to update."
        )
        
    res = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    
    if res.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Product not found."
        )
        
    return {"success": True}

