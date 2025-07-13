from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import get_database
from app.core.security import verify_token
from app.services.user_service import UserService
from app.services.google_oauth_service import GoogleOAuthService
from app.models.user import User
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_database)
) -> User:
    """Get current authenticated user - supports both JWT and Google OAuth tokens"""
    try:
        token = credentials.credentials
        logger.info(f"Received token: {token[:20]}..." if token else "No token received")
        
        user_service = UserService(db)
        
        # Check if it's a Google OAuth token (starts with ya29. or 1//)
        if token.startswith('ya29.') or token.startswith('1//'):
            logger.info("Detected Google OAuth token")
            google_service = GoogleOAuthService()
            user_info = await google_service.verify_google_token(token)
            
            if not user_info:
                logger.error("Google token verification returned None")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired Google token",
                )
            
            if not user_info.get('email'):
                logger.error(f"No email in Google token response: {user_info}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No email found in Google token",
                )
            
            email = user_info['email']
            logger.info(f"Google token verified for email: {email}")
            user = await user_service.get_user_by_email(email)
            
            if user is None:
                logger.error(f"User not found for Google email: {email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found. Please register first.",
                )
        else:
            # Handle regular JWT token
            logger.info("Processing JWT token")
            payload = verify_token(token)
            email: str = payload.get("sub")
            
            if email is None:
                logger.error("No email found in JWT token payload")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                )
            
            user = await user_service.get_user_by_email(email)
            
            if user is None:
                logger.error(f"User not found for email: {email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found",
                )
        
        logger.info(f"Successfully authenticated user: {user.email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_current_user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        logger.warning(f"Inactive user attempted access: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user
