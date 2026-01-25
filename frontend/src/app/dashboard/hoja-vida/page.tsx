//frontend/src/app/dashboard/hoja-vida/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Alert,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Fab,
  Tooltip,
  Backdrop,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  MenuBook as MenuBookIcon,
  Build as BuildIcon,
  Language as LanguageIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { UsuarioService, type HojaVida, type Usuario } from '@/services/usuario.service';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme, useMediaQuery } from '@mui/material';

// Esquema de validación para hoja de vida
const hojaVidaSchema = z.object({
  datos_personales: z.object({
    nombres_completos: z.string().min(1, 'Nombres completos son requeridos'),
    cedula: z.string().min(1, 'Cédula es requerida'),
    fecha_nacimiento: z.string().optional(),
    lugar_nacimiento: z.string().optional(),
    nacionalidad: z.string().optional(),
    estado_civil: z.string().optional(),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email('Email no válido').optional()
  }),
  formacion_academica: z.array(z.object({
    nivel: z.string().min(1, 'Nivel es requerido'),
    institucion: z.string().optional(),
    titulo: z.string().optional(),
    anio_inicio: z.string().optional(),
    anio_fin: z.string().optional(),
    finalizado: z.boolean().default(true),
    anio_graduacion: z.string().optional()
  })).default([]),
  experiencia_laboral: z.array(z.object({
    empresa: z.string().min(1, 'Empresa es requerida'),
    cargo: z.string().min(1, 'Cargo es requerido'),
    fecha_inicio: z.string().optional(),
    fecha_fin: z.string().optional(),
    funciones: z.array(z.string()).default([]),
    logros: z.array(z.string()).default([])
  })).default([]),
  cursos_capacitaciones: z.array(z.object({
    nombre: z.string().min(1, 'Nombre del curso es requerido'),
    institucion: z.string().optional(),
    duracion: z.string().optional(),
    año: z.string().optional()
  })).default([]),
  habilidades: z.object({
    tecnicas: z.array(z.string()).default([]),
    blandas: z.array(z.string()).default([]),
    idiomas: z.array(z.object({
      idioma: z.string().min(1, 'Idioma es requerido'),
      nivel: z.string().min(1, 'Nivel es requerido')
    })).default([])
  }).default({ tecnicas: [], blandas: [], idiomas: [] }),
  referencias: z.array(z.object({
    nombre: z.string().min(1, 'Nombre es requerido'),
    relacion: z.string().min(1, 'Relación es requerida'),
    telefono: z.string().optional(),
    email: z.string().email('Email no válido').optional()
  })).default([]),
  informacion_adicional: z.object({
    disponibilidad_viajar: z.boolean().default(false),
    licencia_conducir: z.string().default(''),
    tipo_licencia: z.string().default(''),
    discapacidad: z.boolean().default(false),
    tipo_discapacidad: z.string().default('')
  }).default({
    disponibilidad_viajar: false,
    licencia_conducir: '',
    tipo_licencia: '',
    discapacidad: false,
    tipo_discapacidad: ''
  })
});

type HojaVidaFormData = z.infer<typeof hojaVidaSchema>;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hoja-vida-tabpanel-${index}`}
      aria-labelledby={`hoja-vida-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const nivelesEducativos = [
  'Primaria',
  'Secundaria',
  'Bachillerato',
  'Tecnología',
  'Técnico',
  'Tecnólogo',
  'Pregrado',
  'Licenciatura',
  'Ingeniería',
  'Posgrado',
  'Maestría',
  'Doctorado',
  'Especialización'
];

const idiomasDisponibles = [
  'Español',
  'Inglés',
  'Francés',
  'Alemán',
  'Italiano',
  'Portugués',
  'Chino',
  'Japonés',
  'Coreano',
  'Ruso',
  'Árabe'
];

const nivelesIdioma = [
  'Básico',
  'Intermedio',
  'Avanzado',
  'Nativo',
  'Fluido'
];

export default function HojaVidaPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
   const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [hojaVida, setHojaVida] = useState<HojaVida | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [dialogDescargarOpen, setDialogDescargarOpen] = useState(false);
  const [dialogConfirmarGuardar, setDialogConfirmarGuardar] = useState(false);
  const [expandedFormacion, setExpandedFormacion] = useState<number | false>(0);
  const [expandedExperiencia, setExpandedExperiencia] = useState<number | false>(0);
  const [showDownloadAlert, setShowDownloadAlert] = useState(false);
const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'word' | null>(null);
  const { 
    control, 
    handleSubmit, 
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    getValues
  } = useForm<HojaVidaFormData>({
    resolver: zodResolver(hojaVidaSchema) as any,
    defaultValues: {
      datos_personales: {
        nombres_completos: '',
        cedula: '',
        fecha_nacimiento: '',
        lugar_nacimiento: '',
        nacionalidad: '',
        estado_civil: '',
        direccion: '',
        telefono: '',
        email: ''
      },
      formacion_academica: [],
      experiencia_laboral: [],
      cursos_capacitaciones: [],
      habilidades: {
        tecnicas: [],
        blandas: [],
        idiomas: []
      },
      referencias: [],
      informacion_adicional: {
        disponibilidad_viajar: false,
        licencia_conducir: '',
        tipo_licencia: '',
        discapacidad: false,
        tipo_discapacidad: ''
      }
    }
  });

  const { 
    fields: formacionFields, 
    append: appendFormacion, 
    remove: removeFormacion 
  } = useFieldArray({
    control,
    name: 'formacion_academica'
  });

  const { 
    fields: experienciaFields, 
    append: appendExperiencia, 
    remove: removeExperiencia 
  } = useFieldArray({
    control,
    name: 'experiencia_laboral'
  });

  const { 
    fields: cursosFields, 
    append: appendCurso, 
    remove: removeCurso 
  } = useFieldArray({
    control,
    name: 'cursos_capacitaciones'
  });

  const { 
    fields: referenciaFields, 
    append: appendReferencia, 
    remove: removeReferencia 
  } = useFieldArray({
    control,
    name: 'referencias'
  });

  const { 
    fields: idiomaFields, 
    append: appendIdioma, 
    remove: removeIdioma 
  } = useFieldArray({
    control,
    name: 'habilidades.idiomas'
  });
const normalizarNivelAcademico = (nivel?: string) =>
  nivelesEducativos.includes(nivel ?? '') ? nivel! : '';
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Puedes redirigir al login si es necesario
        return;
      }

      setUser(session.user);
    };

    checkSession();
    cargarDatos();
  }, []);
const cargarDatos = async () => {
  try {
    setLoading(true);
    setError('');

    const usuarioData = await UsuarioService.obtenerMiPerfil();
    setUsuario(usuarioData);

    const hojaVidaData = await UsuarioService.obtenerMiHojaVida();
    console.log('Datos recibidos del backend:', hojaVidaData);
    
    if (hojaVidaData.hoja_vida) {
      // Si existe hoja de vida en la base de datos
      const hojaVidaCompleta = {
        ...hojaVidaData.hoja_vida,
        datos_personales: {
          // Asegurar que NINGÚN campo sea undefined
          nombres_completos: hojaVidaData.hoja_vida.datos_personales?.nombres_completos 
            || usuarioData.nombre_completo 
            || '',
          cedula: hojaVidaData.hoja_vida.datos_personales?.cedula 
            || usuarioData.cedula 
            || '',
          email: hojaVidaData.hoja_vida.datos_personales?.email 
            || usuarioData.email 
            || '',
          telefono: hojaVidaData.hoja_vida.datos_personales?.telefono 
            || usuarioData.telefono 
            || '',
          fecha_nacimiento: hojaVidaData.hoja_vida.datos_personales?.fecha_nacimiento 
            || '',
          lugar_nacimiento: hojaVidaData.hoja_vida.datos_personales?.lugar_nacimiento 
            || '',
          nacionalidad: hojaVidaData.hoja_vida.datos_personales?.nacionalidad 
            || '',
          estado_civil: hojaVidaData.hoja_vida.datos_personales?.estado_civil 
            || '',
          direccion: hojaVidaData.hoja_vida.datos_personales?.direccion 
            || ''
        },
        // Asegurar que todos los arrays existan y no sean undefined
formacion_academica: hojaVidaData.hoja_vida.formacion_academica
  ? hojaVidaData.hoja_vida.formacion_academica.map((item: any) => ({
      nivel: normalizarNivelAcademico(item.nivel),
      institucion: item.institucion || '',
      titulo: item.titulo || '',
      anio_inicio: item.anio_inicio || '',
      anio_fin: item.anio_fin || '',
      finalizado: item.finalizado ?? true,
      anio_graduacion: item.anio_graduacion || ''
    }))
  : [],
        experiencia_laboral: hojaVidaData.hoja_vida.experiencia_laboral 
          ? hojaVidaData.hoja_vida.experiencia_laboral.map((item: any) => ({
              empresa: item.empresa || '',
              cargo: item.cargo || '',
              fecha_inicio: item.fecha_inicio || '',
              fecha_fin: item.fecha_fin || '',
              funciones: Array.isArray(item.funciones) ? item.funciones : [],
              logros: Array.isArray(item.logros) ? item.logros : []
            }))
          : [],
        cursos_capacitaciones: hojaVidaData.hoja_vida.cursos_capacitaciones 
          ? hojaVidaData.hoja_vida.cursos_capacitaciones.map((item: any) => ({
              nombre: item.nombre || '',
              institucion: item.institucion || '',
              duracion: item.duracion || '',
              año: item.año || ''
            }))
          : [],
        habilidades: {
          tecnicas: Array.isArray(hojaVidaData.hoja_vida.habilidades?.tecnicas) 
            ? hojaVidaData.hoja_vida.habilidades.tecnicas 
            : [],
          blandas: Array.isArray(hojaVidaData.hoja_vida.habilidades?.blandas) 
            ? hojaVidaData.hoja_vida.habilidades.blandas 
            : [],
          idiomas: Array.isArray(hojaVidaData.hoja_vida.habilidades?.idiomas) 
            ? hojaVidaData.hoja_vida.habilidades.idiomas.map((item: any) => ({
                idioma: item.idioma || '',
                nivel: item.nivel || ''
              }))
            : []
        },
        referencias: hojaVidaData.hoja_vida.referencias 
          ? hojaVidaData.hoja_vida.referencias.map((item: any) => ({
              nombre: item.nombre || '',
              relacion: item.relacion || '',
              telefono: item.telefono || '',
              email: item.email || ''
            }))
          : [],
        informacion_adicional: {
          // Asegurar que NINGÚN campo sea undefined
          disponibilidad_viajar: hojaVidaData.hoja_vida.informacion_adicional?.disponibilidad_viajar 
            ?? false,
          licencia_conducir: hojaVidaData.hoja_vida.informacion_adicional?.licencia_conducir 
            || '',
          tipo_licencia: hojaVidaData.hoja_vida.informacion_adicional?.tipo_licencia 
            || '', // IMPORTANTE: string vacío, no undefined
          discapacidad: hojaVidaData.hoja_vida.informacion_adicional?.discapacidad 
            ?? false,
          tipo_discapacidad: hojaVidaData.hoja_vida.informacion_adicional?.tipo_discapacidad 
            || ''
        }
      };
      
      console.log('Hoja de vida procesada para formulario:', hojaVidaCompleta);
      setHojaVida(hojaVidaCompleta);
      reset(hojaVidaCompleta);
      
    } else if (hojaVidaData.estructura_inicial) {
      // Usar estructura inicial con datos del usuario
      const estructuraInicial = hojaVidaData.estructura_inicial;
      
      const datosCompletos = {
        datos_personales: {
          nombres_completos: usuarioData.nombre_completo || '',
          cedula: usuarioData.cedula || '',
          email: usuarioData.email || '',
          telefono: usuarioData.telefono || '',
          fecha_nacimiento: estructuraInicial.datos_personales?.fecha_nacimiento || '',
          lugar_nacimiento: estructuraInicial.datos_personales?.lugar_nacimiento || '',
          nacionalidad: estructuraInicial.datos_personales?.nacionalidad || '',
          estado_civil: estructuraInicial.datos_personales?.estado_civil || '',
          direccion: estructuraInicial.datos_personales?.direccion || ''
        },
        formacion_academica: estructuraInicial.formacion_academica 
          ? estructuraInicial.formacion_academica.map((item: any) => ({
              ...item,
              nivel: item.nivel || '',
              institucion: item.institucion || '',
              titulo: item.titulo || '',
              anio_inicio: item.anio_inicio || '',
              anio_fin: item.anio_fin || '',
              finalizado: item.finalizado ?? true,
              anio_graduacion: item.anio_graduacion || ''
            }))
          : [],
        experiencia_laboral: estructuraInicial.experiencia_laboral 
          ? estructuraInicial.experiencia_laboral.map((item: any) => ({
              ...item,
              empresa: item.empresa || '',
              cargo: item.cargo || '',
              fecha_inicio: item.fecha_inicio || '',
              fecha_fin: item.fecha_fin || '',
              funciones: Array.isArray(item.funciones) ? item.funciones : [],
              logros: Array.isArray(item.logros) ? item.logros : []
            }))
          : [],
        cursos_capacitaciones: estructuraInicial.cursos_capacitaciones 
          ? estructuraInicial.cursos_capacitaciones.map((item: any) => ({
              ...item,
              nombre: item.nombre || '',
              institucion: item.institucion || '',
              duracion: item.duracion || '',
              año: item.año || ''
            }))
          : [],
        habilidades: {
          tecnicas: Array.isArray(estructuraInicial.habilidades?.tecnicas) 
            ? estructuraInicial.habilidades.tecnicas 
            : [],
          blandas: Array.isArray(estructuraInicial.habilidades?.blandas) 
            ? estructuraInicial.habilidades.blandas 
            : [],
          idiomas: Array.isArray(estructuraInicial.habilidades?.idiomas) 
            ? estructuraInicial.habilidades.idiomas.map((item: any) => ({
                idioma: item.idioma || '',
                nivel: item.nivel || ''
              }))
            : []
        },
        referencias: estructuraInicial.referencias 
          ? estructuraInicial.referencias.map((item: any) => ({
              ...item,
              nombre: item.nombre || '',
              relacion: item.relacion || '',
              telefono: item.telefono || '',
              email: item.email || ''
            }))
          : [],
        informacion_adicional: {
          disponibilidad_viajar: estructuraInicial.informacion_adicional?.disponibilidad_viajar 
            ?? false,
          licencia_conducir: estructuraInicial.informacion_adicional?.licencia_conducir 
            || '',
          tipo_licencia: estructuraInicial.informacion_adicional?.tipo_licencia 
            || '', // IMPORTANTE: string vacío
          discapacidad: estructuraInicial.informacion_adicional?.discapacidad 
            ?? false,
          tipo_discapacidad: estructuraInicial.informacion_adicional?.tipo_discapacidad 
            || ''
        }
      };
      
      console.log('Estructura inicial procesada:', datosCompletos);
      reset(datosCompletos);
    } else {
      // Si no hay datos, usar valores por defecto
      const datosDefault = {
        datos_personales: {
          nombres_completos: usuarioData.nombre_completo || '',
          cedula: usuarioData.cedula || '',
          fecha_nacimiento: '',
          lugar_nacimiento: '',
          nacionalidad: '',
          estado_civil: '',
          direccion: '',
          telefono: usuarioData.telefono || '',
          email: usuarioData.email || ''
        },
        formacion_academica: [],
        experiencia_laboral: [],
        cursos_capacitaciones: [],
        habilidades: {
          tecnicas: [],
          blandas: [],
          idiomas: []
        },
        referencias: [],
        informacion_adicional: {
          disponibilidad_viajar: false,
          licencia_conducir: '',
          tipo_licencia: '', // Asegurar string vacío
          discapacidad: false,
          tipo_discapacidad: ''
        }
      };
      reset(datosDefault);
    }

  } catch (error: any) {
    console.error('Error cargando hoja de vida:', error);
    setError('Error al cargar la hoja de vida. Por favor intenta nuevamente.');
  } finally {
    setLoading(false);
  }
};

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
const handleGuardar = async (data: HojaVidaFormData) => {
  try {
    setLoadingGuardar(true);
    setError('');
    setSuccess('');

    console.log('Guardando hoja de vida:', data);

    // Asegurar que los datos estén en el formato correcto
    const datosParaGuardar = {
      datos_personales: {
        ...data.datos_personales,
        telefono: data.datos_personales.telefono || '',
        email: data.datos_personales.email || ''
      },
      formacion_academica: data.formacion_academica.map(item => ({
        ...item,
        anio_inicio: item.anio_inicio || '',
        anio_fin: item.anio_fin || '',
        anio_graduacion: item.anio_graduacion || ''
      })),
      experiencia_laboral: data.experiencia_laboral.map(item => ({
        ...item,
        funciones: Array.isArray(item.funciones) ? item.funciones : [],
        logros: Array.isArray(item.logros) ? item.logros : []
      })),
      cursos_capacitaciones: data.cursos_capacitaciones,
      habilidades: {
        tecnicas: Array.isArray(data.habilidades.tecnicas) ? data.habilidades.tecnicas : [],
        blandas: Array.isArray(data.habilidades.blandas) ? data.habilidades.blandas : [],
        idiomas: data.habilidades.idiomas
      },
      referencias: data.referencias,
      informacion_adicional: {
        ...data.informacion_adicional,
        tipo_licencia: data.informacion_adicional.tipo_licencia || '',
        tipo_discapacidad: data.informacion_adicional.tipo_discapacidad || ''
      }
    };

    console.log('Datos procesados para guardar:', datosParaGuardar);

    const hojaVidaGuardada = await UsuarioService.guardarHojaVida(datosParaGuardar);
    setHojaVida(hojaVidaGuardada);
    
    setSuccess('Hoja de vida guardada exitosamente');
    setEditMode(false);
    setDialogConfirmarGuardar(false);

    // Recargar datos para asegurar consistencia
    setTimeout(() => {
      cargarDatos();
    }, 1000);

  } catch (error: any) {
    console.error('Error guardando hoja de vida:', error);
    setError(error.message || 'Error al guardar la hoja de vida. Por favor intenta nuevamente.');
  } finally {
    setLoadingGuardar(false);
  }
};
  const handleCancelarEdicion = () => {
    if (hojaVida) {
      reset(hojaVida);
    } else {
      // Resetear a valores vacíos
      reset();
    }
    setEditMode(false);
    setError('');
  };

  const handleGenerarPlantilla = async () => {
    try {
      setLoading(true);
      const plantilla = await UsuarioService.generarPlantillaHojaVida();
      reset(plantilla);
      setEditMode(true);
      setSuccess('Plantilla generada exitosamente. Por favor completa los campos faltantes.');
    } catch (error) {
      console.error('Error generando plantilla:', error);
      setError('Error al generar la plantilla.');
    } finally {
      setLoading(false);
    }
  };
const handleDescargar = async (formato: 'pdf' | 'word') => {
  try {
    if (!usuario?.id) return;
    
    // Verificar si los datos personales están completos
    const datosPersonales = getValues('datos_personales');
    const tieneDatosMinimos = datosPersonales.nombres_completos && 
                             datosPersonales.cedula && 
                             (datosPersonales.direccion || datosPersonales.nacionalidad);
    
    if (!tieneDatosMinimos) {
      // Mostrar alerta y guardar el formato para descargar después
      setDownloadFormat(formato);
      setShowDownloadAlert(true);
      return;
    }
    
    // Proceder con la descarga
    await procederConDescarga(formato);

  } catch (error) {
    console.error('Error descargando hoja de vida:', error);
    setError('Error al descargar la hoja de vida.');
  }
};

// Método para proceder con la descarga después del alert
const procederConDescarga = async (formato: 'pdf' | 'word') => {
  if (!usuario?.id) return;
  
  if (formato === 'pdf') {
    const blob = await UsuarioService.descargarHojaVidaPDF(usuario.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoja-vida-${usuario.nombre_completo}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } else {
    const blob = await UsuarioService.descargarHojaVidaWord(usuario.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoja-vida-${usuario.nombre_completo}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  
  setDialogDescargarOpen(false);
};


  const agregarHabilidadTecnica = () => {
    const nuevaHabilidad = prompt('Ingresa una nueva habilidad técnica:');
    if (nuevaHabilidad) {
      const habilidadesActuales = watch('habilidades.tecnicas') || [];
      setValue('habilidades.tecnicas', [...habilidadesActuales, nuevaHabilidad]);
    }
  };

  const agregarHabilidadBlanda = () => {
    const nuevaHabilidad = prompt('Ingresa una nueva habilidad blanda:');
    if (nuevaHabilidad) {
      const habilidadesActuales = watch('habilidades.blandas') || [];
      setValue('habilidades.blandas', [...habilidadesActuales, nuevaHabilidad]);
    }
  };

  const handleRemoveExperiencia = (index: number) => {
    // Guardar el estado expandido actual
    const currentExpanded = expandedExperiencia;
    removeExperiencia(index);
    
    // Ajustar el estado expandido
    if (currentExpanded === index) {
      setExpandedExperiencia(false);
    } else if (currentExpanded && currentExpanded > index) {
      setExpandedExperiencia(currentExpanded - 1);
    }
  };

  const handleRemoveFormacion = (index: number) => {
    // Guardar el estado expandido actual
    const currentExpanded = expandedFormacion;
    removeFormacion(index);
    
    // Ajustar el estado expandido
    if (currentExpanded === index) {
      setExpandedFormacion(false);
    } else if (currentExpanded && currentExpanded > index) {
      setExpandedFormacion(currentExpanded - 1);
    }
  };

  const renderHabilidadesLista = (habilidades: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {habilidades.map((habilidad, index) => (
        <Chip key={index} label={habilidad} size="small" />
      ))}
    </Box>
  );


  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Backdrop open={loadingGuardar} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Image
            src="/images/logo-acm.png"
            alt="SEGURA EP PRM XVI"
            width={60}
            height={30}
          />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#213126' }}>
              Mi Hoja de Vida
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sistema de Reportes ACM - Perfil Profesional
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Barra de herramientas */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
           <Grid size={{ xs: 12, md: 6}}>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4f46e5' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {usuario?.nombre_completo || 'Usuario'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {usuario?.cargo || 'Agente de Control Municipal'} | Cédula: {usuario?.cedula}
                  </Typography>
                </Box>
              </Box>
            </Grid>
           <Grid size={{ xs: 12, md: 6 }}>
  <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
    {!editMode ? (
      <>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setEditMode(true)}
        >
          Editar
        </Button>
        <Button
          variant="outlined"
          startIcon={<DescriptionIcon />}
          onClick={() => setDialogDescargarOpen(true)}
        >
          Descargar
        </Button>
        
        <Tooltip title="Refrescar">
          <IconButton onClick={cargarDatos}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </>
    ) : (
      <>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancelarEdicion}
          color="error"
          type="button"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={<SaveIcon />}
          form="hojaVidaForm"
          disabled={!isDirty || loadingGuardar}
          onClick={() => setDialogConfirmarGuardar(true)} // O elimina esto
        >
          {loadingGuardar ? 'Guardando...' : 'Guardar'}
        </Button>
      </>
    )}
  </Box>
</Grid></Grid>
        </Paper>
      </Box>

      {/* Contenido principal */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
  variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? false : 'auto'}
          allowScrollButtonsMobile
          centered={!isMobile}
        >
          <Tab icon={<PersonIcon />} label={isMobile ? '' : 'Información Personal'} />
          <Tab icon={<SchoolIcon />} label={isMobile ? '' : 'Formación Académica'} />
          <Tab icon={<WorkIcon />} label={isMobile ? '' : 'Experiencia Laboral'} />
          <Tab icon={<MenuBookIcon />} label={isMobile ? '' : 'Cursos y Capacitaciones'} />
          <Tab icon={<BuildIcon />} label={isMobile ? '' : 'Habilidades'} />
          <Tab icon={<LanguageIcon />} label={isMobile ? '' : 'Referencias'} />
          <Tab icon={<DescriptionIcon />} label={isMobile ? '' : 'Información Adicional'} />
        </Tabs>
      </Box>

        <form id="hojaVidaForm" onSubmit={handleSubmit(handleGuardar)}>
          {/* Tab 1: Información Personal */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="datos_personales.nombres_completos"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nombres Completos *"
                      fullWidth
                      error={!!errors.datos_personales?.nombres_completos}
                      helperText={errors.datos_personales?.nombres_completos?.message}
                      disabled={!editMode}
                    />
                  )}
                />
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

<Controller
  name="datos_personales.cedula"
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      label="Cédula *"
      fullWidth
      error={!!errors.datos_personales?.cedula}
      helperText={errors.datos_personales?.cedula?.message}
      disabled={!editMode}
      inputProps={{
        inputMode: 'numeric',  // Muestra teclado numérico en dispositivos móviles
        pattern: '[0-9]*',     // Solo acepta números
        maxLength: 10          // Longitud máxima típica para cédula ecuatoriana
      }}
      // Manejo onChange para validación adicional
      onChange={(e) => {
        // Remover cualquier caracter que no sea número
        const valor = e.target.value.replace(/\D/g, '');
        // Limitar a 10 dígitos
        const valorLimitado = valor.slice(0, 10);
        field.onChange(valorLimitado);
      }}
    />
  )}
/>
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="datos_personales.fecha_nacimiento"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Fecha de Nacimiento"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      disabled={!editMode}
                    />
                  )}
                />
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="datos_personales.lugar_nacimiento"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Lugar de Nacimiento"
                      fullWidth
                      disabled={!editMode}
                    />
                  )}
                />
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="datos_personales.nacionalidad"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nacionalidad"
                      fullWidth
                      disabled={!editMode}
                    />
                  )}
                />
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="datos_personales.estado_civil"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth disabled={!editMode}>
                      <InputLabel>Estado Civil</InputLabel>
                      <Select {...field} label="Estado Civil">
                        <MenuItem value="">Seleccionar...</MenuItem>
                        <MenuItem value="soltero">Soltero/a</MenuItem>
                        <MenuItem value="casado">Casado/a</MenuItem>
                        <MenuItem value="divorciado">Divorciado/a</MenuItem>
                        <MenuItem value="viudo">Viudo/a</MenuItem>
                        <MenuItem value="union_libre">Unión Libre</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
                      <Grid size={{ xs:12 }}>

                <Controller
                  name="datos_personales.direccion"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Dirección"
                      fullWidth
                      multiline
                      rows={2}
                      disabled={!editMode}
                    />
                  )}
                />
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

<Controller
  name="datos_personales.telefono"
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      label="Teléfono *"
      fullWidth
      disabled={!editMode}
      error={!!errors.datos_personales?.telefono}
      helperText={errors.datos_personales?.telefono?.message}
      inputProps={{
        inputMode: 'numeric',   // Teclado numérico en móviles
        pattern: '[0-9]*',      // Solo números
        maxLength: 10           // 10 dígitos (ej: 09xxxxxxxx)
      }}
      onChange={(e) => {
        // Eliminar cualquier caracter que no sea número
        const valor = e.target.value.replace(/\D/g, '');
        // Limitar a 10 dígitos
        const valorLimitado = valor.slice(0, 10);
        field.onChange(valorLimitado);
      }}
    />
  )}
/>

              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="datos_personales.email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!errors.datos_personales?.email}
                      helperText={errors.datos_personales?.email?.message}
                      disabled={!editMode}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Formación Académica */}
          <TabPanel value={tabValue} index={1}>
            {formacionFields.map((field, index) => (
              <Accordion 
                key={field.id} 
                expanded={expandedFormacion === index}
                onChange={(event, isExpanded) => {
                  setExpandedFormacion(isExpanded ? index : false);
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {watch(`formacion_academica.${index}.nivel`)} - {watch(`formacion_academica.${index}.institucion`) || 'Sin institución'}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs:12, md:4}}>
                      <Controller
                        name={`formacion_academica.${index}.nivel`}
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth disabled={!editMode}>
                            <InputLabel>Nivel *</InputLabel>
                            <Select {...field} label="Nivel *">
                              {nivelesEducativos.map((nivel) => (
                                <MenuItem key={nivel} value={nivel}>{nivel}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
        <Grid size={{ xs: 12, md: 8}}>
                      <Controller
                        name={`formacion_academica.${index}.institucion`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Institución Educativa"
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                            <Grid size={{ xs:12 }}>

                      <Controller
                        name={`formacion_academica.${index}.titulo`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Título Obtenido"
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                    <Controller
  name={`formacion_academica.${index}.anio_inicio`}
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      label="Año de Inicio"
      placeholder="Ej: 2015"
      fullWidth
      disabled={!editMode}
      error={!!errors.formacion_academica?.[index]?.anio_inicio}
      helperText={errors.formacion_academica?.[index]?.anio_inicio?.message}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        maxLength: 4
      }}
      onChange={(e) => {
        const valor = e.target.value.replace(/\D/g, '');
        const valorLimitado = valor.slice(0, 4);
        field.onChange(valorLimitado);
      }}
    />
  )}
/>

                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>
<Controller
  name={`formacion_academica.${index}.anio_fin`}
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      label="Año de Finalización"
      placeholder="Ej: 2019"
      fullWidth
      disabled={!editMode}
      error={!!errors.formacion_academica?.[index]?.anio_fin}
      helperText={errors.formacion_academica?.[index]?.anio_fin?.message}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        maxLength: 4
      }}
      onChange={(e) => {
        const valor = e.target.value.replace(/\D/g, '');
        const valorLimitado = valor.slice(0, 4);
        field.onChange(valorLimitado);
      }}
    />
  )}
/>

                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
  name={`formacion_academica.${index}.anio_graduacion`}
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      label="Año de Graduación"
      placeholder="Ej: 2020"
      fullWidth
      disabled={!editMode}
      error={!!errors.formacion_academica?.[index]?.anio_graduacion}
      helperText={errors.formacion_academica?.[index]?.anio_graduacion?.message}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        maxLength: 4
      }}
      onChange={(e) => {
        const valor = e.target.value.replace(/\D/g, '');
        const valorLimitado = valor.slice(0, 4);
        field.onChange(valorLimitado);
      }}
    />
  )}
/>

                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`formacion_academica.${index}.finalizado`}
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={!editMode}
                              />
                            }
                            label="Finalizado"
                          />
                        )}
                      />
                    </Grid>
                    {editMode && formacionFields.length > 1 && (
                              <Grid size={{ xs:12 }}>

                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveFormacion(index)}
                          fullWidth
                        >
                          Eliminar esta formación
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}

            {editMode && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newIndex = formacionFields.length;
                    appendFormacion({
                      nivel: 'Primaria',
                      institucion: '',
                      titulo: '',
                      anio_inicio: '',
                      anio_fin: '',
                      finalizado: true,
                      anio_graduacion: ''
                    });
                    setExpandedFormacion(newIndex);
                  }}
                >
                  Agregar Formación Académica
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Tab 3: Experiencia Laboral */}
          <TabPanel value={tabValue} index={2}>
            {experienciaFields.map((field, index) => (
              <Accordion 
                key={field.id} 
                expanded={expandedExperiencia === index}
                onChange={(event, isExpanded) => {
                  setExpandedExperiencia(isExpanded ? index : false);
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {watch(`experiencia_laboral.${index}.cargo`)} - {watch(`experiencia_laboral.${index}.empresa`)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`experiencia_laboral.${index}.empresa`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Empresa *"
                            fullWidth
                            error={!!errors.experiencia_laboral?.[index]?.empresa}
                            helperText={errors.experiencia_laboral?.[index]?.empresa?.message}
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`experiencia_laboral.${index}.cargo`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Cargo *"
                            fullWidth
                            error={!!errors.experiencia_laboral?.[index]?.cargo}
                            helperText={errors.experiencia_laboral?.[index]?.cargo?.message}
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`experiencia_laboral.${index}.fecha_inicio`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Fecha de Inicio"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`experiencia_laboral.${index}.fecha_fin`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Fecha de Finalización"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled={!editMode}
                            placeholder="Actualidad"
                          />
                        )}
                      />
                    </Grid>
                            <Grid size={{ xs:12 }}>

                      <Typography variant="subtitle2" gutterBottom>
                        Funciones Principales
                      </Typography>
                      <Controller
                        name={`experiencia_laboral.${index}.funciones`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="Describe tus funciones principales (una por línea)"
                            disabled={!editMode}
                            onChange={(e) => {
                              const funciones = e.target.value.split('\n').filter(f => f.trim());
                              field.onChange(funciones);
                            }}
                            value={field.value?.join('\n') || ''}
                          />
                        )}
                      />
                    </Grid>
                            <Grid size={{ xs:12 }}>

                      <Typography variant="subtitle2" gutterBottom>
                        Logros
                      </Typography>
                      <Controller
                        name={`experiencia_laboral.${index}.logros`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            multiline
                            rows={2}
                            fullWidth
                            placeholder="Describe tus logros (uno por línea)"
                            disabled={!editMode}
                            onChange={(e) => {
                              const logros = e.target.value.split('\n').filter(l => l.trim());
                              field.onChange(logros);
                            }}
                            value={field.value?.join('\n') || ''}
                          />
                        )}
                      />
                    </Grid>
                    {editMode && experienciaFields.length > 1 && (
                              <Grid size={{ xs:12 }}>

                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveExperiencia(index)}
                          fullWidth
                        >
                          Eliminar esta experiencia
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}

            {editMode && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newIndex = experienciaFields.length;
                    appendExperiencia({
                      empresa: '',
                      cargo: '',
                      fecha_inicio: '',
                      fecha_fin: '',
                      funciones: [],
                      logros: []
                    });
                    setExpandedExperiencia(newIndex);
                  }}
                >
                  Agregar Experiencia Laboral
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Tab 4: Cursos y Capacitaciones */}
          <TabPanel value={tabValue} index={3}>
            {cursosFields.map((field, index) => (
              <Card key={field.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                            <Grid size={{ xs:12 }}>

                      <Controller
                        name={`cursos_capacitaciones.${index}.nombre`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Nombre del Curso *"
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`cursos_capacitaciones.${index}.institucion`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Institución"
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                                  <Grid size={{ xs:12, md:3}}>

                      <Controller
                        name={`cursos_capacitaciones.${index}.duracion`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Duración"
                            placeholder="Ej: 40 horas"
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                                  <Grid size={{ xs:12, md:3}}>

                      <Controller
  name={`cursos_capacitaciones.${index}.año`}
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      label="Año"
      placeholder="Ej: 2023"
      fullWidth
      disabled={!editMode}
      error={!!errors.cursos_capacitaciones?.[index]?.año}
      helperText={errors.cursos_capacitaciones?.[index]?.año?.message}
      inputProps={{
        inputMode: 'numeric',   // Teclado numérico
        pattern: '[0-9]*',      // Solo números
        maxLength: 4            // Año YYYY
      }}
      onChange={(e) => {
        const valor = e.target.value.replace(/\D/g, '');
        const valorLimitado = valor.slice(0, 4);
        field.onChange(valorLimitado);
      }}
    />
  )}
/>

                    </Grid>
                  </Grid>
                </CardContent>
                {editMode && (
                  <CardActions>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeCurso(index)}
                    >
                      Eliminar
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))}

            {editMode && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => appendCurso({
                    nombre: '',
                    institucion: '',
                    duracion: '',
                    año: ''
                  })}
                >
                  Agregar Curso o Capacitación
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Tab 5: Habilidades */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              {/* Habilidades Técnicas */}
             <Grid size={{ xs: 12, md: 6}}>

                <Typography variant="subtitle1" gutterBottom>
                  Habilidades Técnicas
                </Typography>
                <Controller
                  name="habilidades.tecnicas"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      multiline
                      rows={4}
                      fullWidth
                      placeholder="Ingresa tus habilidades técnicas (una por línea)"
                      disabled={!editMode}
                      onChange={(e) => {
                        const habilidades = e.target.value.split('\n').filter(h => h.trim());
                        field.onChange(habilidades);
                      }}
                      value={field.value?.join('\n') || ''}
                    />
                  )}
                />
                {!editMode && watch('habilidades.tecnicas')?.length > 0 && (
                  renderHabilidadesLista(watch('habilidades.tecnicas') || [])
                )}
              </Grid>

              {/* Habilidades Blandas */}
             <Grid size={{ xs: 12, md: 6}}>

                <Typography variant="subtitle1" gutterBottom>
                  Habilidades Blandas
                </Typography>
                <Controller
                  name="habilidades.blandas"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      multiline
                      rows={4}
                      fullWidth
                      placeholder="Ingresa tus habilidades blandas (una por línea)"
                      disabled={!editMode}
                      onChange={(e) => {
                        const habilidades = e.target.value.split('\n').filter(h => h.trim());
                        field.onChange(habilidades);
                      }}
                      value={field.value?.join('\n') || ''}
                    />
                  )}
                />
                {!editMode && watch('habilidades.blandas')?.length > 0 && (
                  renderHabilidadesLista(watch('habilidades.blandas') || [])
                )}
              </Grid>

              {/* Idiomas */}
                      <Grid size={{ xs:12 }}>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  <LanguageIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Idiomas
                </Typography>
                {idiomaFields.map((field, index) => (
                  <Card key={field.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                       <Grid size={{ xs: 12, md: 6}}>

                          <Controller
                            name={`habilidades.idiomas.${index}.idioma`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth disabled={!editMode}>
                                <InputLabel>Idioma *</InputLabel>
                                <Select {...field} label="Idioma *">
                                  {idiomasDisponibles.map((idioma) => (
                                    <MenuItem key={idioma} value={idioma}>{idioma}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                       <Grid size={{ xs: 12, md: 6}}>

                          <Controller
                            name={`habilidades.idiomas.${index}.nivel`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth disabled={!editMode}>
                                <InputLabel>Nivel *</InputLabel>
                                <Select {...field} label="Nivel *">
                                  {nivelesIdioma.map((nivel) => (
                                    <MenuItem key={nivel} value={nivel}>{nivel}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                    {editMode && (
                      <CardActions>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => removeIdioma(index)}
                        >
                          Eliminar
                        </Button>
                      </CardActions>
                    )}
                  </Card>
                ))}

                {editMode && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => appendIdioma({
                        idioma: '',
                        nivel: ''
                      })}
                    >
                      Agregar Idioma
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 6: Referencias */}
          <TabPanel value={tabValue} index={5}>
            {referenciaFields.map((field, index) => (
              <Card key={field.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`referencias.${index}.nombre`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Nombre *"
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`referencias.${index}.relacion`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Relación *"
                            placeholder="Ej: Jefe anterior, Colega, etc."
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
  name={`referencias.${index}.telefono`}
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      label="Teléfono"
      fullWidth
      disabled={!editMode}
      error={!!errors.referencias?.[index]?.telefono}
      helperText={errors.referencias?.[index]?.telefono?.message}
      inputProps={{
        inputMode: 'numeric',   // Teclado numérico en móviles
        pattern: '[0-9]*',      // Solo números
        maxLength: 10           // Ej: 09xxxxxxxx
      }}
      onChange={(e) => {
        // Eliminar todo lo que no sea número
        const valor = e.target.value.replace(/\D/g, '');
        // Limitar a 10 dígitos
        const valorLimitado = valor.slice(0, 10);
        field.onChange(valorLimitado);
      }}
    />
  )}
/>

                    </Grid>
                   <Grid size={{ xs: 12, md: 6}}>

                      <Controller
                        name={`referencias.${index}.email`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Email"
                            type="email"
                            fullWidth
                            disabled={!editMode}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                {editMode && (
                  <CardActions>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeReferencia(index)}
                    >
                      Eliminar
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))}

            {editMode && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => appendReferencia({
                    nombre: '',
                    relacion: '',
                    telefono: '',
                    email: ''
                  })}
                >
                  Agregar Referencia
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Tab 7: Información Adicional */}
          <TabPanel value={tabValue} index={6}>
            <Grid container spacing={3}>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="informacion_adicional.licencia_conducir"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Licencia de Conducir"
                      fullWidth
                      disabled={!editMode}
                    />
                  )}
                />
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="informacion_adicional.tipo_licencia"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth disabled={!editMode}>
                      <InputLabel>Tipo de Licencia</InputLabel>
                      <Select {...field} label="Tipo de Licencia">
                        <MenuItem value="">Seleccionar...</MenuItem>
                        <MenuItem value="A">Tipo A (Motocicletas)</MenuItem>
                        <MenuItem value="B">Tipo B (Automóviles)</MenuItem>
                        <MenuItem value="C">Tipo C (Camiones)</MenuItem>
                        <MenuItem value="D">Tipo D (Buses)</MenuItem>
                        <MenuItem value="E">Tipo E (Maquinaria Pesada)</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="informacion_adicional.disponibilidad_viajar"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={!editMode}
                        />
                      }
                      label="Disponibilidad para Viajar"
                    />
                  )}
                />
              </Grid>
             <Grid size={{ xs: 12, md: 6}}>

                <Controller
                  name="informacion_adicional.discapacidad"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={!editMode}
                        />
                      }
                      label="¿Tiene alguna discapacidad?"
                    />
                  )}
                />
              </Grid>
              {watch('informacion_adicional.discapacidad') && (
                        <Grid size={{ xs:12 }}>

                  <Controller
                    name="informacion_adicional.tipo_discapacidad"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Tipo de Discapacidad"
                        fullWidth
                        multiline
                        rows={2}
                        disabled={!editMode}
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </form>
      </Paper>

     {/* Diálogo para descargar */}
<Dialog open={dialogDescargarOpen} onClose={() => setDialogDescargarOpen(false)}>
  <DialogTitle>Descargar Hoja de Vida</DialogTitle>
  <DialogContent>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      Selecciona el formato en el que deseas descargar tu hoja de vida:
    </Typography>
    <Grid container spacing={2} sx={{ mt: 2 }}>

      <Grid size={{ xs:12 }}>
        <Button
          variant="outlined"
          startIcon={<DescriptionIcon />}
          onClick={() => handleDescargar('word')}
          fullWidth
          sx={{ justifyContent: 'flex-start' }}
        >
          Descargar como Word (DOCX)
        </Button>
      </Grid>
    </Grid>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDialogDescargarOpen(false)}>Cancelar</Button>
  </DialogActions>
</Dialog>

{/* Diálogo de alerta para datos incompletos */}
<Dialog open={showDownloadAlert} onClose={() => setShowDownloadAlert(false)}>
  <DialogTitle>
    <Alert severity="warning" sx={{ mb: 2 }}>
      ¡Atención!
    </Alert>
  </DialogTitle>
  <DialogContent>
    <Typography variant="body1" gutterBottom>
      RECUERDE: AL MENOS LLENAR SUS DATOS PERSONALES
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      En el caso de que no haya llenado los datos de al menos DIRECCIÓN o NACIONALIDAD, 
      el usuario no podrá descargar el archivo correctamente.
    </Typography>
    <Typography variant="body2" color="error" paragraph>
      Por favor, complete los siguientes campos obligatorios:
    </Typography>
    <List dense>
      <ListItem>
        <ListItemText primary="✅ Nombres Completos" />
      </ListItem>
      <ListItem>
        <ListItemText primary="✅ Cédula" />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="📌 Dirección (al menos uno de estos dos)" 
          secondary={watch('datos_personales.direccion') ? "✓ Completado" : "✗ Faltante"}
        />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="📌 Nacionalidad (al menos uno de estos dos)" 
          secondary={watch('datos_personales.nacionalidad') ? "✓ Completado" : "✗ Faltante"}
        />
      </ListItem>
    </List>
    <Alert severity="info" sx={{ mt: 2 }}>
      Puede completar estos datos en la pestaña "Información Personal"
    </Alert>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowDownloadAlert(false)}>
      Cancelar
    </Button>
    <Button 
      onClick={() => {
        setEditMode(true);
        setTabValue(0); // Ir a la pestaña de Información Personal
        setShowDownloadAlert(false);
      }}
      variant="outlined"
      color="primary"
    >
      Completar Datos
    </Button>
    <Button 
      onClick={async () => {
        if (downloadFormat) {
          await procederConDescarga(downloadFormat);
        }
        setShowDownloadAlert(false);
      }}
      variant="contained"
      color="warning"
    >
      Descargar de Todas Formas
    </Button>
  </DialogActions>
</Dialog>
{/* Diálogo de confirmación para guardar */}
<Dialog open={dialogConfirmarGuardar} onClose={() => setDialogConfirmarGuardar(false)}>
  <DialogTitle>Confirmar Guardado</DialogTitle>
  <DialogContent>
    <Typography variant="body2" color="text.secondary">
      ¿Estás seguro de guardar los cambios en tu hoja de vida?
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDialogConfirmarGuardar(false)}>Cancelar</Button>
    <Button 
      onClick={async () => {
        // Obtener los datos del formulario
        const formData = getValues();
        await handleGuardar(formData);
        setDialogConfirmarGuardar(false);
      }}
      variant="contained"
      disabled={loadingGuardar}
    >
      {loadingGuardar ? 'Guardando...' : 'Guardar'}
    </Button>
  </DialogActions>
</Dialog>
    </Container>
  );
}