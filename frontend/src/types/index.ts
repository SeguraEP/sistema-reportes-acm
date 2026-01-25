//frontend/src/types/index.ts

// Tipos de Usuario
export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  cedula: string;
  rol: 'acm' | 'jefe_patrulla' | 'supervisor' | 'admin';
  telefono?: string;
  fecha_ingreso?: string;
  cargo?: string;
  anio_graduacion?: number;
  cuenta_activa: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de Reporte
export interface Reporte {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  cedula: string;
  zona: string;
  distrito: string;
  circuito: string;
  direccion: string;
  horario_jornada: string;
  hora_reporte: string;
  fecha: string;
  novedad: string;
  reporta: string;
  coordenadas?: string;
  tipo_reporte: string;
  estado: 'pendiente' | 'completado' | 'revisado' | 'archivado';
  url_documento_word?: string;
  created_at: string;
  updated_at: string;
  usuario?: Pick<Usuario, 'nombre_completo' | 'cedula' | 'rol'>;
}

// Tipos de Imagen
export interface ImagenReporte {
  id: string;
  reporte_id: string;
  url_storage: string;
  nombre_archivo: string;
  orden: number;
  created_at: string;
}

// Tipos de Ley/Norma
export interface LeyNorma {
  id: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
  articulos?: Articulo[];
}

export interface Articulo {
  id: string;
  ley_norma_id: string;
  numero_articulo: string;
  contenido: string;
  descripcion_corta?: string;
  created_at: string;
}

// Tipos de Hoja de Vida
export interface DatosPersonales {
  nombres_completos: string;
  cedula: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  nacionalidad?: string;
  estado_civil?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface FormacionAcademica {
  nivel: string;
  institucion?: string;
  titulo?: string;
  anio_inicio?: string;
  anio_fin?: string;
  finalizado: boolean;
  anio_graduacion?: string;
}

export interface ExperienciaLaboral {
  empresa: string;
  cargo: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  funciones: string[];
  logros: string[];
}

export interface CursoCapacitacion {
  nombre: string;
  institucion?: string;
  duracion?: string;
  año?: string;
}

export interface Habilidades {
  tecnicas: string[];
  blandas: string[];
  idiomas: Array<{
    idioma: string;
    nivel: string;
  }>;
}

export interface Referencia {
  nombre: string;
  relacion: string;
  telefono?: string;
  email?: string;
}

export interface InformacionAdicional {
  disponibilidad_viajar: boolean;
  licencia_conducir: string;
  tipo_licencia: string;
  discapacidad: boolean;
  tipo_discapacidad: string;
}

export interface HojaVida {
  id: string;
  usuario_id: string;
  datos_personales: DatosPersonales;
  formacion_academica: FormacionAcademica[];
  experiencia_laboral: ExperienciaLaboral[];
  cursos_capacitaciones: CursoCapacitacion[];
  habilidades: Habilidades;
  referencias: Referencia[];
  informacion_adicional: InformacionAdicional;
  created_at: string;
  updated_at: string;
  usuario?: Usuario;
}

// Tipos de Filtros
export interface FiltrosReporte {
  fecha_desde?: string;
  fecha_hasta?: string;
  zona?: string;
  distrito?: string;
  circuito?: string;
  usuario_id?: string;
  estado?: 'pendiente' | 'completado' | 'revisado' | 'archivado';
}

// Tipos de Respuesta API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface Paginacion {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponsePaginada<T> extends ApiResponse<T> {
  paginacion: Paginacion;
}

// Tipos de Sesión
export interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    rol: string;
    cedula: string;
    accessToken: string;
    refreshToken: string;
  };
  expires: string;
}

// Tipos de Errores
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
}

// Tipos de Zonas
export interface Zona {
  value: string;
  label: string;
  distritos: string[];
  circuitos?: string[];
}

// Tipos de Estadísticas
export interface Estadisticas {
  total: number;
  por_zona: Record<string, number>;
  por_distrito: Record<string, number>;
  por_mes: Record<string, number>;
  completados?: number;
  pendientes?: number;
  revisados?: number;
  archivados?: number;
}

// Tipos de Documento
export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  fecha_subida: string;
  tamanio?: number;
  usuario_id?: string;
  reporte_id?: string;
}