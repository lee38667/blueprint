// CSV Export Utilities

export function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) return ''

  // Create header row
  const headerRow = headers.join(',')
  
  // Create data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = item[header]
      
      // Handle null/undefined
      if (value === null || value === undefined) return ''
      
      // Handle arrays (e.g., tags)
      if (Array.isArray(value)) return `"${value.join('; ')}"`
      
      // Handle objects (stringify)
      if (typeof value === 'object') return `"${JSON.stringify(value)}"`
      
      // Escape quotes and wrap in quotes if contains comma/newline
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      
      return stringValue
    }).join(',')
  })
  
  return [headerRow, ...dataRows].join('\n')
}

export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function exportNotesToCSV(notes: any[]): void {
  const headers = ['id', 'title', 'content', 'tags', 'created_at', 'updated_at', 'mood']
  const csv = convertToCSV(notes, headers)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`blueprint-notes-${timestamp}.csv`, csv)
}

export function exportTasksToCSV(tasks: any[]): void {
  const headers = ['id', 'title', 'description', 'status', 'priority', 'project', 'due_date', 'created_at', 'completed_at']
  const csv = convertToCSV(tasks, headers)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`blueprint-tasks-${timestamp}.csv`, csv)
}

export function exportFinanceToCSV(logs: any[]): void {
  const headers = ['id', 'type', 'amount', 'category', 'note', 'created_at']
  const csv = convertToCSV(logs, headers)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`blueprint-finance-${timestamp}.csv`, csv)
}

export function exportGoalsToCSV(goals: any[]): void {
  const headers = ['id', 'title', 'category', 'status', 'target_date', 'created_at', 'completed_at']
  const csv = convertToCSV(goals, headers)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`blueprint-goals-${timestamp}.csv`, csv)
}

export function exportSkillsToCSV(skills: any[]): void {
  const headers = ['id', 'name', 'level', 'kind', 'description', 'created_at']
  const csv = convertToCSV(skills, headers)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`blueprint-skills-${timestamp}.csv`, csv)
}

export function exportWorkoutLogsToCSV(logs: any[], workouts: any[]): void {
  const enriched = logs.map((log) => {
    const w = workouts.find((wk) => wk.id === log.workout_id)
    return {
      id: log.id,
      workout: w?.name ?? '',
      day: w?.day ?? '',
      performed_at: log.performed_at,
      notes: log.notes ?? '',
      metrics: log.metrics ?? '',
    }
  })
  const headers = ['id', 'workout', 'day', 'performed_at', 'notes', 'metrics']
  const csv = convertToCSV(enriched, headers)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadCSV(`blueprint-workouts-${timestamp}.csv`, csv)
}
