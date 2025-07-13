const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    full_name: string;
    is_active: boolean;
  };
  token: string;
  token_type: string;
}

interface Dataset {
  id: string;
  name: string;
  columns: string[];
  rowCount: number;
  createdAt: string;
}

interface DatasetsResponse {
  datasets?: Dataset[];
  data?: Dataset[];
  success?: boolean;
}

interface PlotResponse {
  success: boolean;
}

interface GoogleAuthData {
  email: string;
  name: string;
  google_id: string;
}

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      // Try both storage keys for compatibility
      return localStorage.getItem('access_token') || localStorage.getItem('token');
    }
    return null;
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Network error');
    }
    
    return response.json();
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Registration failed:', result);
        throw new Error(result.detail || result.message || 'Registration failed');
      }
      
      return result;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('API Error:', err);
      throw err;
    }
  }

  async uploadCSV(file: File, datasetName: string, description?: string) {
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('datasetName', datasetName);
    if (description) formData.append('description', description);

    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/data/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return response.json();
  }

  async getDatasets(): Promise<DatasetsResponse | Dataset[]> {
    const response = await this.makeRequest('/data/datasets');
    return response.json();
  }

  async generatePlot(plotData: {
    datasetId: string;
    plotType: string;
    xAxis: string;
    yAxis?: string;
    title?: string;
    filters?: Record<string, unknown>;
  }): Promise<PlotResponse> {
    const response = await this.makeRequest('/plots/generate', {
      method: 'POST',
      body: JSON.stringify(plotData)
    });
    return response.json();
  }

  async googleAuth(googleData: GoogleAuthData): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Google authentication failed');
    }

    const data = await response.json();
    
    // Store the backend JWT token consistently
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('token', data.token); // Keep both for compatibility
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }
}

export const apiService = new ApiService();