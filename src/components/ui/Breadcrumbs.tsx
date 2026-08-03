import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const navigate = useNavigate();

  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        aria-label="Volver"
      >
        <Home className="h-3.5 w-3.5" />
      </button>

      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
            {isLast || !item.path ? (
              <span className={cn('truncate max-w-[200px]', isLast ? 'text-foreground font-medium' : '')}>
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => navigate(item.path!)}
                className="truncate max-w-[200px] hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
