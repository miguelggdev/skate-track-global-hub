import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  variant?: 'default' | 'inline';
  className?: string;
}

const DEFAULT_ICON = (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-30">
    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
    <path d="M28 40h24M40 28v24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export function EmptyState({ icon, title, description, action, variant = 'default', className = '' }: EmptyStateProps) {
  const py = variant === 'inline' ? 'py-8' : 'py-16';
  return (
    <div className={`flex flex-col items-center justify-center text-center ${py} space-y-4 text-muted-foreground ${className}`}>
      <div className="mb-1">{icon ?? DEFAULT_ICON}</div>
      <div className="space-y-1.5 max-w-xs">
        <p className="font-semibold text-foreground text-sm">{title}</p>
        {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {action && (
        <Button size="sm" variant="outline" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
