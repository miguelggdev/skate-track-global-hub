export type CutoffSystem = 'fcp' | 'worldskate';

export interface CategoryResult {
  sportAge: number;
  category: string;
  subdivision: string | null;
  wheelLimitMm: number | null;
  group: 'menores' | 'transicion' | 'mayores' | 'masters';
}

/**
 * FCP: corte 1 de julio. Si cumpleaños es ANTES del 1/jul, usa edad real.
 * Si cumpleaños es el 1/jul o DESPUÉS, edad = año - añoNac - 1.
 * World Skate: corte 31/dic → edad = año - añoNac, sin importar el mes.
 */
export function calcularEdadDeportiva(
  birthDate: Date | string,
  competitionYear: number,
  cutoff: CutoffSystem = 'fcp'
): number {
  const dob = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const birthYear = dob.getFullYear();
  const birthMonth = dob.getMonth(); // 0=ene
  const birthDay = dob.getDate();

  if (cutoff === 'worldskate') {
    return competitionYear - birthYear;
  }

  // FCP: corte 1 de julio (mes=6, día=1) — cumpleaños el 1/jul entra en categoría MAYOR
  const ageRaw = competitionYear - birthYear;
  const cumplioDespuesDeJulio1 = birthMonth > 6 || (birthMonth === 6 && birthDay > 1);
  return cumplioDespuesDeJulio1 ? ageRaw - 1 : ageRaw;
}

export function obtenerCategoria(sportAge: number): CategoryResult {
  const base = { subdivision: null, wheelLimitMm: null };

  if (sportAge <= 7) return { ...base, sportAge, category: 'Mini 7 años', wheelLimitMm: 80, group: 'menores' };
  if (sportAge === 8) return { ...base, sportAge, category: 'Mini 8 años', wheelLimitMm: 80, group: 'menores' };
  if (sportAge === 9) return { ...base, sportAge, category: 'Mini 9 años', wheelLimitMm: 84, group: 'menores' };
  if (sportAge === 10) return { ...base, sportAge, category: 'Mini 10 años', wheelLimitMm: 84, group: 'menores' };
  if (sportAge === 11) return { ...base, sportAge, category: 'Pre-infantil 11 años', wheelLimitMm: 90, group: 'menores' };
  if (sportAge === 12) return { ...base, sportAge, category: 'Infantil 12 años', wheelLimitMm: 100, group: 'menores' };
  if (sportAge === 13) return { ...base, sportAge, category: 'Junior 13 años', wheelLimitMm: 100, group: 'menores' };
  if (sportAge === 14) return { ...base, sportAge, category: 'Prejuvenil 14 años', group: 'transicion' };
  if (sportAge === 15) return { sportAge, category: 'Juvenil 1er año', subdivision: '1er año', wheelLimitMm: null, group: 'transicion' };
  if (sportAge === 16) return { sportAge, category: 'Juvenil 2do año', subdivision: '2do año', wheelLimitMm: null, group: 'transicion' };
  if (sportAge === 17) return { sportAge, category: 'Juvenil 3er año', subdivision: '3er año', wheelLimitMm: null, group: 'transicion' };
  if (sportAge >= 18 && sportAge < 35) return { ...base, sportAge, category: 'Mayores', group: 'mayores' };
  return { ...base, sportAge, category: 'Masters', group: 'masters' };
}

/** Función principal: recibe birthDate + año competencia + sistema de corte → resultado completo */
export function calcularCategoria(
  birthDate: Date | string,
  competitionYear: number,
  cutoff: CutoffSystem = 'fcp'
): CategoryResult {
  const sportAge = calcularEdadDeportiva(birthDate, competitionYear, cutoff);
  return obtenerCategoria(sportAge);
}

/** Devuelve solo el límite de rueda en mm para una edad deportiva (null = sin restricción) */
export function getWheelLimitMm(sportAge: number): number | null {
  return obtenerCategoria(sportAge).wheelLimitMm;
}

/** Número de premiados según Resolución 061 Liga Bogotá */
export function getPremiadosCount(sportAge: number): number {
  if (sportAge <= 7) return 10;
  if (sportAge <= 10) return 7;
  if (sportAge <= 11) return 5;
  return 3;
}

/**
 * Tipo de medalla según Resolución 061:
 * - Mini ≤10: 'destacado' (igualitario)
 * - Pre-infantil 11: 'destacado' (igualitario)
 * - Infantil 12 en adelante: 'gold'/'silver'/'bronze'
 */
export function getMedalType(sportAge: number, position: number): 'gold' | 'silver' | 'bronze' | 'destacado' | null {
  const maxPosicion = getPremiadosCount(sportAge);
  if (position > maxPosicion) return null;

  if (sportAge <= 11) return 'destacado';

  if (sportAge === 12 || sportAge === 13) {
    if (position === 1) return 'gold';
    if (position <= 3) return 'silver';
    if (position <= 5) return 'bronze';
    return null;
  }

  // Prejuvenil en adelante: top 3 clásico
  if (position === 1) return 'gold';
  if (position === 2) return 'silver';
  if (position === 3) return 'bronze';
  return null;
}
