//frontend/src/app/dashboard/crear-reporte/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SubmitHandler } from 'react-hook-form';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Backdrop,
  CircularProgress,
  Tooltip,
  Fab
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Gavel as GavelIcon,
  Map as MapIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { ReporteService } from '@/services/reporte.service';
import { LeyNormaService, type LeyNorma, type Articulo } from '@/services/leyNorma.service';
import Image from 'next/image';
import { supabase } from '@/lib/supabase'; 
// Esquema de validación
const reporteSchema = z.object({
  zona: z.string().min(1, 'Zona es requerida'),
  distrito: z.string().min(1, 'Distrito es requerido'),
  circuito: z.string().min(1, 'Circuito es requerido'),
  direccion: z.string().min(1, 'Dirección es requerida'),
  horario_jornada: z.string().min(1, 'Horario de jornada es requerido'),
  hora_reporte: z.string().min(1, 'Hora del reporte es requerida'),
  fecha: z.string().min(1, 'Fecha es requerida'),
  novedad: z.string().min(10, 'La novedad debe tener al menos 10 caracteres'),
  reporta: z.string().optional(),
  coordenadas: z.string().optional(),

  leyes_aplicables: z.array(
    z.object({
      ley_id: z.string(),
      ley_nombre: z.string(),
      articulo_id: z.string().optional(),
      articulo_descripcion: z.string().optional()
    })
  )
});

type ReporteFormData = z.infer<typeof reporteSchema>;

// Zonas de Guayaquil predefinidas
const zonasGuayaquil = [
  { value: 'Norte', label: 'Norte', distritos: ['Tarqui', 'Ximena', 'Febres Cordero'] },
  { value: 'Sur', label: 'Sur', distritos: ['Urdaneta', 'Letamendi', 'García Moreno'] },
  { value: 'Centro', label: 'Centro', distritos: ['Rocafuerte', 'Bolívar', 'Sucre', '9 de Octubre'] },
  { value: 'Oeste', label: 'Oeste', distritos: ['Ayacucho', 'Olmedo', 'Roca'] },
  { value: 'Este', label: 'Este', distritos: ['Carbo', 'Chongón'] }
];

// Circuitos por zona
const circuitosPorZona = {
  'Norte': ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8'],
  'Sur': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
  'Centro': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'],
  'Oeste': ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8'],
  'Este': ['E1', 'E2', 'E3', 'E4', 'E5', 'E6']
};

const steps = ['Información Básica', 'Descripción', 'Leyes Aplicables', 'Revisión'];

export default function CrearReportePage() {
const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [leyesNormas, setLeyesNormas] = useState<LeyNorma[]>([]);
  const [estructuraLeyes, setEstructuraLeyes] = useState<any>(null);
  const [dialogLeyesOpen, setDialogLeyesOpen] = useState(false);
  const [selectedLey, setSelectedLey] = useState<LeyNorma | null>(null);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [leyesSeleccionadas, setLeyesSeleccionadas] = useState<any[]>([]);
  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  const [circuitosDisponibles, setCircuitosDisponibles] = useState<string[]>([]);

  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    watch,
    setValue,
    trigger,
    reset
  } = useForm<ReporteFormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      zona: '',
      distrito: '',
      circuito: '',
      direccion: '',
      horario_jornada: '',
      hora_reporte: '',
      fecha: new Date().toISOString().split('T')[0],
      novedad: '',
      reporta: '',
      coordenadas: '',
      leyes_aplicables: []
    }
  });

  const zonaSeleccionada = watch('zona');

  // Cargar leyes/normas al iniciar
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
    cargarLeyesNormas();
  }, []);

  // Actualizar distritos y circuitos cuando cambia la zona
  useEffect(() => {
    if (zonaSeleccionada) {
      const zona = zonasGuayaquil.find(z => z.value === zonaSeleccionada);
      if (zona) {
        setDistritosDisponibles(zona.distritos);
        setCircuitosDisponibles(circuitosPorZona[zonaSeleccionada as keyof typeof circuitosPorZona] || []);
        
        // Auto-seleccionar primer distrito y circuito
        if (!watch('distrito') && zona.distritos.length > 0) {
          setValue('distrito', zona.distritos[0]);
        }
        if (!watch('circuito') && circuitosDisponibles.length > 0) {
          setValue('circuito', circuitosDisponibles[0]);
        }
      }
    }
  }, [zonaSeleccionada, setValue, watch, circuitosDisponibles]);
const cargarLeyesNormas = async () => {
  try {
    const estructura = await LeyNormaService.obtenerEstructuraCompleta();
    setEstructuraLeyes(estructura);
    
    let todasLeyes: LeyNorma[] = [];
    
    // Usar datos de la base de datos si están disponibles
    if (estructura.estructura_bd && Object.keys(estructura.estructura_bd).length > 0) {
      Object.values(estructura.estructura_bd).forEach((categoria: any) => {
        if (Array.isArray(categoria)) {
          todasLeyes.push(...categoria);
        }
      });
    } else {
      // Usar datos predefinidos
      console.log('Usando datos predefinidos para leyes/normas');
      
      Object.entries(estructura.predefinido).forEach(([nombre, articulos]) => {
        // Extraer categoría del nombre
        let categoria = nombre;
        if (nombre.includes(' - ')) {
          categoria = nombre.split(' - ')[0];
        }
        
        todasLeyes.push({
          id: `predef-${nombre.replace(/\s+/g, '-').toLowerCase()}`,
          nombre: nombre,
          categoria: categoria,
          descripcion: `Ley/norma ${nombre}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          articulos: (articulos as string[]).map((articulo, index) => {
            const partes = articulo.split(' - ');
            return {
              id: `art-${nombre.replace(/\s+/g, '-').toLowerCase()}-${index}`,
              ley_norma_id: `predef-${nombre.replace(/\s+/g, '-').toLowerCase()}`,
              numero_articulo: partes[0] || `Art. ${index + 1}`,
              contenido: articulo,
              descripcion_corta: partes[1] || articulo.substring(0, 100),
              created_at: new Date().toISOString()
            };
          })
        });
      });
    }
    
    setLeyesNormas(todasLeyes);
  } catch (error) {
    console.error('Error cargando leyes/normas:', error);
    
    // Crear datos de respaldo
    const leyesRespaldo: LeyNorma[] = [
      {
        id: 'predef-constitucion-ecuador',
        nombre: 'Constitución del Ecuador',
        categoria: 'Constitucional',
        descripcion: 'Constitución de la República del Ecuador',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        articulos: [
          {
            id: 'art-const-1',
            ley_norma_id: 'predef-constitucion-ecuador',
            numero_articulo: 'Art. 3',
            contenido: 'Seguridad y convivencia a través del estado',
            descripcion_corta: 'Seguridad y convivencia',
            created_at: new Date().toISOString()
          },
          {
            id: 'art-const-2',
            ley_norma_id: 'predef-constitucion-ecuador',
            numero_articulo: 'Art. 10',
            contenido: 'Titularidad de derechos',
            descripcion_corta: 'Titularidad de derechos',
            created_at: new Date().toISOString()
          }
        ]
      }
    ];
    
    setLeyesNormas(leyesRespaldo);
    setEstructuraLeyes({
      estructura_bd: {},
      predefinido: {},
      usando_bd: false
    });
  }
};
  const handleNext = async () => {
    let isValid = false;
    
    switch (activeStep) {
      case 0:
        isValid = await trigger(['zona', 'distrito', 'circuito', 'direccion', 'horario_jornada', 'hora_reporte', 'fecha']);
        break;
      case 1:
        isValid = await trigger(['novedad']);
        break;
      case 2:
        // Las leyes son opcionales
        isValid = true;
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    reset();
    setImagenes([]);
    setLeyesSeleccionadas([]);
    setError('');
    setSuccess('');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 10 - imagenes.length);
      setImagenes(prev => [...prev, ...newImages]);
    }
    event.target.value = ''; // Reset input
  };

  const handleRemoveImage = (index: number) => {
    setImagenes(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLey = () => {
  if (selectedLey) {
    const nuevaLey = {
      ley_id: selectedLey.id,
      ley_nombre: selectedLey.nombre,
      articulo_id: selectedArticulo?.id,
      articulo_descripcion: selectedArticulo ? 
        `${selectedArticulo.numero_articulo} - ${selectedArticulo.descripcion_corta || selectedArticulo.contenido.substring(0, 50)}...` :
        undefined
    };
    
    // Verificar si la ley ya está seleccionada
    const leyExistente = leyesSeleccionadas.find(
      ley => ley.ley_id === nuevaLey.ley_id && ley.articulo_id === nuevaLey.articulo_id
    );
    
    if (!leyExistente) {
      setLeyesSeleccionadas(prev => [...prev, nuevaLey]);
      setValue('leyes_aplicables', [...leyesSeleccionadas, nuevaLey]);
    } else {
      // Opcional: Mostrar mensaje de que ya está seleccionada
      setError('Esta ley/norma ya ha sido seleccionada');
      setTimeout(() => setError(''), 3000);
    }
    
    setSelectedLey(null);
    setSelectedArticulo(null);
    setDialogLeyesOpen(false);
  }
};

  const handleRemoveLey = (index: number) => {
    const nuevasLeyes = leyesSeleccionadas.filter((_, i) => i !== index);
    setLeyesSeleccionadas(nuevasLeyes);
    setValue('leyes_aplicables', nuevasLeyes);
  };
const onSubmit = async (data: ReporteFormData) => {
  try {
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'leyes_aplicables') {
        formData.append(key, JSON.stringify(value));
      } else if (value) {
        formData.append(key, value.toString());
      }
    });

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      formData.append('usuario_id', session.user.id);
    }

    imagenes.forEach((imagen) => {
      formData.append('imagenes', imagen);
    });

    const response = await ReporteService.crearReporte(formData);

    setSuccess(`Reporte creado exitosamente con ID: ${response.id}`);

    setTimeout(() => {
      handleReset();
      router.push(session?.user ? '/dashboard/buscar-reportes' : '/');
    }, 2000);

  } catch (error: any) {
    setError(
      error.response?.data?.message ||
      'Error al crear el reporte. Por favor intenta nuevamente.'
    );
  } finally {
    setLoading(false);
  }
};


  const obtenerCoordenadas = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setValue('coordenadas', `${latitude}, ${longitude}`);
        },
        (error) => {
          console.error('Error obteniendo coordenadas:', error);
          setError('No se pudieron obtener las coordenadas. Asegúrate de permitir el acceso a la ubicación.');
        }
      );
    } else {
      setError('Geolocalización no soportada por este navegador.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Backdrop open={loading} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: '#fff' }}>
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
              Crear Nuevo Reporte
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sistema de Reportes ACM - Encargado de Cuadra
            </Typography>
          </Box>
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

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
          {/* Paso 1: Información Básica */}
          <Step>
            <StepLabel>Información Básica</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="zona"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.zona}>
                        <InputLabel>Zona *</InputLabel>
                        <Select {...field} label="Zona *">
                          {zonasGuayaquil.map((zona) => (
                            <MenuItem key={zona.value} value={zona.value}>
                              {zona.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.zona && (
                          <Typography variant="caption" color="error">
                            {errors.zona.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="distrito"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.distrito}>
                        <InputLabel>Distrito *</InputLabel>
                        <Select {...field} label="Distrito *" disabled={!zonaSeleccionada}>
                          {distritosDisponibles.map((distrito) => (
                            <MenuItem key={distrito} value={distrito}>
                              {distrito}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.distrito && (
                          <Typography variant="caption" color="error">
                            {errors.distrito.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="circuito"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.circuito}>
                        <InputLabel>Circuito *</InputLabel>
                        <Select {...field} label="Circuito *" disabled={!zonaSeleccionada}>
                          {circuitosDisponibles.map((circuito) => (
                            <MenuItem key={circuito} value={circuito}>
                              {circuito}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.circuito && (
                          <Typography variant="caption" color="error">
                            {errors.circuito.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="direccion"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Dirección *"
                        fullWidth
                        error={!!errors.direccion}
                        helperText={errors.direccion?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6}}>
  <Controller
    name="horario_jornada"
    control={control}
    render={({ field }) => (
      <TextField
        {...field}
        label="Horario de Jornada *"
        placeholder="Ej: 08:00 - 16:00"
        fullWidth
        error={!!errors.horario_jornada}
        helperText={errors.horario_jornada?.message || 'Formato: HH:MM - HH:MM'}
        inputProps={{
          pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\\s*-\\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          title: 'Formato: HH:MM - HH:MM (ej: 08:00 - 16:00)'
        }}
      />
    )}
  />


                </Grid>

                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="hora_reporte"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Hora del Reporte *"
                        type="time"
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        error={!!errors.hora_reporte}
                        helperText={errors.hora_reporte?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="fecha"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Fecha *"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        error={!!errors.fecha}
                        helperText={errors.fecha?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6}}>
                  <Controller
                    name="coordenadas"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Coordenadas "
                        placeholder="Ej: -2.170998, -79.922356"
                        fullWidth
                        error={!!errors.coordenadas}
                        helperText={errors.coordenadas?.message}
                        InputProps={{
                          endAdornment: (
                            <Tooltip title="Obtener coordenadas actuales">
                              <IconButton onClick={obtenerCoordenadas}>
                                <LocationIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button disabled>
                  Anterior
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ScheduleIcon />}
                >
                  Siguiente
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Paso 2: Descripción */}
          <Step>
            <StepLabel>Descripción de la Novedad</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid size={{ xs:12 }}>

                  <Controller
                    name="novedad"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Descripción de la Novedad *"
                        placeholder="Permiso, Señor Carlos Segovia Álava, Jefe de Control Municipal:
Muy respetuosamente, me permito informarle que en la presente fecha..."
                        multiline
                        rows={6}
                        fullWidth
                        error={!!errors.novedad}
                        helperText={errors.novedad?.message || 'Mínimo 10 caracteres'}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs:12 }}>

                  <Controller
                    name="reporta"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Reporta "
                        placeholder="Ej: ACM Juan Pérez"
                        fullWidth
                        error={!!errors.reporta}
                        helperText={errors.reporta?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs:12 }}>

                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Imágenes Adjuntas ({imagenes.length}/10)
                  </Typography>
                  
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="upload-images"
                    type="file"
                    multiple
                    onChange={handleImageUpload}
                    disabled={imagenes.length >= 10}
                  />
                  
                  <label htmlFor="upload-images">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AddPhotoIcon />}
                      disabled={imagenes.length >= 10}
                      sx={{ mb: 2 }}
                    >
                      Agregar Imágenes
                    </Button>
                  </label>

                  {imagenes.length > 0 && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {imagenes.map((imagen, index) => (
                        <Grid size={{ xs:6, sm: 4, md: 3 }}
 key={index}>
                          <Card>
                            <CardContent sx={{ p: 1, textAlign: 'center' }}>
                              <Typography variant="caption" noWrap>
                                {imagen.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {(imagen.size / 1024).toFixed(1)} KB
                              </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center', p: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveImage(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Anterior
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<NotesIcon />}
                >
                  Siguiente
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Paso 3: Leyes Aplicables */}
          <Step>
            <StepLabel>Leyes y Normas Aplicables</StepLabel>
            <StepContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Selecciona las leyes y normas aplicables a este reporte (Opcional)
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<GavelIcon />}
                  onClick={() => setDialogLeyesOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Agregar Ley/Norma
                </Button>

                {leyesSeleccionadas.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    {leyesSeleccionadas.map((ley, index) => (
                      <Chip
                        key={index}
                        label={`${ley.ley_nombre}${ley.articulo_descripcion ? ` - ${ley.articulo_descripcion}` : ''}`}
                        onDelete={() => handleRemoveLey(index)}
                        sx={{ m: 0.5 }}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Anterior
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Revisar y Finalizar
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Paso 4: Revisión */}
          <Step>
            <StepLabel>Revisión y Envío</StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 3, bgcolor: '#f9fafb' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#4f46e5' }}>
                  Resumen del Reporte
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6}}>
                    <Typography variant="body2" color="text.secondary">
                      Zona:
                    </Typography>
                    <Typography variant="body1">
                      {watch('zona') || 'No especificada'}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6}}>
                    <Typography variant="body2" color="text.secondary">
                      Distrito:
                    </Typography>
                    <Typography variant="body1">
                      {watch('distrito') || 'No especificado'}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6}}>
                    <Typography variant="body2" color="text.secondary">
                      Circuito:
                    </Typography>
                    <Typography variant="body1">
                      {watch('circuito') || 'No especificado'}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6}}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha y Hora:
                    </Typography>
                    <Typography variant="body1">
                      {watch('fecha')} {watch('hora_reporte')}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs:12 }}>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Novedad:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {watch('novedad') || 'No especificada'}
                    </Typography>
                  </Grid>
                  
                  {leyesSeleccionadas.length > 0 && (
                    <Grid size={{ xs:12 }}>

                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Leyes/Normas Aplicables:
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {leyesSeleccionadas.map((ley, index) => (
                          <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                            • {ley.ley_nombre}{ley.articulo_descripcion ? ` (${ley.articulo_descripcion})` : ''}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  )}
                  
                  {imagenes.length > 0 && (
                    <Grid size={{ xs:12 }}>

                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Imágenes Adjuntas:
                      </Typography>
                      <Typography variant="body1">
                        {imagenes.length} imagen(es)
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Anterior
                </Button>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleReset}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading}
                  >
                    {loading ? 'Creando Reporte...' : 'Crear Reporte'}
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>
        </Stepper>

        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3 }}>
            <Typography>Reporte creado exitosamente. Redirigiendo...</Typography>
            <Button onClick={handleReset} sx={{ mt: 2 }}>
              Crear otro reporte
            </Button>
          </Paper>
        )}
      </Paper>

      {/* Diálogo para seleccionar leyes/normas */}
      <Dialog open={dialogLeyesOpen} onClose={() => setDialogLeyesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelIcon />
            <Typography variant="h6">Seleccionar Ley/Norma</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6}}>
              <Typography variant="subtitle2" gutterBottom>
                Seleccionar Ley/Norma:
              </Typography>
              <Autocomplete
                options={leyesNormas}
                getOptionLabel={(option) => `${option.nombre}`}
                value={selectedLey}
                onChange={(event, newValue) => {
                  setSelectedLey(newValue);
                  setSelectedArticulo(null);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar ley/norma" />
                )}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6}}>
              <Typography variant="subtitle2" gutterBottom>
                Seleccionar Artículo (Opcional):
              </Typography>
              <Autocomplete
                options={selectedLey?.articulos || []}
                getOptionLabel={(option) => `${option.numero_articulo} - ${option.descripcion_corta || option.contenido.substring(0, 50)}...`}
                value={selectedArticulo}
                onChange={(event, newValue) => setSelectedArticulo(newValue)}
                disabled={!selectedLey}
                renderInput={(params) => (
                  <TextField {...params} label="Artículo específico" />
                )}
              />
            </Grid>
            
            {selectedLey && (
              <Grid size={{ xs:12 }}>

                <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Descripción:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedLey.descripcion || 'Sin descripción disponible'}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogLeyesOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddLey}
            variant="contained"
            disabled={!selectedLey}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Botón flotante para obtener coordenadas */}
      <Fab
        color="primary"
        aria-label="location"
        onClick={obtenerCoordenadas}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          bgcolor: '#4f46e5',
          '&:hover': {
            bgcolor: '#4338ca'
          }
        }}
      >
        <MapIcon />
      </Fab>
    </Container>
  );
}