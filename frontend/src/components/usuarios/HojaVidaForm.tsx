//frontend/src/components/usuarios/HojaVidaForm.tsx

'use client';

import React from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  MenuBook as MenuBookIcon,
  Build as BuildIcon,
  Language as LanguageIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Esquema de validación
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
  })),
  experiencia_laboral: z.array(z.object({
    empresa: z.string().min(1, 'Empresa es requerida'),
    cargo: z.string().min(1, 'Cargo es requerido'),
    fecha_inicio: z.string().optional(),
    fecha_fin: z.string().optional(),
    funciones: z.array(z.string()).default([]),
    logros: z.array(z.string()).default([])
  })),
  cursos_capacitaciones: z.array(z.object({
    nombre: z.string().min(1, 'Nombre del curso es requerido'),
    institucion: z.string().optional(),
    duracion: z.string().optional(),
    año: z.string().optional()
  })),
  habilidades: z.object({
    tecnicas: z.array(z.string()).default([]),
    blandas: z.array(z.string()).default([]),
    idiomas: z.array(z.object({
      idioma: z.string().min(1, 'Idioma es requerido'),
      nivel: z.string().min(1, 'Nivel es requerido')
    })).default([])
  }),
  referencias: z.array(z.object({
    nombre: z.string().min(1, 'Nombre es requerido'),
    relacion: z.string().min(1, 'Relación es requerida'),
    telefono: z.string().optional(),
    email: z.string().email('Email no válido').optional()
  })),
  informacion_adicional: z.object({
    disponibilidad_viajar: z.boolean().default(false),
    licencia_conducir: z.string().optional(),
    tipo_licencia: z.string().optional(),
    discapacidad: z.boolean().default(false),
    tipo_discapacidad: z.string().optional()
  })
});

type HojaVidaFormData = z.infer<typeof hojaVidaSchema>;

// Props del componente
interface HojaVidaFormProps {
  onSubmit: (data: HojaVidaFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<HojaVidaFormData>;
  loading?: boolean;
  readOnly?: boolean;
}

// Niveles educativos predefinidos
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

// Idiomas predefinidos
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

// Niveles de idioma
const nivelesIdioma = [
  'Básico',
  'Intermedio',
  'Avanzado',
  'Nativo',
  'Fluido'
];

export default function HojaVidaForm({
  onSubmit,
  onCancel,
  initialData,
  loading = false,
  readOnly = false
}: HojaVidaFormProps) {
  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    reset,
    watch
  } = useForm<HojaVidaFormData>({
    resolver: zodResolver(hojaVidaSchema)as any,
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
      formacion_academica: [
        {
          nivel: 'Primaria',
          institucion: '',
          titulo: '',
          anio_inicio: '',
          anio_fin: '',
          finalizado: true,
          anio_graduacion: ''
        }
      ],
      experiencia_laboral: [
        {
          empresa: 'Municipio de Guayaquil',
          cargo: 'Agente de Control Municipal',
          fecha_inicio: '',
          fecha_fin: '',
          funciones: [],
          logros: []
        }
      ],
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
      },
      ...initialData
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

  // Inicializar con datos si existen
  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: HojaVidaFormData) => {
    await onSubmit(data);
  };

  const renderHabilidadesLista = (habilidades: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {habilidades.map((habilidad, index) => (
        <Chip key={index} label={habilidad} size="small" />
      ))}
    </Box>
  );

  return (
    <Paper component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ p: 3 }}>
      {readOnly && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Este formulario está en modo de solo lectura
        </Alert>
      )}

      {/* Información Personal */}
      <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', mb: 2 }}>
        <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Información Personal
      </Typography>
      <Divider sx={{ mb: 3 }} />

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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6}}>
          <Controller
            name="datos_personales.estado_civil"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth disabled={readOnly}>
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
                disabled={readOnly}
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
                label="Teléfono"
                fullWidth
                disabled={readOnly}
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
                disabled={readOnly}
              />
            )}
          />
        </Grid>
      </Grid>

      {/* Formación Académica */}
      <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', mt: 4, mb: 2 }}>
        <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Formación Académica
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {formacionFields.map((field, index) => (
        <Accordion key={field.id} defaultExpanded={index === 0}>
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
                    <FormControl fullWidth disabled={readOnly}>
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
              <Grid size={{ xs:12, md:8}}>
                <Controller
                  name={`formacion_academica.${index}.institucion`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Institución Educativa"
                      fullWidth
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                          disabled={readOnly}
                        />
                      }
                      label="Finalizado"
                    />
                  )}
                />
              </Grid>
              {!readOnly && formacionFields.length > 1 && (
                <Grid size={{ xs:12 }}>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => removeFormacion(index)}
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

      {!readOnly && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => appendFormacion({
              nivel: 'Primaria',
              institucion: '',
              titulo: '',
              anio_inicio: '',
              anio_fin: '',
              finalizado: true,
              anio_graduacion: ''
            })}
          >
            Agregar Formación Académica
          </Button>
        </Box>
      )}

      {/* Experiencia Laboral */}
      <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', mt: 4, mb: 2 }}>
        <WorkIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Experiencia Laboral
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {experienciaFields.map((field, index) => (
        <Accordion key={field.id} defaultExpanded={index === 0}>
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
                      onChange={(e) => {
                        const logros = e.target.value.split('\n').filter(l => l.trim());
                        field.onChange(logros);
                      }}
                      value={field.value?.join('\n') || ''}
                    />
                  )}
                />
              </Grid>
              {!readOnly && experienciaFields.length > 1 && (
                <Grid size={{ xs:12 }}>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => removeExperiencia(index)}
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

      {!readOnly && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => appendExperiencia({
              empresa: '',
              cargo: '',
              fecha_inicio: '',
              fecha_fin: '',
              funciones: [],
              logros: []
            })}
          >
            Agregar Experiencia Laboral
          </Button>
        </Box>
      )}

      {/* Cursos y Capacitaciones */}
      <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', mt: 4, mb: 2 }}>
        <MenuBookIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Cursos y Capacitaciones
      </Typography>
      <Divider sx={{ mb: 3 }} />

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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
          {!readOnly && (
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

      {!readOnly && (
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

      {/* Habilidades */}
      <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', mt: 4, mb: 2 }}>
        <BuildIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Habilidades
      </Typography>
      <Divider sx={{ mb: 3 }} />

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
                disabled={readOnly}
                onChange={(e) => {
                  const habilidades = e.target.value.split('\n').filter(h => h.trim());
                  field.onChange(habilidades);
                }}
                value={field.value?.join('\n') || ''}
              />
            )}
          />
          {readOnly && watch('habilidades.tecnicas')?.length > 0 && (
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
                disabled={readOnly}
                onChange={(e) => {
                  const habilidades = e.target.value.split('\n').filter(h => h.trim());
                  field.onChange(habilidades);
                }}
                value={field.value?.join('\n') || ''}
              />
            )}
          />
          {readOnly && watch('habilidades.blandas')?.length > 0 && (
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
                        <FormControl fullWidth disabled={readOnly}>
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
                        <FormControl fullWidth disabled={readOnly}>
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
              {!readOnly && (
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

          {!readOnly && (
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

      {/* Referencias */}
      <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', mt: 4, mb: 2 }}>
        Referencias
      </Typography>
      <Divider sx={{ mb: 3 }} />

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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
          {!readOnly && (
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

      {!readOnly && (
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

      {/* Información Adicional */}
      <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', mt: 4, mb: 2 }}>
        Información Adicional
      </Typography>
      <Divider sx={{ mb: 3 }} />

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
                disabled={readOnly}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6}}>
          <Controller
            name="informacion_adicional.tipo_licencia"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth disabled={readOnly}>
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
                    disabled={readOnly}
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
                    disabled={readOnly}
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
                  disabled={readOnly}
                />
              )}
            />
          </Grid>
        )}
      </Grid>

      {/* Acciones del Formulario */}
      {!readOnly && (
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Hoja de Vida'}
          </Button>
        </Box>
      )}
    </Paper>
  );
}