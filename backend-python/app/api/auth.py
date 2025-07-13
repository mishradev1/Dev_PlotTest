from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import logging
from app.core.database import get_database
from app.core.security import create_access_token
from app.core.config import settings
from app.models.user import UserCreate, User, Token
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
router = APIRouter()

# Add this new model for JSON login
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterResponse(BaseModel):
    success: bool
    message: str
    user: User
    token: str
    token_type: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: User
    token: str
    token_type: str

@router.post("/register", response_model=RegisterResponse)
async def register(user_create: UserCreate, db = Depends(get_database)):
    """Register a new user"""
    logger.info(f"Registration attempt for email: {user_create.email}")
    user_service = UserService(db)
    
    try:
        user = await user_service.create_user(user_create)
        logger.info(f"User created successfully: {user.email}")
        
        # Create access token for auto-login
        access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return RegisterResponse(
            success=True,
            message="User registered successfully",
            user=user,
            token=access_token,
            token_type="bearer"
        )
    except ValueError as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db = Depends(get_database)):
    """Login with JSON data"""
    logger.info(f"Login attempt for email: {login_data.email}")
    user_service = UserService(db)
    
    try:
        user = await user_service.authenticate_user(login_data.email, login_data.password)
        if not user:
            logger.warning(f"Failed login attempt for email: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        logger.info(f"Successful login for user: {user.email}")
        return LoginResponse(
            success=True,
            message="Login successful",
            user=user,
            token=access_token,
            token_type="bearer"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/login-form", response_model=Token)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_database)):
    """Login with form data (OAuth2 standard)"""
    user_service = UserService(db)
    
    user = await user_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
