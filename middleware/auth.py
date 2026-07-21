import os
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth

security = HTTPBearer()

# Initialize Firebase Admin SDK
firebase_initialized = False
try:
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
    else:
        # Attempt to initialize using default credentials (ADC)
        firebase_admin.initialize_app()
        firebase_initialized = True
except Exception as e:
    print(f"Warning: Firebase Admin SDK could not be initialized: {e}.")
    print("Mock Authentication fallback enabled for local developer testing.")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency helper to protect admin routes.
    Verifies the client-side Firebase JWT token and returns verified payload.
    Supports a mock token fallback for dev environments.
    """
    token = credentials.credentials
    
    # Dev bypass when Firebase credentials are not yet configured
    if not firebase_initialized or os.getenv("DEV_MODE", "true").lower() == "true":
        if token == "mock-admin-token":
            return {
                "uid": "mock-admin-uid", 
                "email": "admin@nyaningwe.com",
                "name": "Local Admin"
            }
            
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase authorization failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
