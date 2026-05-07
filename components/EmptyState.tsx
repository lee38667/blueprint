import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{title}</p>
        {description && <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{description}</p>}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-3 px-4 py-1.5 text-sm rounded-lg transition-colors"
            style={{
              background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--theme-accent) 30%, transparent)',
              color: 'var(--theme-accent)',
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-16 text-center">
      {/* Icon */}
      <div className="text-6xl mb-4" aria-hidden="true">{icon}</div>

      {/* Title */}
      <h3 className="heading-md mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-body max-w-sm mx-auto mb-6">{description}</p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-accent"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
