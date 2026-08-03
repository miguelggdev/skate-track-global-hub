import { z } from 'zod';

export const editAthleteSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  category: z.enum(['youth', 'junior', 'juvenil', 'senior', 'escuela', 'mayores', 'masters', 'menores', 'transicion', 'prejuvenil']),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'professional', 'escuela_menores', 'transicion', 'mayores', 'escuela', 'mini_infantil', 'pre_infantil', 'infantil', 'junior', 'pre_juvenil', 'prejuveniles', 'juvenil_primer_ano', 'juvenil_segundo_ano', 'juvenil_tercer_ano', 'mayores_unica']),
  status: z.enum(['active', 'inactive', 'injured', 'suspended']),
  gender: z.enum(['masculino', 'femenino']).optional(),
  id_type: z.enum(['Tarjeta de identidad', 'Cedula de Ciudadania', 'Pasaporte', 'Cedula de Extranjeria']).optional(),
  id_number: z.string().optional(),
  athlete_number: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_notes: z.string().optional(),
  achievements: z.string().optional(),
  performance_score: z.coerce.number().min(0).max(100).optional(),
  bio: z.string().optional(),
  // Family fields
  parent_name: z.string().optional(),
  parent_phone: z.string().optional(),
  parent_email: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_relationship: z.string().optional(),
  guardian_phone: z.string().optional(),
  guardian_email: z.string().optional(),
  // Medical/Body fields
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  size: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  surgeries: z.string().optional(),
  injuries: z.string().optional(),
  limitations: z.string().optional(),
  // Studies fields
  education_level: z.string().optional(),
  current_grade: z.string().optional(),
  school_name: z.string().optional(),
  school_address: z.string().optional(),
  school_phone: z.string().optional(),
  school_email: z.string().optional(),
  // Equipment fields
  boot_size: z.coerce.number().optional(),
  wheel_diameter: z.coerce.number().optional(),
  frame_size: z.string().optional(),
  boot_brand: z.string().optional(),
  frame_brand: z.string().optional(),
  track_wheels_brand: z.string().optional(),
  helmet_brand: z.string().optional(),
  // History fields
  years_experience: z.coerce.number().optional(),
  start_date: z.string().optional(),
  league_date: z.string().optional(),
  federation_date: z.string().optional(),
  registration_number: z.string().optional(),
  registration_type: z.enum(['ligado', 'federado', 'escuela', 'nuevo']).optional(),
  is_league: z.boolean().optional(),
  is_federated: z.boolean().optional(),
  previous_club: z.string().optional(),
  // Medical extra
  eps: z.string().optional(),
  accident_insurance: z.string().optional(),
  fractures: z.string().optional(),
  physical_limitations: z.string().optional(),
  lycra_size: z.string().optional(),
  // Deportivo
  specialty: z.enum(['fondista', 'velocista', 'omnium']).optional().or(z.literal('')),
  personal_phone: z.string().optional(),
  // Ubicación
  city_of_birth: z.string().optional(),
  neighborhood: z.string().optional(),
  nationality: z.string().optional(),
  country: z.string().optional(),
});

export type EditAthleteFormData = z.infer<typeof editAthleteSchema>;

export const CATEGORY_LABELS: Record<string, string> = {
  youth: 'Juvenil',
  junior: 'Junior',
  juvenil: 'Juvenil',
  senior: 'Senior',
  escuela: 'Escuela',
  mayores: 'Mayores',
  masters: 'Másters',
  menores: 'Menores',
  transicion: 'Transición',
  prejuvenil: 'Pre-Juvenil',
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  professional: 'Profesional',
  escuela: 'Escuela',
  escuela_menores: 'Escuela Menores',
  mini_infantil: 'Mini Infantil',
  pre_infantil: 'Pre-Infantil',
  infantil: 'Infantil',
  junior: 'Junior',
  transicion: 'Transición',
  pre_juvenil: 'Pre-Juvenil',
  prejuveniles: 'Pre-Juveniles',
  juvenil_primer_ano: 'Juvenil 1er Año',
  juvenil_segundo_ano: 'Juvenil 2do Año',
  juvenil_tercer_ano: 'Juvenil 3er Año',
  mayores: 'Mayores',
  mayores_unica: 'Mayores Única',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  injured: 'Lesionado',
  suspended: 'Suspendido',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  injured: 'bg-red-100 text-red-800',
  suspended: 'bg-yellow-100 text-yellow-800',
};
