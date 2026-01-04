// Chart.js configuration helpers with proper labels and legends

export interface ChartEnhancementOptions {
  xAxisLabel?: string
  yAxisLabel?: string
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  showLegend?: boolean
  gridColor?: string
  tooltipEnabled?: boolean
}

export function getEnhancedChartOptions(options: ChartEnhancementOptions = {}) {
  const {
    xAxisLabel = 'Date',
    yAxisLabel = 'Value',
    legendPosition = 'top',
    showLegend = true,
    gridColor = 'rgba(255, 255, 255, 0.1)',
    tooltipEnabled = true
  } = options

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        labels: {
          color: '#a1a1aa', // neutral-400
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: tooltipEnabled,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#00E5FF', // electric
        bodyColor: '#ffffff',
        borderColor: '#00E5FF',
        borderWidth: 1,
        padding: 12,
        displayColors: true
      }
    },
    scales: {
      x: {
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          color: '#a1a1aa',
          font: {
            size: 11,
            weight: '500'
          }
        },
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: '#71717a', // neutral-500
          font: {
            size: 10
          }
        }
      },
      y: {
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: '#a1a1aa',
          font: {
            size: 11,
            weight: '500'
          }
        },
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: '#71717a',
          font: {
            size: 10
          }
        }
      }
    }
  }
}

// Trend calculation utilities
export type TrendDirection = 'up' | 'down' | 'flat'

export interface TrendData {
  direction: TrendDirection
  percentage: number
  color: string
  icon: string
}

/**
 * Calculate trend by comparing recent period vs previous period
 * @param data - Array of values (most recent last)
 * @param periodDays - Number of days to compare (default 7)
 * @param threshold - Percentage threshold for flat (default 5%)
 */
export function calculateTrend(
  data: number[],
  periodDays = 7,
  threshold = 5
): TrendData {
  if (data.length < periodDays * 2) {
    return { direction: 'flat', percentage: 0, color: '#71717a', icon: '➡️' }
  }

  const recentData = data.slice(-periodDays)
  const previousData = data.slice(-periodDays * 2, -periodDays)

  const recentAvg = recentData.reduce((a, b) => a + b, 0) / recentData.length
  const previousAvg = previousData.reduce((a, b) => a + b, 0) / previousData.length

  if (previousAvg === 0) {
    return { direction: 'flat', percentage: 0, color: '#71717a', icon: '➡️' }
  }

  const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100

  if (Math.abs(percentChange) < threshold) {
    return { direction: 'flat', percentage: percentChange, color: '#71717a', icon: '➡️' }
  }

  if (percentChange > 0) {
    return { direction: 'up', percentage: percentChange, color: '#22c55e', icon: '📈' }
  }

  return { direction: 'down', percentage: percentChange, color: '#ef4444', icon: '📉' }
}

/**
 * Format trend data for display
 */
export function formatTrendDisplay(trend: TrendData): string {
  const sign = trend.percentage >= 0 ? '+' : ''
  return `${trend.icon} ${sign}${trend.percentage.toFixed(1)}%`
}

// Chart data formatting helpers
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const formats = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: '2-digit' },
    long: { month: 'long', day: 'numeric', year: 'numeric' }
  }

  return d.toLocaleDateString('en-US', formats[format] as any)
}

// Get last N days of data with proper date labels
export function getLastNDays(n: number): string[] {
  const dates: string[] = []
  const today = new Date()
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(formatDate(date, 'short'))
  }
  
  return dates
}

// Aggregate data by date
export function aggregateByDate<T extends { created_at: string }>(
  data: T[],
  days: number,
  aggregateFn: (items: T[]) => number
): number[] {
  const result: number[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() - i)
    targetDate.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(targetDate)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const dayData = data.filter(item => {
      const itemDate = new Date(item.created_at)
      return itemDate >= targetDate && itemDate < nextDate
    })
    
    result.push(aggregateFn(dayData))
  }
  
  return result
}
