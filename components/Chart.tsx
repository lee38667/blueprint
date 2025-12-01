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
}

export default function ChartComponent({ data, labels, color = '#00E5FF', height = 100 }: ChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
        display: false,
        grid: { display: false }
      },
      y: {
        display: false,
        grid: { display: false },
        min: Math.min(...data) * 0.95,
        max: Math.max(...data) * 1.05
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
        borderColor: color,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
          gradient.addColorStop(0, `${color}33`); // ~20% opacity
          gradient.addColorStop(1, `${color}00`); // 0% opacity
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#000',
        pointBorderColor: color,
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div style={{ height: height, width: '100%' }}>
      <Line options={options} data={chartData} />
    </div>
  );
}
