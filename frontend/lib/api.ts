const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface Dataset {
  id: string;
  name: string;
  columns: string[];
  rowCount: number;
  createdAt: string;
}

interface PlotData {
  x: number | string;
  y: number | string;
}

interface PlotResponse {
  success: boolean;
  plot: {
    id: string;
    title: string;
    plotType: string;
    xAxis: string;
    yAxis: string;
  };
  data: PlotData[];
  dataCount: number;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async login(data: LoginData) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async register(data: RegisterData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async uploadCSV(file: File, datasetName: string, description?: string) {
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('datasetName', datasetName);
    if (description) formData.append('description', description);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/data/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    return response.json();
  }

  async getDatasets(): Promise<{ datasets: Dataset[] }> {
    const response = await fetch(`${API_BASE_URL}/data/datasets`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  async generatePlot(plotData: {
    datasetId: string;
    plotType: string;
    xAxis: string;
    yAxis?: string;
    title?: string;
    filters?: any;
  }): Promise<PlotResponse> {
    const response = await fetch(`${API_BASE_URL}/plots/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(plotData)
    });
    return response.json();
  }
}

export const apiService = new ApiService();