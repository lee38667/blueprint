import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface GamificationRadarProps {
  labels: string[]
  values: number[]
}

function resolveColor(value: string) {
  if (typeof window === 'undefined') return value
  const match = value.match(/^var\(--([^)]+)\)$/)
  if (!match) return value
  return getComputedStyle(document.documentElement).getPropertyValue(`--${match[1]}`).trim() || value
}

export default function GamificationRadar({ labels, values }: GamificationRadarProps) {
  const accent = resolveColor('var(--theme-accent)')
  const border = resolveColor('var(--theme-border)')
  const muted = resolveColor('var(--theme-text-muted)')

  return (
    <div className="h-64 w-full">
      <Radar
        data={{
          labels,
          datasets: [
            {
              label: 'Hunter Stats',
              data: values,
              borderColor: accent,
              backgroundColor: `${accent}22`,
              pointBackgroundColor: accent,
              pointBorderColor: '#020617',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: accent,
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            r: {
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                display: false,
                stepSize: 20,
              },
              grid: {
                color: border,
              },
              angleLines: {
                color: border,
              },
              pointLabels: {
                color: muted,
                font: {
                  size: 11,
                  family: 'Space Grotesk, sans-serif',
                },
              },
            },
          },
        }}
      />
    </div>
  )
}
