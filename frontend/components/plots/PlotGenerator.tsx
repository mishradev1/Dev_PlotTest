'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import PlotChart from './PlotChart';

interface Dataset {
  id: string;
  name: string;
  columns: string[];
  rowCount: number;
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
      if (response.datasets) {
        setDatasets(response.datasets);
      }
    } catch (err) {
      setError('Failed to load datasets');
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

      if (response.success) {
        setPlotData(response);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to generate plot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Generate Plot</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset
            </label>
            <select
              value={selectedDataset?.id || ''}
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a dataset...</option>
              {datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.rowCount} rows)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plot Type
            </label>
            <select
              value={plotType}
              onChange={(e) => setPlotType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="scatter">Scatter Plot</option>
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="histogram">Histogram</option>
            </select>
          </div>

          {selectedDataset && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  X-Axis
                </label>
                <select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select column...</option>
                  {selectedDataset.columns.map(column => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>

              {(['scatter', 'line'].includes(plotType)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y-Axis
                  </label>
                  <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select column...</option>
                    {selectedDataset.columns.map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plot Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`${plotType} plot of ${xAxis}${yAxis ? ` vs ${yAxis}` : ''}`}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}
        </div>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <button
          onClick={generatePlot}
          disabled={loading || !selectedDataset || !xAxis || (['scatter', 'line'].includes(plotType) && !yAxis)}
          className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Plot'}
        </button>
      </div>

      {plotData && <PlotChart plotData={plotData} />}
    </div>
  );
}