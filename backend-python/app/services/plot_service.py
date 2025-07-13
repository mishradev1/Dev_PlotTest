from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import json
from app.models.plot import Plot, PlotCreate, PlotUpdate
from app.services.dataset_service import DatasetService

class PlotService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database["plots"]
        self.dataset_service = DatasetService(database)

    async def create_plot(self, user_id: ObjectId, plot_create: PlotCreate) -> Plot:
        """Create a new plot"""
        # Verify user owns the dataset
        dataset = await self.dataset_service.get_dataset_by_id(plot_create.dataset_id, user_id)
        if not dataset:
            raise ValueError("Dataset not found or access denied")
        
        plot = Plot(
            **plot_create.model_dump(),
            user_id=user_id
        )
        
        result = await self.collection.insert_one(plot.model_dump(exclude={"id"}, by_alias=True))
        plot.id = result.inserted_id
        
        return plot

    async def get_user_plots(self, user_id: ObjectId) -> List[Plot]:
        """Get all plots for a user"""
        cursor = self.collection.find({"user_id": user_id})
        plots = []
        async for doc in cursor:
            doc["id"] = doc["_id"]
            plots.append(Plot(**doc))
        return plots

    async def get_plot_by_id(self, plot_id: ObjectId, user_id: ObjectId) -> Optional[Plot]:
        """Get plot by ID (only if owned by user)"""
        doc = await self.collection.find_one({
            "_id": plot_id,
            "user_id": user_id
        })
        if doc:
            doc["id"] = doc["_id"]
            return Plot(**doc)
        return None

    async def update_plot(self, plot_id: ObjectId, user_id: ObjectId, 
                         plot_update: PlotUpdate) -> Optional[Plot]:
        """Update a plot"""
        update_data = plot_update.model_dump(exclude_unset=True)
        if update_data:
            await self.collection.update_one(
                {"_id": plot_id, "user_id": user_id},
                {"$set": update_data}
            )
        
        return await self.get_plot_by_id(plot_id, user_id)

    async def delete_plot(self, plot_id: ObjectId, user_id: ObjectId) -> bool:
        """Delete a plot"""
        result = await self.collection.delete_one({
            "_id": plot_id,
            "user_id": user_id
        })
        return result.deleted_count > 0

    async def generate_plot_data(self, plot_id: ObjectId, user_id: ObjectId) -> Dict[str, Any]:
        """Generate plot data using Plotly"""
        plot = await self.get_plot_by_id(plot_id, user_id)
        if not plot:
            raise ValueError("Plot not found")
        
        # Get dataset data
        data = await self.dataset_service.get_dataset_data(plot.dataset_id, user_id, limit=10000)
        if not data:
            raise ValueError("No data found for plot")
        
        df = pd.DataFrame(data)
        
        # Generate plot based on type
        if plot.plot_type == "scatter":
            if plot.y_axis and plot.y_axis in df.columns:
                fig = px.scatter(df, x=plot.x_axis, y=plot.y_axis, title=plot.title)
            else:
                # If no y_axis, create scatter with index
                fig = px.scatter(df, x=plot.x_axis, y=df.index, title=plot.title)
        
        elif plot.plot_type == "line":
            if plot.y_axis and plot.y_axis in df.columns:
                fig = px.line(df, x=plot.x_axis, y=plot.y_axis, title=plot.title)
            else:
                fig = px.line(df, x=plot.x_axis, y=df.index, title=plot.title)
        
        elif plot.plot_type == "bar":
            if plot.y_axis and plot.y_axis in df.columns:
                fig = px.bar(df, x=plot.x_axis, y=plot.y_axis, title=plot.title)
            else:
                # Count occurrences for categorical data
                value_counts = df[plot.x_axis].value_counts()
                fig = px.bar(x=value_counts.index, y=value_counts.values, title=plot.title)
        
        elif plot.plot_type == "histogram":
            fig = px.histogram(df, x=plot.x_axis, title=plot.title)
        
        elif plot.plot_type == "box":
            if plot.y_axis and plot.y_axis in df.columns:
                fig = px.box(df, x=plot.x_axis, y=plot.y_axis, title=plot.title)
            else:
                fig = px.box(df, y=plot.x_axis, title=plot.title)
        
        else:
            raise ValueError(f"Unsupported plot type: {plot.plot_type}")
        
        # Apply any custom configuration
        if plot.config:
            fig.update_layout(**plot.config)
        
        return json.loads(fig.to_json())
