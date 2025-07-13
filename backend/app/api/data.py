from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from bson import ObjectId
from bson.errors import InvalidId
from app.core.database import get_database
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.dataset import Dataset, DatasetCreate, DatasetResponse, DatasetStats
from app.services.dataset_service import DatasetService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload", response_model=Dataset)
async def upload_dataset(
    name: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Upload a CSV dataset"""
    logger.info(f"Upload attempt by user {current_user.email}, file: {file.filename}")
    logger.info(f"Form data - name: {name}, description: {description}")
    
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported"
        )
    
    # Check file size (limit to 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum 10MB allowed."
        )
    
    dataset_service = DatasetService(db)
    
    try:
        dataset_create = DatasetCreate(name=name, description=description)
        
        logger.info(f"Creating dataset '{name}' for user: {current_user.id}")
        dataset = await dataset_service.create_dataset(
            current_user.id, 
            dataset_create, 
            content, 
            file.filename
        )
        logger.info(f"Dataset created with ID: {dataset.id}")
        return dataset
    
    except ValueError as e:
        logger.error(f"Dataset creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error during dataset upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process dataset"
        )

@router.get("/datasets", response_model=List[Dataset])
async def get_datasets(
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all datasets for the current user"""
    dataset_service = DatasetService(db)
    
    logger.info(f"Fetching datasets for user: {current_user.id} (type: {type(current_user.id)})")
    
    # Debug: Check what's in the database
    all_datasets = []
    async for doc in dataset_service.datasets_collection.find({}):
        all_datasets.append({
            "_id": str(doc.get("_id")),
            "user_id": str(doc.get("user_id")),
            "name": doc.get("name")
        })
    
    logger.info(f"All datasets in database: {all_datasets}")
    logger.info(f"Current user ID: {str(current_user.id)}")
    
    datasets = await dataset_service.get_user_datasets(current_user.id)
    logger.info(f"Found {len(datasets)} datasets for user")
    
    return datasets

@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    limit: int = 100,
    skip: int = 0,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get a specific dataset with sample data"""
    try:
        dataset_obj_id = ObjectId(dataset_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid dataset ID format: {dataset_id}"
        )
    
    dataset_service = DatasetService(db)
    
    dataset = await dataset_service.get_dataset_by_id(dataset_obj_id, current_user.id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Dataset with ID {dataset_id} not found or you don't have access to it"
        )
    
    sample_data = await dataset_service.get_dataset_data(
        dataset_obj_id, current_user.id, limit, skip
    )
    
    return DatasetResponse(dataset=dataset, sample_data=sample_data)

@router.get("/datasets/{dataset_id}/stats", response_model=DatasetStats)
async def get_dataset_stats(
    dataset_id: str,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get statistical information about a dataset"""
    try:
        dataset_obj_id = ObjectId(dataset_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid dataset ID format: {dataset_id}"
        )
    
    dataset_service = DatasetService(db)
    
    stats = await dataset_service.get_dataset_stats(dataset_obj_id, current_user.id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Dataset with ID {dataset_id} not found or you don't have access to it"
        )
    
    return stats

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a dataset"""
    try:
        dataset_obj_id = ObjectId(dataset_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid dataset ID format: {dataset_id}"
        )
    
    dataset_service = DatasetService(db)
    
    success = await dataset_service.delete_dataset(dataset_obj_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Dataset with ID {dataset_id} not found or you don't have access to it"
        )
    
    return {"message": "Dataset deleted successfully"}

# Add a debug endpoint to check all datasets
@router.get("/debug/all-datasets")
async def debug_all_datasets(
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Debug endpoint to see all datasets in database"""
    dataset_service = DatasetService(db)
    
    all_datasets = []
    async for doc in dataset_service.datasets_collection.find({}):
        all_datasets.append({
            "_id": str(doc.get("_id")),
            "user_id": str(doc.get("user_id")),
            "name": doc.get("name", "Unknown"),
            "created_at": str(doc.get("created_at", "Unknown"))
        })
    
    return {
        "current_user_id": str(current_user.id),
        "current_user_email": current_user.email,
        "all_datasets": all_datasets,
        "total_datasets": len(all_datasets)
    }

@router.post("/test-auth")
async def test_auth(
    current_user: User = Depends(get_current_active_user)
):
    """Test authentication endpoint"""
    return {
        "message": "Authentication successful",
        "user_id": str(current_user.id),
        "user_email": current_user.email
    }
