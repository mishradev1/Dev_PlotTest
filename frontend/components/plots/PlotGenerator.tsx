'use client';

import { useState, useEffect } from 'react';
import { BarChart3, LineChart, ScatterChart, Activity } from 'lucide-react';
import { apiService } from '@/lib/api';
import PlotChart from './PlotChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Dataset {
  id: string;
  name: string;
  columns: string[];
  row_count: number;
  created_at: string;
  description?: string;
}

export default function PlotGenerator() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [plotType, setPlotType] = useState('scatter');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [title, setTitle] = useState('');
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const response = await apiService.getDatasets();
      console.log('API Response:', response);
      
      // The backend returns an array of datasets directly
      let datasetsArray = [];
      
      if (Array.isArray(response)) {
        datasetsArray = response;
      } else if (response && Array.isArray(response.datasets)) {
        datasetsArray = response.datasets;
      } else if (response && Array.isArray(response.data)) {
        datasetsArray = response.data;
      } else {
        console.warn('Unexpected response format:', response);
        datasetsArray = [];
      }
      
      // Transform the data to match the interface - backend uses these exact field names
      const transformedDatasets = datasetsArray.map(dataset => ({
        id: dataset.id || dataset._id,
        name: dataset.name,
        columns: dataset.columns,
        row_count: dataset.row_count,
        created_at: dataset.created_at,
        description: dataset.description
      }));
      
      setDatasets(transformedDatasets);
    } catch (err: any) {
      console.error('Failed to load datasets:', err);
      setError('Failed to load datasets: ' + (err.message || 'Unknown error'));
      setDatasets([]);
    }
  };

  const handleDatasetChange = (datasetId: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    setSelectedDataset(dataset || null);
    setXAxis('');
    setYAxis('');
    setPlotData(null);
  };

  const generatePlot = async () => {
    if (!selectedDataset || !xAxis) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiService.generatePlot({
        datasetId: selectedDataset.id,
        plotType,
        xAxis,
        yAxis: ['scatter', 'line'].includes(plotType) ? yAxis : undefined,
        title: title || `${plotType} plot of ${xAxis}${yAxis ? ` vs ${yAxis}` : ''}`
      });

      console.log('Plot generation response:', response);

      if (response && response.success) {
        // Extract the actual data array from the response
        let chartData = [];
        
        if (response.data) {
          // If response.data is a Plotly object with data array
          if (response.data.data && Array.isArray(response.data.data)) {
            const plotlyTrace = response.data.data[0];
            if (plotlyTrace && plotlyTrace.x && plotlyTrace.y) {
              chartData = plotlyTrace.x.map((x, i) => ({
                x: x,
                y: plotlyTrace.y[i]
              }));
            }
          }
          // If response.data is already an array
          else if (Array.isArray(response.data)) {
            chartData = response.data;
          }
          // If it's raw data that needs processing
          else {
            chartData = [];
          }
        }

        // Create the structure that PlotChart expects
        const transformedPlotData = {
          plot: {
            id: Date.now().toString(),
            plotType: response.plotType || plotType,
            xAxis: response.xAxis || xAxis,
            yAxis: response.yAxis || yAxis,
            title: response.title || title,
            datasetId: selectedDataset.id
          },
          data: chartData // Ensure this is always an array
        };
        
        console.log('Transformed plot data:', transformedPlotData);
        setPlotData(transformedPlotData);
      } else {
        setError(response?.message || 'Failed to generate plot');
      }
    } catch (err: any) {
      console.error('Plot generation error:', err);
      setError('Failed to generate plot: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const plotTypeIcons = {
    scatter: ScatterChart,
    line: LineChart,
    bar: BarChart3,
    histogram: Activity
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generate Visualization
          </CardTitle>
          <CardDescription>
            Create interactive charts from your datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dataset</label>
              <Select value={selectedDataset?.id || ''} onValueChange={handleDatasetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset..." />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(dataset => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name} ({dataset.row_count} rows)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plot Type</label>
              <Select value={plotType} onValueChange={setPlotType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="histogram">Histogram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDataset && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">X-Axis</label>
                  <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDataset.columns.map(column => (
                        <SelectItem key={column} value={column}>{column}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(['scatter', 'line'].includes(plotType)) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y-Axis</label>
                    <Select value={yAxis} onValueChange={setYAxis}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDataset.columns.map(column => (
                          <SelectItem key={column} value={column}>{column}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Title (Optional)</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${plotType} plot of ${xAxis}${yAxis ? ` vs ${yAxis}` : ''}`}
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          
          {datasets.length === 0 && !error && (
            <p className="text-muted-foreground text-sm">
              No datasets found. Upload a CSV file to get started.
            </p>
          )}

          <Button
            onClick={generatePlot}
            disabled={loading || !selectedDataset || !xAxis || (['scatter', 'line'].includes(plotType) && !yAxis)}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Plot'}
          </Button>
        </CardContent>
      </Card>

      {plotData && plotData.plot && Array.isArray(plotData.data) && (
        <PlotChart plotData={plotData} />
      )}    
      </div>
  );
}