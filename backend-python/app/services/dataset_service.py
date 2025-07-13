from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import pandas as pd
import io
import logging
from app.models.dataset import Dataset, DatasetCreate, DataRecord, DatasetStats
from app.models.user import PyObjectId

logger = logging.getLogger(__name__)

class DatasetService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.datasets_collection = database["datasets"]
        self.data_records_collection = database["data_records"]

    async def create_dataset(self, user_id: ObjectId, dataset_create: DatasetCreate, 
                           file_content: bytes, filename: str) -> Dataset:
        """Create a new dataset from uploaded file"""
        # Parse CSV file
        try:
            df = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
        except Exception as e:
            raise ValueError(f"Error parsing CSV file: {str(e)}")
        
        # Create dataset document
        dataset = Dataset(
            **dataset_create.model_dump(),
            user_id=user_id,
            columns=df.columns.tolist(),
            row_count=len(df),
            file_size=len(file_content),
            file_type="csv"
        )
        
        # Convert to dict and ensure user_id is ObjectId
        dataset_dict = dataset.model_dump(exclude={"id"}, by_alias=True)
        dataset_dict["user_id"] = ObjectId(user_id)  # Ensure ObjectId type
        
        logger.info(f"Inserting dataset with user_id: {dataset_dict['user_id']} (type: {type(dataset_dict['user_id'])})")
        
        result = await self.datasets_collection.insert_one(dataset_dict)
        dataset.id = result.inserted_id
        
        # Store data records
        data_records = []
        for index, row in df.iterrows():
            record = DataRecord(
                dataset_id=dataset.id,
                data=row.to_dict(),
                row_index=index
            )
            record_dict = record.model_dump(exclude={"id"}, by_alias=True)
            record_dict["dataset_id"] = ObjectId(dataset.id)  # Ensure ObjectId type
            data_records.append(record_dict)
        
        if data_records:
            await self.data_records_collection.insert_many(data_records)
        
        logger.info(f"Created dataset {dataset.id} for user {user_id}")
        return dataset

    async def get_user_datasets(self, user_id: ObjectId) -> List[Dataset]:
        """Get all datasets for a user"""
        # Ensure user_id is ObjectId
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        logger.info(f"Searching for datasets with user_id: {user_id} (type: {type(user_id)})")
        
        query = {"user_id": user_id}
        cursor = self.datasets_collection.find(query)
        datasets = []
        
        async for doc in cursor:
            logger.info(f"Found dataset: {doc.get('name')} with user_id: {doc.get('user_id')}")
            doc["id"] = str(doc["_id"])  # Convert ObjectId to string
            doc.pop("_id", None)  # Remove the original _id field
            datasets.append(Dataset(**doc))
        
        logger.info(f"Found {len(datasets)} datasets for user {user_id}")
        return datasets

    async def get_dataset_by_id(self, dataset_id: ObjectId, user_id: ObjectId) -> Optional[Dataset]:
        """Get dataset by ID (only if owned by user)"""
        # Ensure ObjectIds
        if isinstance(dataset_id, str):
            dataset_id = ObjectId(dataset_id)
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
            
        doc = await self.datasets_collection.find_one({
            "_id": dataset_id,
            "user_id": user_id
        })
        if doc:
            doc["id"] = str(doc["_id"])
            doc.pop("_id", None)
            return Dataset(**doc)
        return None

    async def get_dataset_data(self, dataset_id: ObjectId, user_id: ObjectId, 
                             limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """Get data records for a dataset"""
        # Verify user owns the dataset
        dataset = await self.get_dataset_by_id(dataset_id, user_id)
        if not dataset:
            return []
        
        # Ensure ObjectId
        if isinstance(dataset_id, str):
            dataset_id = ObjectId(dataset_id)
        
        cursor = self.data_records_collection.find(
            {"dataset_id": dataset_id}
        ).skip(skip).limit(limit).sort("row_index", 1)
        
        data = []
        async for doc in cursor:
            data.append(doc["data"])
        
        return data

    async def get_dataset_stats(self, dataset_id: ObjectId, user_id: ObjectId) -> Optional[DatasetStats]:
        """Get statistical information about the dataset"""
        dataset = await self.get_dataset_by_id(dataset_id, user_id)
        if not dataset:
            return None
        
        # Get all data for stats calculation
        data = await self.get_dataset_data(dataset_id, user_id, limit=10000)
        if not data:
            return None
        
        df = pd.DataFrame(data)
        
        # Calculate stats
        column_types = df.dtypes.apply(str).to_dict()
        missing_values = df.isnull().sum().to_dict()
        
        # Summary statistics for numeric columns
        summary_stats = {}
        numeric_columns = df.select_dtypes(include=['number']).columns
        for col in numeric_columns:
            summary_stats[col] = {
                'mean': float(df[col].mean()) if not df[col].empty else 0,
                'std': float(df[col].std()) if not df[col].empty else 0,
                'min': float(df[col].min()) if not df[col].empty else 0,
                'max': float(df[col].max()) if not df[col].empty else 0,
                'median': float(df[col].median()) if not df[col].empty else 0
            }
        
        return DatasetStats(
            total_rows=len(df),
            total_columns=len(df.columns),
            column_types=column_types,
            missing_values=missing_values,
            summary_stats=summary_stats
        )

    async def delete_dataset(self, dataset_id: ObjectId, user_id: ObjectId) -> bool:
        """Delete a dataset and its data"""
        # Verify user owns the dataset
        dataset = await self.get_dataset_by_id(dataset_id, user_id)
        if not dataset:
            return False
        
        # Ensure ObjectIds
        if isinstance(dataset_id, str):
            dataset_id = ObjectId(dataset_id)
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        # Delete data records
        await self.data_records_collection.delete_many({"dataset_id": dataset_id})
        
        # Delete dataset
        result = await self.datasets_collection.delete_one({
            "_id": dataset_id,
            "user_id": user_id
        })
        
        return result.deleted_count > 0
