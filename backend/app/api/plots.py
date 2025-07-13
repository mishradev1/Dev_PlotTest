from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from pydantic import BaseModel
from app.core.database import get_database
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.plot import Plot, PlotCreate, PlotUpdate
from app.services.plot_service import PlotService

router = APIRouter()

# Add this new model for direct plot generation
class PlotGenerateRequest(BaseModel):
    datasetId: str
    plotType: str
    xAxis: str
    yAxis: str = None
    title: str = None

@router.post("/generate")
async def generate_plot(
    plot_request: PlotGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
) -> Dict[str, Any]:
    """Generate a plot directly without saving it"""
    plot_service = PlotService(db)
    
    try:
        # Convert datasetId to ObjectId
        dataset_obj_id = ObjectId(plot_request.datasetId)
    except:
        raise HTTPException(status_code=400, detail="Invalid dataset ID")
    
    try:
        # Verify user owns the dataset
        dataset = await plot_service.dataset_service.get_dataset_by_id(dataset_obj_id, current_user.id)
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found or access denied"
            )
        
        # Get dataset data
        data = await plot_service.dataset_service.get_dataset_data(dataset_obj_id, current_user.id, limit=10000)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data found for plot"
            )
        
        import pandas as pd
        import plotly.express as px
        import json
        
        df = pd.DataFrame(data)
        
        # Validate columns exist
        if plot_request.xAxis not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Column '{plot_request.xAxis}' not found in dataset"
            )
        
        if plot_request.yAxis and plot_request.yAxis not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Column '{plot_request.yAxis}' not found in dataset"
            )
        
        # Generate plot based on type
        title = plot_request.title or f"{plot_request.plotType} plot of {plot_request.xAxis}{' vs ' + plot_request.yAxis if plot_request.yAxis else ''}"
        
        if plot_request.plotType == "scatter":
            if plot_request.yAxis:
                fig = px.scatter(df, x=plot_request.xAxis, y=plot_request.yAxis, title=title)
            else:
                fig = px.scatter(df, x=plot_request.xAxis, y=df.index, title=title)
        
        elif plot_request.plotType == "line":
            if plot_request.yAxis:
                fig = px.line(df, x=plot_request.xAxis, y=plot_request.yAxis, title=title)
            else:
                fig = px.line(df, x=plot_request.xAxis, y=df.index, title=title)
        
        elif plot_request.plotType == "bar":
            if plot_request.yAxis:
                fig = px.bar(df, x=plot_request.xAxis, y=plot_request.yAxis, title=title)
            else:
                # Count occurrences for categorical data
                value_counts = df[plot_request.xAxis].value_counts()
                fig = px.bar(x=value_counts.index, y=value_counts.values, title=title)
                fig.update_xaxes(title=plot_request.xAxis)
                fig.update_yaxes(title="Count")
        
        elif plot_request.plotType == "histogram":
            fig = px.histogram(df, x=plot_request.xAxis, title=title)
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported plot type: {plot_request.plotType}"
            )
        
        # Convert to JSON
        plot_json = json.loads(fig.to_json())
        
        return {
            "success": True,
            "data": plot_json,
            "title": title,
            "plotType": plot_request.plotType,
            "xAxis": plot_request.xAxis,
            "yAxis": plot_request.yAxis
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate plot: {str(e)}"
        )

# ...existing code for other endpoints...
@router.post("/", response_model=Plot)
async def create_plot(
    plot_create: PlotCreate,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new plot"""
    plot_service = PlotService(db)
    
    try:
        plot = await plot_service.create_plot(current_user.id, plot_create)
        return plot
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[Plot])
async def get_plots(
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all plots for the current user"""
    plot_service = PlotService(db)
    return await plot_service.get_user_plots(current_user.id)

@router.get("/{plot_id}", response_model=Plot)
async def get_plot(
    plot_id: str,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get a specific plot"""
    try:
        plot_obj_id = ObjectId(plot_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid plot ID")
    
    plot_service = PlotService(db)
    
    plot = await plot_service.get_plot_by_id(plot_obj_id, current_user.id)
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    return plot

@router.put("/{plot_id}", response_model=Plot)
async def update_plot(
    plot_id: str,
    plot_update: PlotUpdate,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a plot"""
    try:
        plot_obj_id = ObjectId(plot_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid plot ID")
    
    plot_service = PlotService(db)
    
    plot = await plot_service.update_plot(plot_obj_id, current_user.id, plot_update)
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    return plot

@router.delete("/{plot_id}")
async def delete_plot(
    plot_id: str,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a plot"""
    try:
        plot_obj_id = ObjectId(plot_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid plot ID")
    
    plot_service = PlotService(db)
    
    success = await plot_service.delete_plot(plot_obj_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    return {"message": "Plot deleted successfully"}

@router.get("/{plot_id}/data")
async def get_plot_data(
    plot_id: str,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_database)
) -> Dict[str, Any]:
    """Get plot data for visualization"""
    try:
        plot_obj_id = ObjectId(plot_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid plot ID")
    
    plot_service = PlotService(db)
    
    try:
        plot_data = await plot_service.generate_plot_data(plot_obj_id, current_user.id)
        return plot_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )