export const CATEGORY_COLORS = {
  escuela:    { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500', hex: '#10b981', label: 'Escuela' },
  mini:       { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500', hex: '#10b981', label: 'Mini' },
  preinfantil:{ bg: 'bg-teal-500/10',    text: 'text-teal-600 dark:text-teal-400',       border: 'border-teal-500/30',    dot: 'bg-teal-500',    hex: '#14b8a6', label: 'Pre-Infantil' },
  infantil:   { bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',       border: 'border-blue-500/30',    dot: 'bg-blue-500',    hex: '#3b82f6', label: 'Infantil' },
  menores:    { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400',   border: 'border-orange-500/30',  dot: 'bg-orange-500',  hex: '#f97316', label: 'Menores' },
  transicion: { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-500/30',   dot: 'bg-amber-500',   hex: '#f59e0b', label: 'Transición' },
  prejuvenil: { bg: 'bg-yellow-500/10',  text: 'text-yellow-600 dark:text-yellow-400',   border: 'border-yellow-500/30',  dot: 'bg-yellow-500',  hex: '#eab308', label: 'Pre-Juvenil' },
  juvenil:    { bg: 'bg-red-500/10',     text: 'text-red-600 dark:text-red-400',         border: 'border-red-500/30',     dot: 'bg-red-500',     hex: '#ef4444', label: 'Juvenil' },
  youth:      { bg: 'bg-red-500/10',     text: 'text-red-600 dark:text-red-400',         border: 'border-red-500/30',     dot: 'bg-red-500',     hex: '#ef4444', label: 'Youth' },
  junior:     { bg: 'bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',   border: 'border-violet-500/30',  dot: 'bg-violet-500',  hex: '#8b5cf6', label: 'Junior' },
  mayores:    { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-500/30',    dot: 'bg-rose-500',    hex: '#f43f5e', label: 'Mayores' },
  senior:     { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-500/30',    dot: 'bg-rose-500',    hex: '#f43f5e', label: 'Senior' },
  masters:    { bg: 'bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400',   border: 'border-purple-500/30',  dot: 'bg-purple-500',  hex: '#a855f7', label: 'Masters' },
} as const;

export type CategoryKey = keyof typeof CATEGORY_COLORS;

export function getCategoryColor(category?: string | null) {
  if (!category) return CATEGORY_COLORS.menores;
  const key = category.toLowerCase().replace(/[áéíóú]/g, (c) => ({ á:'a',é:'e',í:'i',ó:'o',ú:'u' }[c] ?? c)).replace(/[-\s]/g, '') as CategoryKey;
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.menores;
}
