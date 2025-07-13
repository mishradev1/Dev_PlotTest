from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId

class DataRecord(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    dataset_id: PyObjectId
    data: Dict[str, Any]
    row_index: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Dataset(DatasetBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    columns: List[str]
    row_count: int
    file_size: int
    file_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DatasetResponse(BaseModel):
    dataset: Dataset
    sample_data: List[Dict[str, Any]]
    
class DatasetStats(BaseModel):
    total_rows: int
    total_columns: int
    column_types: Dict[str, str]
    missing_values: Dict[str, int]
    summary_stats: Dict[str, Dict[str, Any]]
class DatasetStats(BaseModel):
    total_rows: int
    total_columns: int
    column_types: Dict[str, str]
    missing_values: Dict[str, int]
    summary_stats: Dict[str, Dict[str, Any]]
