# SBI Lab Data Visualization Backend (Python/FastAPI)

A complete FastAPI backend implementation for the SBI Lab data visualization application using MongoDB.

## Features

- **Authentication**: JWT-based user authentication and authorization
- **Data Management**: CSV file upload, processing, and storage
- **Visualization**: Dynamic plot generation with multiple chart types
- **Database**: MongoDB with async operations using Motor
- **API Documentation**: Automatic OpenAPI/Swagger documentation

## Setup Instructions

### Prerequisites

- Python 3.8+
- MongoDB (local or Atlas)
- pip

### Installation

1. **Navigate to the backend-python directory:**
   ```bash
   cd backend-python
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
   
   Update the following variables in `.env`:
   - `MONGODB_URL`: Your MongoDB connection string
   - `JWT_SECRET_KEY`: A secure secret key for JWT tokens
   - `DATABASE_NAME`: Name of your MongoDB database

5. **Start MongoDB:**
   Make sure MongoDB is running on your system.

6. **Run the application:**
   ```bash
   python run.py
   ```

   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token

### Data Management
- `POST /api/data/upload` - Upload CSV dataset
- `GET /api/data/datasets` - Get all user datasets
- `GET /api/data/datasets/{id}` - Get specific dataset with data
- `GET /api/data/datasets/{id}/stats` - Get dataset statistics
- `DELETE /api/data/datasets/{id}` - Delete dataset

### Plot Management
- `POST /api/plots/` - Create a new plot
- `GET /api/plots/` - Get all user plots
- `GET /api/plots/{id}` - Get specific plot
- `PUT /api/plots/{id}` - Update plot
- `DELETE /api/plots/{id}` - Delete plot
- `GET /api/plots/{id}/data` - Get plot visualization data

## Supported Plot Types

- **Scatter Plot**: X vs Y scatter plots
- **Line Plot**: Time series and continuous data
- **Bar Chart**: Categorical data visualization
- **Histogram**: Distribution analysis
- **Box Plot**: Statistical distribution plots

## Project Structure

