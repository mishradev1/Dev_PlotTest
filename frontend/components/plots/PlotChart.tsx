'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PlotData {
  x: number | string;
  y: number | string;
}

interface PlotChartProps {
  plotData: {
    plot: {
      title: string;
      plotType: string;
      xAxis: string;
      yAxis: string;
    };
    data: PlotData[];
  };
}

export default function PlotChart({ plotData }: PlotChartProps) {
  const { plot, data } = plotData;
  
  const getChartData = () => {
    switch (plot.plotType) {
      case 'scatter':
        return {
          datasets: [{
            label: `${plot.xAxis} vs ${plot.yAxis}`,
            data: data.map(point => ({ x: point.x, y: point.y })),
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
          }]
        };
      
      case 'line':
        return {
          labels: data.map(point => point.x),
          datasets: [{
            label: plot.yAxis,
            data: data.map(point => point.y),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          }]
        };
      
      case 'bar':
      case 'histogram':
        return {
          labels: data.map(point => point.x),
          datasets: [{
            label: plot.yAxis || 'Count',
            data: data.map(point => point.y),
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          }]
        };
      
      default:
        return { datasets: [] };
    }
  };

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: plot.title,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: plot.xAxis,
          },
        },
        y: {
          title: {
            display: true,
            text: plot.yAxis || 'Count',
          },
        },
      },
    };

    if (plot.plotType === 'scatter') {
      return {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          x: {
            ...baseOptions.scales.x,
            type: 'linear' as const,
            position: 'bottom' as const,
          },
        },
      };
    }

    return baseOptions;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Chart
        type={plot.plotType === 'scatter' ? 'scatter' : plot.plotType === 'line' ? 'line' : 'bar'}
        data={getChartData()}
        options={getChartOptions()}
      />
    </div>
  );
}