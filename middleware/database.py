import os
from datetime import datetime
from typing import Annotated, List, Optional
from bson import ObjectId
from pydantic import BaseModel, Field, BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

# Setup type annotation to handle MongoDB ObjectId mapping to string cleanly in Pydantic v2
PyObjectId = Annotated[str, BeforeValidator(str)]

class CategoryModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    slug: str

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Produce",
                "slug": "produce"
            }
        }

class ProductModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    sku: str = Field(..., description="Unique barcode SKU")
    name: str
    description: Optional[str] = None
    price: float = Field(..., ge=0, description="Synced read-only price from POS")
    stock_quantity: int = Field(..., ge=0, description="Synced read-only stock level from POS")
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    is_active: bool = True

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "sku": "6001234567891",
                "name": "Fresh Milk 2L",
                "price": 2.20,
                "stock_quantity": 25,
                "description": "Fresh whole milk from local dairies.",
                "is_active": True
            }
        }

class OrderItem(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)
    price_at_time_of_order: float = Field(..., ge=0)

class OrderModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    customer_name: str
    customer_email: str
    status: str = Field("pending", description="Order progress status: pending, processing, completed")
    total_amount: float = Field(..., ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    items: List[OrderItem]

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "customer_name": "John Doe",
                "customer_email": "john@example.com",
                "total_amount": 2.20,
                "items": [
                    {
                        "product_id": "507f1f77bcf86cd799439011",
                        "quantity": 1,
                        "price_at_time_of_order": 2.20
                    }
                ]
            }
        }

# ==========================================
# MongoDB Asynchronous Connection Setup
# ==========================================

MONGODB_URL = os.getenv(
    "MONGODB_URL", 
    "mongodb+srv://maplininc_db_user:SG455zCpFt8vKhek@nyaningwe.8oets81.mongodb.net/?appName=nyaningwe"
)
DATABASE_NAME = os.getenv("DATABASE_NAME", "nyaningwe")

client: Optional[AsyncIOMotorClient] = None
db = None

def get_database():
    global client, db
    if db is None:
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
    return db

def close_database():
    global client
    if client:
        client.close()
