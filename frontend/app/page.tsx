'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Upload, FileText, Calendar } from 'lucide-react';
import CSVUpload from '@/components/upload/CSVUpload';
import PlotGenerator from '@/components/plots/PlotGenerator';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/lib/api';

interface Dataset {
  id: string;
  name: string;
  columns: string[];
  row_count: number;
  created_at: string;
  description?: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [refreshData, setRefreshData] = useState(0);
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    username?: string;
    name?: string;
  } | null>(null);
  const [recentUploads, setRecentUploads] = useState<Dataset[]>([]);

  useEffect(() => {
    // Check NextAuth session first
    if (session && session.user) {
      const userData = {
        id: session.user.email,
        email: session.user.email,
        username: session.user.name,
        name: session.user.name
      };
      
      // Use the backend JWT token from session if available
      const backendToken = session.accessToken;
      if (backendToken) {
        localStorage.setItem('access_token', backendToken);
        localStorage.setItem('token', backendToken);
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Check localStorage for regular auth
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRecentUploads();
    }
  }, [isAuthenticated, refreshData]);

  const loadRecentUploads = async () => {
    try {
      const response = await apiService.getDatasets();
      let datasetsArray = [];
      
      if (Array.isArray(response)) {
        datasetsArray = response;
      } else if (response && Array.isArray(response.datasets)) {
        datasetsArray = response.datasets;
      } else if (response && Array.isArray(response.data)) {
        datasetsArray = response.data;
      }
      
      const transformedDatasets = datasetsArray.map(dataset => ({
        id: dataset.id || dataset._id,
        name: dataset.name,
        columns: dataset.columns,
        row_count: dataset.row_count,
        created_at: dataset.created_at,
        description: dataset.description
      }));
      
      setRecentUploads(transformedDatasets);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to load recent uploads:', error);
      setRecentUploads([]);
    }
  };

  const handleAuthSuccess = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      // Sign out from NextAuth first
      await signOut({ 
        redirect: false,
        callbackUrl: '/' 
      });
      
      // Then clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Update state
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: still clear localStorage and state
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleUploadSuccess = () => {
    setRefreshData(prev => prev + 1);
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#faf9f7'}}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: '#a8a29e'}}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <LoginForm onSuccess={handleAuthSuccess} onToggleMode={toggleAuthMode} />
    ) : (
      <RegisterForm onSuccess={handleAuthSuccess} onToggleMode={toggleAuthMode} />
    );
  }

  return (
    <div className="min-h-screen flex items-center" style={{backgroundColor: '#faf9f7'}}>
      {/* Main Content - Dashboard Container */}
      <main className="w-full p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Box with margins */}
          <div className="border rounded-lg shadow-sm p-6" style={{backgroundColor: '#fefdfb', borderColor: '#d6d3d1'}}>
            {/* Dashboard Header */}
            <div className="mb-6 pb-4 border-b flex justify-between items-center" style={{borderColor: '#e7e5e4'}}>
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{color: '#44403c'}}>Dashboard</h1>
                <p style={{color: '#57534e'}}>Welcome back, <span className='font-bold'>{user?.username || user?.name || 'User'}!</span></p>
              </div>
              <Button variant="outline" size="lg" onClick={handleLogout} className="hover:bg-stone-200 text-base" style={{borderColor: '#d6d3d1', color: '#57534e'}}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Three Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload CSV Section */}
              <div className="h-[400px]">
                <Card className="border h-full shadow-sm" style={{borderColor: '#d6d3d1', backgroundColor: '#fefdfb'}}>
                  <CardHeader className="border-b py-3" style={{backgroundColor: '#f5f4f1', borderColor: '#e7e5e4'}}>
                    <CardTitle className="flex items-center gap-2 text-base" style={{color: '#44403c'}}>
                      <Upload className="h-4 w-4" />
                      Upload CSV
                    </CardTitle>
                    <CardDescription className="text-sm" style={{color: '#57534e'}}>
                      Upload your dataset to create visualizations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-90px)] flex flex-col p-4">
                    <CSVUpload onUploadSuccess={handleUploadSuccess} />
                  </CardContent>
                </Card>
              </div>

              {/* Recent Uploads Section */}
              <div className="h-[400px]">
                <Card className="border h-full shadow-sm" style={{borderColor: '#d6d3d1', backgroundColor: '#fefdfb'}}>
                  <CardHeader className="border-b py-3" style={{backgroundColor: '#f5f4f1', borderColor: '#e7e5e4'}}>
                    <CardTitle className="flex items-center gap-2 text-base" style={{color: '#44403c'}}>
                      <FileText className="h-4 w-4" />
                      Recent Uploads
                    </CardTitle>
                    <CardDescription className="text-sm" style={{color: '#57534e'}}>
                      View your recent data uploads
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-90px)] p-4">
                    <div className="h-full rounded-md p-3 border overflow-hidden" style={{backgroundColor: '#f9f8f6', borderColor: '#e7e5e4'}}>
                      {recentUploads.length === 0 ? (
                        <div className="flex items-center justify-center h-full" style={{color: '#78716c'}}>
                          No uploads yet
                        </div>
                      ) : (
                        <div className="space-y-2 h-full overflow-y-auto">
                          {recentUploads.slice(0, 5).map((dataset) => (
                            <div key={dataset.id} className="flex items-center justify-between p-2 rounded border shadow-sm" style={{backgroundColor: '#fefdfb', borderColor: '#e7e5e4'}}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3" style={{color: '#78716c'}} />
                                <div>
                                  <p className="font-medium text-xs" style={{color: '#44403c'}}>{dataset.name}</p>
                                  <p className="text-xs" style={{color: '#78716c'}}>
                                    {dataset.row_count} rows • {dataset.columns.length} columns
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs" style={{color: '#78716c'}}>
                                <Calendar className="h-3 w-3" />
                                {formatDate(dataset.created_at)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Plot Generator Section */}
              <div className="h-[400px]">
                <PlotGenerator refreshTrigger={refreshData} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
