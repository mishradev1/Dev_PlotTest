'use client';

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
import { Scatter, Line, Bar } from 'react-chartjs-2';

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
  
  const getScatterData = () => ({
    datasets: [{
      label: `${plot.xAxis} vs ${plot.yAxis}`,
      data: data.map(point => ({ x: Number(point.x), y: Number(point.y) })),
      backgroundColor: 'rgba(222, 92, 42, 0.6)',
      borderColor: 'rgba(222, 92, 42, 1)',
    }]
  });

  const getLineData = () => ({
    labels: data.map(point => String(point.x)),
    datasets: [{
      label: plot.yAxis,
      data: data.map(point => Number(point.y)),
      borderColor: 'rgba(222, 92, 42, 1)',
      backgroundColor: 'rgba(222, 92, 42, 0.1)',
      fill: true,
      tension: 0.1,
    }]
  });

  const getBarData = () => ({
    labels: data.map(point => String(point.x)),
    datasets: [{
      label: plot.yAxis || 'Count',
      data: data.map(point => Number(point.y)),
      backgroundColor: 'rgba(222, 92, 42, 0.6)',
      borderColor: 'rgba(222, 92, 42, 1)',
      borderWidth: 1,
    }]
  });

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
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

  const renderChart = () => {
    switch (plot.plotType) {
      case 'scatter':
        return (
          <Scatter
            data={getScatterData()}
            options={getChartOptions()}
          />
        );
      
      case 'line':
        return (
          <Line
            data={getLineData()}
            options={getChartOptions()}
          />
        );
      
      case 'bar':
      case 'histogram':
      default:
        return (
          <Bar
            data={getBarData()}
            options={getChartOptions()}
          />
        );
    }
  };

  return (
    <div className="w-full h-full">
      {renderChart()}
    </div>
  );
}