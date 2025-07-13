from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.models.user import User, UserCreate, UserInDB, UserUpdate
from app.core.security import get_password_hash, verify_password

class UserService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database["users"]

    async def create_user(self, user_create: UserCreate) -> User:
        """Create a new user"""
        # Check if user already exists
        existing_user = await self.get_user_by_email(user_create.email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password and create user
        hashed_password = get_password_hash(user_create.password)
        user_in_db = UserInDB(
            **user_create.model_dump(exclude={"password"}),
            hashed_password=hashed_password
        )
        
        result = await self.collection.insert_one(user_in_db.model_dump(exclude={"id"}, by_alias=True))
        user_dict = user_in_db.model_dump()
        user_dict["id"] = result.inserted_id
        
        return User(**user_dict)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        user_doc = await self.collection.find_one({"email": email})
        if user_doc:
            user_doc["id"] = user_doc["_id"]
            return User(**user_doc)
        return None

    async def get_user_by_id(self, user_id: ObjectId) -> Optional[User]:
        """Get user by ID"""
        user_doc = await self.collection.find_one({"_id": user_id})
        if user_doc:
            user_doc["id"] = user_doc["_id"]
            return User(**user_doc)
        return None

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user_doc = await self.collection.find_one({"email": email})
        if not user_doc:
            return None
        
        if not verify_password(password, user_doc["hashed_password"]):
            return None
        
        user_doc["id"] = user_doc["_id"]
        return User(**user_doc)

    async def update_user(self, user_id: ObjectId, user_update: UserUpdate) -> Optional[User]:
        """Update user"""
        update_data = user_update.model_dump(exclude_unset=True)
        if update_data:
            await self.collection.update_one(
                {"_id": user_id},
                {"$set": update_data}
            )
        
        return await self.get_user_by_id(user_id)
