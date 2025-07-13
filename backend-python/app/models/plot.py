from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId

class PlotBase(BaseModel):
    title: str
    plot_type: str  # scatter, line, bar, histogram, etc.
    x_axis: str
    y_axis: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)

class PlotCreate(PlotBase):
    dataset_id: PyObjectId

class PlotUpdate(BaseModel):
    title: Optional[str] = None
    plot_type: Optional[str] = None
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class Plot(PlotBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    dataset_id: PyObjectId
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
