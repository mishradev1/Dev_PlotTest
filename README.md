# SBI Lab Task - PlotCSV Data Visualization Application

A full-stack web application for uploading CSV files and creating interactive data visualizations with dynamic axis selection. Features a modern Claude-inspired UI design with smooth animations and responsive layout.

## 🚀 Features

### Authentication & Security
- **JWT Authentication**: Secure user registration and login system
- **Google OAuth**: Sign in with Google integration via NextAuth.js
- **Session Management**: Persistent login sessions with automatic token refresh

### Dashboard Features
- **Modern UI Design**: Claude-inspired interface with warm color palette
- **Animated Elements**: Typing effects and strike-through animations
- **Responsive Layout**: Split-screen design that adapts to mobile devices
- **Clean Dashboard**: Organized three-column layout for different functions

### Data Management
- **CSV Upload**: Drag-and-drop interface with file validation
- **File Processing**: Automatic data type detection and column analysis
- **Recent Files**: View and manage uploaded datasets with metadata
- **Data Preview**: Quick overview of uploaded CSV structure

### Visualization Engine
- **Multiple Plot Types**: Scatter, line, bar charts, and histograms
- **Dynamic Axis Selection**: Choose X and Y axes from available columns
- **Interactive Charts**: Hover effects and data point details
- **Export Options**: Save plots as images or share insights

## 🛠️ Tech Stack

### Backend (Python/FastAPI)
- **FastAPI**: Modern Python web framework with automatic API documentation
- **MongoDB**: NoSQL database with Motor async driver
- **JWT**: Secure token-based authentication
- **Pandas**: Data processing and analysis
- **Plotly**: Advanced plotting library for visualizations
- **Pydantic**: Data validation and settings management

### Frontend (Next.js)
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework with custom warm-gray palette
- **NextAuth.js**: Authentication library with Google OAuth
- **Recharts/Chart.js**: Interactive data visualization components
- **Lucide Icons**: Modern icon library

## 📁 Project Structure

```
SBI-Lab-Task/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── models/            # Pydantic models and database schemas
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic and data processing
│   │   └── utils/             # Helper functions and utilities
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── run.py                # Application runner
│
├── frontend/                  # Next.js frontend
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx          # Main dashboard page
│   │   ├── register/         # Registration page
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── auth/             # Authentication forms
│   │   ├── upload/           # File upload components
│   │   ├── plots/            # Visualization components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utilities and configurations
│   │   ├── auth.ts           # NextAuth configuration
│   │   └── api.ts            # API service functions
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── package.json          # Node.js dependencies
│
└── README.md                 # This file
```

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **MongoDB** (local installation or MongoDB Atlas)
- **Git** for version control

### Backend Setup (Python/FastAPI)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=plotcsv_db
   JWT_SECRET_KEY=your-super-secret-jwt-key-here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. **Start MongoDB:**
   - **Local MongoDB**: Ensure MongoDB service is running
   - **MongoDB Atlas**: Use your Atlas connection string in `MONGODB_URL`

6. **Run the backend server:**
   ```bash
   python run.py
   ```
   
   The API will be available at: http://localhost:8000
   
   **API Documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Frontend Setup (Next.js)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   
   The application will be available at: http://localhost:3000

### Google OAuth Setup (Optional)

1. **Create Google OAuth credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000` to authorized origins
   - Add `http://localhost:3000/api/auth/callback/google` to redirect URIs

2. **Add credentials to frontend `.env.local`:**
   ```env
   GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## 🎯 Usage

1. **Register/Login**: Create an account or sign in with Google
2. **Upload CSV**: Drag and drop your CSV file in the upload section
3. **View Data**: Check recent uploads to see your datasets
4. **Create Plots**: Select dataset, choose plot type, and configure axes
5. **Analyze**: Interact with generated visualizations

## 📊 Supported Plot Types

- **Scatter Plot**: Explore relationships between numeric variables
- **Line Chart**: Show trends over time or ordered data
- **Bar Chart**: Compare categories or show distributions
- **Histogram**: Display distribution of numeric data
- **Box Plot**: Statistical summary with quartiles and outliers

## 🔧 Development

### Backend Development
```bash
# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests (if available)
pytest

# Format code
black app/
isort app/
```

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Type checking
npm run type-check
```

## 🚀 Deployment

### Backend Deployment
- Deploy to platforms like Railway, Render, or DigitalOcean
- Use MongoDB Atlas for production database
- Set environment variables in deployment platform

### Frontend Deployment
- Deploy to Vercel, Netlify, or similar platforms
- Configure environment variables
- Update API URLs for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Backend not starting:**
- Check MongoDB connection
- Verify Python virtual environment is activated
- Ensure all dependencies are installed

**Frontend authentication issues:**
- Verify NEXTAUTH_SECRET is set
- Check API URL configuration
- Ensure backend is running on correct port

**CSV upload failures:**
- Check file format (must be valid CSV)
- Verify file size limits
- Check backend logs for detailed errors

For more detailed troubleshooting, check the logs or create an issue in the repository.

