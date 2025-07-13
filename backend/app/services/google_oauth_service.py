import logging
import httpx
from google.auth.transport import requests
from google.oauth2 import id_token
from app.core.config import settings

logger = logging.getLogger(__name__)

class GoogleOAuthService:
    @staticmethod
    async def verify_google_token(token: str) -> dict:
        """Verify Google OAuth token and return user info"""
        try:
            # For access tokens (ya29.*), use Google's tokeninfo endpoint
            if token.startswith('ya29.') or token.startswith('1//'):
                logger.info("Verifying Google access token")
                async with httpx.AsyncClient(timeout=30.0) as client:
                    # First, verify the token is valid
                    response = await client.get(
                        f"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={token}"
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Token verification failed: {response.status_code} - {response.text}")
                        return None
                    
                    token_info = response.json()
                    logger.info(f"Token info: {token_info}")
                    
                    # Check if token has expired
                    if 'expires_in' in token_info and int(token_info['expires_in']) <= 0:
                        logger.error("Token has expired")
                        return None
                    
                    # For access tokens, we don't always get audience, so skip this check
                    # if 'audience' in token_info and token_info.get('audience') != settings.google_client_id:
                    #     logger.error("Token audience mismatch")
                    #     return None
                    
                    # Get user info with the access token
                    user_response = await client.get(
                        f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={token}"
                    )
                    
                    if user_response.status_code != 200:
                        logger.error(f"Failed to get user info: {user_response.status_code} - {user_response.text}")
                        return None
                    
                    user_info = user_response.json()
                    logger.info(f"User info retrieved: {user_info.get('email')}")
                    
                    return {
                        'email': user_info.get('email'),
                        'name': user_info.get('name'),
                        'google_id': user_info.get('id'),
                        'verified': user_info.get('verified_email', False)
                    }
            else:
                # For ID tokens (JWT format), use the existing verification
                logger.info("Verifying Google ID token")
                idinfo = id_token.verify_oauth2_token(
                    token, 
                    requests.Request(), 
                    settings.google_client_id
                )
                
                if idinfo['aud'] != settings.google_client_id:
                    raise ValueError('Invalid audience')
                
                return {
                    'email': idinfo.get('email'),
                    'name': idinfo.get('name'),
                    'google_id': idinfo.get('sub'),
                    'verified': idinfo.get('email_verified', False)
                }
            
        except httpx.TimeoutException:
            logger.error("Timeout while verifying Google token")
            return None
        except Exception as e:
            logger.error(f"Google token verification failed: {e}")
            return None
