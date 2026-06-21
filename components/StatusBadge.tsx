import Badge from './Badge'
import { Icons } from './icons'
import type { Task } from '../types/models'

/**
 * Status and priority badges that pair color with a distinct glyph + text label,
 * so meaning never depends on color alone (color-blind accessibility).
 */

const PRIORITY_META: Record<Task['priority'], { variant: 'error' | 'info' | 'default'; label: string; Icon?: React.ComponentType<any> }> = {
  high: { variant: 'error', label: 'High', Icon: Icons.AlertTriangle },
  normal: { variant: 'info', label: 'Normal', Icon: Icons.Activity },
  low: { variant: 'default', label: 'Low' },
}

const STATUS_META: Record<Task['status'], { variant: 'success' | 'accent' | 'default'; label: string; Icon?: React.ComponentType<any> }> = {
  done: { variant: 'success', label: 'Done', Icon: Icons.Check },
  in_progress: { variant: 'accent', label: 'In progress', Icon: Icons.Refresh },
  todo: { variant: 'default', label: 'To do' },
}

export function PriorityBadge({ priority, size = 'md' }: { priority: Task['priority']; size?: 'sm' | 'md' }) {
  const meta = PRIORITY_META[priority]
  return (
    <Badge variant={meta.variant} size={size} dot={!meta.Icon}>
      {meta.Icon && <meta.Icon size="sm" />}
      {meta.label}
    </Badge>
  )
}

export function TaskStatusBadge({ status, size = 'md' }: { status: Task['status']; size?: 'sm' | 'md' }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant={meta.variant} size={size} dot={!meta.Icon}>
      {meta.Icon && <meta.Icon size="sm" />}
      {meta.label}
    </Badge>
  )
}

export default TaskStatusBadge
