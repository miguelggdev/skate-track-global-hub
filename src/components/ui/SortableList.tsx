import React from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Generic sortable item ───────────────────────────────────────────────────

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableItem({ id, children, className }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-sm',
        isDragging && 'shadow-lg ring-2 ring-primary/30',
        className
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none flex-shrink-0"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── Generic sortable list ───────────────────────────────────────────────────

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function SortableList<T extends { id: string }>({
  items, onReorder, renderItem, className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === String(active.id));
    const newIndex = items.findIndex(i => i.id === String(over.id));
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className={cn('space-y-2', className)}>
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ─── Training session sortable list ─────────────────────────────────────────

export interface TrainingSessionItem {
  id: string;
  name: string;
  date: string;
  location?: string;
  type?: string;
}

interface SortableTrainingSessionsProps {
  sessions: TrainingSessionItem[];
  onReorder: (sessions: TrainingSessionItem[]) => void;
}

export function SortableTrainingSessions({ sessions, onReorder }: SortableTrainingSessionsProps) {
  const typeColors: Record<string, string> = {
    'Técnica': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    'Resistencia': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    'Velocidad': 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    'Fuerza': 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  };

  return (
    <SortableList
      items={sessions}
      onReorder={onReorder}
      renderItem={(session) => (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{session.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(session.date).toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })}
              {session.location && ` · ${session.location}`}
            </p>
          </div>
          {session.type && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${typeColors[session.type] ?? 'bg-muted text-muted-foreground'}`}>
              {session.type}
            </span>
          )}
        </div>
      )}
    />
  );
}
