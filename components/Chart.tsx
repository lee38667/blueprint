import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useRef } from 'react';

function resolveColor(color: string): string {
  if (typeof window === 'undefined') return color
  const match = color.match(/^var\(--([^)]+)\)$/)
  if (!match) return color
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${match[1]}`).trim()
  return value || color
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  showLegend?: boolean;
  showAxes?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export default function ChartComponent({ 
  data, 
  labels, 
  color = '#00E5FF', 
  height = 100,
  showLegend = false,
  showAxes = false,
  xAxisLabel = '',
  yAxisLabel = '',
  legendPosition = 'top'
}: ChartProps) {
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const resolved = resolveColor(color)

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: showLegend,
        position: legendPosition,
        labels: {
          color: '#a1a1aa',
          font: { size: 12 }
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(10, 10, 10, 0.9)',
        titleColor: '#EDEDED',
        bodyColor: '#C7C7C7',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => ` ${context.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        display: showAxes,
        title: {
          display: showAxes && !!xAxisLabel,
          text: xAxisLabel,
          color: '#a1a1aa',
          font: { size: 11, weight: 500 }
        },
        grid: { 
          display: showAxes,
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#71717a',
          font: { size: 10 }
        }
      },
      y: {
        display: showAxes,
        title: {
          display: showAxes && !!yAxisLabel,
          text: yAxisLabel,
          color: '#a1a1aa',
          font: { size: 11, weight: 500 }
        },
        grid: { 
          display: showAxes,
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#71717a',
          font: { size: 10 }
        },
        min: showAxes ? undefined : Math.min(...data) * 0.95,
        max: showAxes ? undefined : Math.max(...data) * 1.05
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    }
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        borderColor: resolved,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
          gradient.addColorStop(0, `${resolved}33`);
          gradient.addColorStop(1, `${resolved}00`);
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#000',
        pointBorderColor: resolved,
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div style={{ height: height, width: '100%' }}>
      <Line ref={chartRef} options={options} data={chartData} />
    </div>
  );
}
