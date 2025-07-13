'use client';

import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { apiService } from '@/lib/api';
import PlotChart from './PlotChart';
import { Modal } from '@/components/ui/modal';
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

interface ApiDataset {
  id?: string;
  _id?: string;
  name: string;
  columns: string[];
  row_count: number;
  created_at: string;
  description?: string;
}

interface PlotDataPoint {
  x: number | string;
  y: number | string;
}

interface PlotlyTrace {
  x: (number | string)[];
  y: (number | string)[];
  type?: string;
  name?: string;
}

interface TransformedPlotData {
  plot: {
    id: string;
    plotType: string;
    xAxis: string;
    yAxis?: string;
    title: string;
    datasetId: string;
  };
  data: PlotDataPoint[];
}

interface PlotGeneratorProps {
  refreshTrigger?: number;
}

export default function PlotGenerator({ refreshTrigger }: PlotGeneratorProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [plotType, setPlotType] = useState('scatter');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [title, setTitle] = useState('');
  const [plotData, setPlotData] = useState<TransformedPlotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, [refreshTrigger]);

  const loadDatasets = async () => {
    try {
      const response = await apiService.getDatasets();
      console.log('API Response:', response);
      
      let datasetsArray: ApiDataset[] = [];
      
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
      
      const transformedDatasets: Dataset[] = datasetsArray.map((dataset: ApiDataset) => ({
        id: dataset.id || dataset._id || '',
        name: dataset.name,
        columns: dataset.columns,
        row_count: dataset.row_count,
        created_at: dataset.created_at,
        description: dataset.description
      }));
      
      setDatasets(transformedDatasets);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to load datasets:', error);
      setError('Failed to load datasets: ' + (error.message || 'Unknown error'));
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
        let chartData: PlotDataPoint[] = [];
        
        if (response.data) {
          // Handle Plotly format with nested data array
          if ('data' in response.data && Array.isArray(response.data.data)) {
            const plotlyTrace = response.data.data[0];
            if (plotlyTrace && plotlyTrace.x && plotlyTrace.y) {
              chartData = plotlyTrace.x.map((x: number | string, i: number) => ({
                x: x,
                y: plotlyTrace.y[i]
              }));
            }
          }
          // Handle array of traces
          else if (Array.isArray(response.data)) {
            // Check if it's an array of plot data points
            if (response.data.length > 0 && 'x' in response.data[0] && 'y' in response.data[0]) {
              chartData = response.data as PlotDataPoint[];
            }
            // Check if it's an array of Plotly traces
            else if (response.data.length > 0 && 'x' in response.data[0] && Array.isArray(response.data[0].x)) {
              const trace = response.data[0] as PlotlyTrace;
              chartData = trace.x.map((x: number | string, i: number) => ({
                x: x,
                y: trace.y[i]
              }));
            }
          }
        }

        const transformedPlotData: TransformedPlotData = {
          plot: {
            id: Date.now().toString(),
            plotType: response.plotType || plotType,
            xAxis: response.xAxis || xAxis,
            yAxis: response.yAxis || yAxis,
            title: response.title || title,
            datasetId: selectedDataset.id
          },
          data: chartData
        };
        
        console.log('Transformed plot data:', transformedPlotData);
        setPlotData(transformedPlotData);
        setShowModal(true);
      } else {
        setError(response?.message || 'Failed to generate plot');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Plot generation error:', error);
      setError('Failed to generate plot: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Card className="w-full h-full border shadow-sm" style={{borderColor: '#d6d3d1', backgroundColor: '#fefdfb'}}>
        <CardHeader className="border-b py-3" style={{backgroundColor: '#f5f4f1', borderColor: '#e7e5e4'}}>
          <CardTitle className="flex items-center gap-2 text-base" style={{color: '#44403c'}}>
            <BarChart3 className="h-4 w-4" />
            Generate Visualization
          </CardTitle>
          <CardDescription className="text-sm" style={{color: '#57534e'}}>
            Create interactive charts from your datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 h-[calc(100%-90px)] overflow-y-auto">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{color: '#44403c'}}>Dataset</label>
              <Select value={selectedDataset?.id || ''} onValueChange={handleDatasetChange}>
                <SelectTrigger className="h-8">
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

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{color: '#44403c'}}>Plot Type</label>
              <Select value={plotType} onValueChange={setPlotType}>
                <SelectTrigger className="h-8">
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
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{color: '#44403c'}}>X-Axis</label>
                  <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger className="h-8">
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{color: '#44403c'}}>Y-Axis</label>
                    <Select value={yAxis} onValueChange={setYAxis}>
                      <SelectTrigger className="h-8">
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

                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{color: '#44403c'}}>Title (Optional)</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${plotType} plot of ${xAxis}${yAxis ? ` vs ${yAxis}` : ''}`}
                    className="h-8 text-xs"
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}
          
          {datasets.length === 0 && !error && (
            <p className="text-muted-foreground text-xs">
              No datasets found. Upload a CSV file to get started.
            </p>
          )}

          <Button
            onClick={generatePlot}
            disabled={loading || !selectedDataset || !xAxis || (['scatter', 'line'].includes(plotType) && !yAxis)}
            className="w-full h-8 text-xs"
            style={{backgroundColor: '#78716c', color: '#faf9f7'}}
          >
            {loading ? 'Generating...' : 'Generate Plot'}
          </Button>
        </CardContent>
      </Card>

      <Modal 
        isOpen={showModal} 
        onClose={closeModal}
        title={plotData?.plot?.title || 'Visualization'}
        className="w-[90vw] h-[90vh]"
      >
        {plotData && plotData.plot && Array.isArray(plotData.data) && (
          <div className="h-full">
            <PlotChart plotData={plotData} />
          </div>
        )}
      </Modal>
    </>
  );
}