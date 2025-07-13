# PlotCSV Backend API

A robust FastAPI backend for the PlotCSV data visualization application with MongoDB integration.

## Features

- **JWT Authentication**: Secure user authentication with Google OAuth support
- **CSV Processing**: Upload, validate, and process CSV files
- **Plot Generation**: Dynamic chart creation with multiple visualization types
- **MongoDB Integration**: Async database operations with Motor
- **Data Analysis**: Statistical analysis and data insights
- **RESTful API**: Clean API design with automatic documentation

## Tech Stack

- **Framework**: FastAPI with async/await support
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT tokens with Google OAuth integration
- **Data Processing**: Pandas for CSV manipulation
- **Visualization**: Plotly for chart generation
- **Validation**: Pydantic models for data validation

## Setup Instructions

### Prerequisites

- Python 3.8+
- MongoDB (local installation or MongoDB Atlas)
- pip package manager

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables:
   ```env
   # Database
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=plotcsv_db
   
   # Security
   JWT_SECRET_KEY=your-super-secure-secret-key
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_MINUTES=30
   
   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   
   # File Upload
   MAX_FILE_SIZE_MB=10
   ALLOWED_FILE_TYPES=csv
   ```

5. **Start MongoDB:**
   Ensure MongoDB is running on your system or configure Atlas connection.

6. **Run the application:**
   ```bash
   # Development mode
   python run.py
   
   # Or using uvicorn directly
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Access interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # Email/password login
POST /api/auth/google       # Google OAuth login
GET  /api/auth/me          # Get current user info
```

### Dataset Management
```
POST   /api/data/upload           # Upload CSV file
GET    /api/data/datasets         # List user datasets
GET    /api/data/datasets/{id}    # Get dataset details
DELETE /api/data/datasets/{id}    # Delete dataset
GET    /api/data/datasets/{id}/preview  # Preview dataset
```

### Plot Generation
```
POST   /api/plots/              # Create new plot
GET    /api/plots/              # List user plots
GET    /api/plots/{id}          # Get plot details
PUT    /api/plots/{id}          # Update plot
DELETE /api/plots/{id}          # Delete plot
GET    /api/plots/{id}/data     # Get plot data for visualization
```

### Data Analysis
```
GET /api/data/datasets/{id}/stats    # Dataset statistics
GET /api/data/datasets/{id}/columns  # Column information
```

## Supported Visualizations

### Chart Types
- **Scatter Plot**: Correlation analysis between two variables
- **Line Chart**: Time series and trend visualization
- **Bar Chart**: Categorical data comparison
- **Histogram**: Distribution analysis
- **Box Plot**: Statistical distribution with outliers
- **Pie Chart**: Proportion and percentage visualization

### Customization Options
- Color schemes and themes
- Axis labels and titles
- Data filtering and grouping
- Interactive features

## Project Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # MongoDB connection
│   ├── models/              # Pydantic models
│   │   ├── user.py
│   │   ├── dataset.py
│   │   └── plot.py
│   ├── routers/             # API route handlers
│   │   ├── auth.py
│   │   ├── data.py
│   │   └── plots.py
│   ├── services/            # Business logic
│   │   ├── auth_service.py
│   │   ├── data_service.py
│   │   └── plot_service.py
│   └── utils/               # Utility functions
│       ├── auth.py
│       ├── file_handler.py
│       └── validators.py
├── uploads/                 # Temporary file storage
├── requirements.txt
├── run.py                  # Application entry point
└── .env.example           # Environment template
```

## Data Flow

1. **File Upload**: CSV files are validated and stored
2. **Data Processing**: Pandas processes and analyzes data
3. **Storage**: Metadata stored in MongoDB, files in filesystem
4. **Visualization**: Plotly generates interactive charts
5. **API Response**: JSON data returned to frontend

## Error Handling

- **Validation Errors**: Detailed field-level validation
- **Authentication Errors**: JWT and OAuth error handling
- **File Errors**: Upload size and format validation
- **Database Errors**: Connection and query error handling

## Security Features

- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configurable origin restrictions
- **File Validation**: Size and type restrictions
- **Input Sanitization**: SQL injection prevention
- **Rate Limiting**: API endpoint protection

## Development

### Running Tests
```bash
pytest tests/
```

### Code Quality
```bash
# Linting
flake8 app/

# Type checking
mypy app/

# Code formatting
black app/
```

## Deployment

### Environment Variables for Production
```env
# Production Backend
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/plotcsv_prod
DATABASE_NAME=plotcsv_production
JWT_SECRET_KEY=your-super-secure-production-secret
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-app.vercel.app
```

### Frontend Environment Variables
```env
# Production Frontend
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=your-nextauth-production-secret
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

### Docker
```bash
docker build -t plotcsv-backend .
docker run -p 8000:8000 plotcsv-backend
```

### Production Considerations
- Use production WSGI server (Gunicorn)
- Configure MongoDB Atlas for cloud deployment
- Set up proper logging and monitoring
- Enable HTTPS with SSL certificates
- Configure environment-specific settings
- Update Google OAuth redirect URIs for production domain
- Set CORS origins to production frontend URL
```

