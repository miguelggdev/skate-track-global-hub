export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function getCategoryFromAge(age: number): string {
  if (age >= 5 && age <= 6) return 'escuela';
  if (age >= 7 && age <= 10) return 'menores';
  if (age >= 11 && age <= 13) return 'transicion';
  if (age === 14) return 'prejuvenil';
  if (age >= 15 && age <= 17) return 'juvenil';
  if (age >= 18) return 'mayores';
  
  // Default fallback
  return 'escuela';
}

export function getLevelFromCategoryAndAge(category: string, age: number): string {
  switch (category) {
    case 'escuela':
      return 'escuela';
      
    case 'menores':
      if (age === 7) return 'mini_infantil';
      if (age === 9) return 'pre_infantil';
      if (age === 10) return 'infantil';
      return 'mini_infantil'; // default for age 8
      
    case 'transicion':
      if (age === 11) return 'pre_infantil';
      if (age === 12) return 'infantil';
      if (age === 13) return 'junior';
      return 'pre_infantil'; // default
      
    case 'prejuvenil':
      return 'pre_juvenil';
      
    case 'juvenil':
      if (age === 14) return 'prejuveniles';
      if (age === 15) return 'juvenil_primer_ano';
      if (age === 16) return 'juvenil_segundo_ano';
      if (age === 17) return 'juvenil_tercer_ano';
      return 'prejuveniles'; // default
      
    case 'mayores':
      return 'mayores_unica';
      
    default:
      return 'escuela';
  }
}

export function getCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    'escuela': 'Escuela',
    'menores': 'Menores',
    'transicion': 'Transición',
    'prejuvenil': 'Pre-Juvenil',
    'juvenil': 'Juvenil',
    'mayores': 'Mayores'
  };
  
  return displayNames[category] || category;
}

export function getLevelDisplayName(level: string): string {
  const displayNames: Record<string, string> = {
    'escuela': 'Escuela',
    'mini_infantil': 'Mini Infantil',
    'pre_infantil': 'Pre-Infantil',
    'infantil': 'Infantil',
    'junior': 'Junior',
    'pre_juvenil': 'Pre-Juvenil',
    'prejuveniles': 'Pre-Juveniles',
    'juvenil_primer_ano': 'Juvenil Primer Año',
    'juvenil_segundo_ano': 'Juvenil Segundo Año',
    'juvenil_tercer_ano': 'Juvenil Tercer Año',
    'mayores_unica': 'Mayores - Única'
  };
  
  return displayNames[level] || level;
}