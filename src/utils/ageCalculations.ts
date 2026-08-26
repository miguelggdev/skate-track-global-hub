// Re-exports de la nueva lógica de categorías FCP/World Skate
export {
  calcularEdadDeportiva,
  obtenerCategoria,
  calcularCategoria,
  getWheelLimitMm,
  getPremiadosCount,
  getMedalType,
  type CutoffSystem,
  type CategoryResult,
} from './calculateCategory';

// ── Legacy exports (compatibilidad hacia atrás) ──────────────────────────────

/** @deprecated Usar calcularEdadDeportiva() + obtenerCategoria() */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

/** @deprecated Usar calcularCategoria() con sistema 'fcp' */
export function getCategoryFromAge(age: number): string {
  if (age <= 10) return 'menores';
  if (age <= 13) return 'transicion';
  if (age === 14) return 'prejuvenil';
  if (age >= 15 && age <= 17) return 'juvenil';
  if (age >= 18 && age < 35) return 'mayores';
  if (age >= 35) return 'masters';
  return 'menores';
}

/** @deprecated Usar obtenerCategoria() que retorna el objeto completo */
export function getLevelFromCategoryAndAge(category: string, age: number): string {
  if (category === 'juvenil') {
    if (age === 15) return 'juvenil_primer_ano';
    if (age === 16) return 'juvenil_segundo_ano';
    if (age === 17) return 'juvenil_tercer_ano';
  }
  return category;
}

/** @deprecated Usar obtenerCategoria().category */
export function getCategoryDisplayName(category: string): string {
  const map: Record<string, string> = {
    escuela: 'Escuela', menores: 'Menores', transicion: 'Transición', prejuvenil: 'Prejuvenil',
    juvenil: 'Juvenil', mayores: 'Mayores', masters: 'Masters',
  };
  return map[category] ?? category;
}

/** @deprecated Usar obtenerCategoria().category */
export function getLevelDisplayName(level: string): string {
  const map: Record<string, string> = {
    juvenil_primer_ano: 'Juvenil 1er año',
    juvenil_segundo_ano: 'Juvenil 2do año',
    juvenil_tercer_ano: 'Juvenil 3er año',
    mayores_unica: 'Mayores',
  };
  return map[level] ?? level;
}
