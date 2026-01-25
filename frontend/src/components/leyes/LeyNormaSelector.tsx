// frontend/src/components/leyes/LeyNormaSelector.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Gavel as GavelIcon
} from '@mui/icons-material';

interface LeyNorma {
  id: string;
  nombre: string;
  categoria: string;
  articulos?: Articulo[];
}

interface Articulo {
  id: string;
  numero_articulo: string;
  contenido: string;
  // Eliminar esta propiedad porque no está en la interfaz original
  // ley_norma_id?: string; // ← ESTA LÍNEA ES EL PROBLEMA
}

interface LeyNormaSeleccionada {
  ley_id: string;
  ley_nombre: string;
  articulo_id?: string;
  articulo_numero?: string;
}

interface LeyNormaSelectorProps {
  leyesSeleccionadas: LeyNormaSeleccionada[];
  onChange: (leyes: LeyNormaSeleccionada[]) => void;
  permitirAgregarArticulos?: boolean;
  permitirEliminar?: boolean;
}

const LeyNormaSelector: React.FC<LeyNormaSelectorProps> = ({
  leyesSeleccionadas,
  onChange,
  permitirAgregarArticulos = true,
  permitirEliminar = true
}) => {
  const [leyes, setLeyes] = useState<LeyNorma[]>([]);
  const [leySeleccionada, setLeySeleccionada] = useState<LeyNorma | null>(null);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<Articulo | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    cargarLeyes();
  }, []);

  const cargarLeyes = async () => {
    try {
      // Para usuarios no autenticados, usar endpoint público
      const response = await fetch(`${API_URL}/leyes-normas/publico`);
      
      if (!response.ok) {
        throw new Error('Error al cargar leyes');
      }

      const json = await response.json();
      
      // Extraer las leyes del objeto de respuesta
      const leyesArray = json.data?.leyes || [];
      
      // Obtener también los artículos para cada ley
      const leyesConArticulos = await Promise.all(
        leyesArray.map(async (ley: any) => {
          try {
            // Obtener artículos para esta ley
            const articulosResponse = await fetch(
              `${API_URL}/leyes-normas/${ley.id}/articulos`
            );
            
            if (articulosResponse.ok) {
              const articulosJson = await articulosResponse.json();
              return {
                ...ley,
                articulos: articulosJson.data || []
              };
            }
            return ley;
          } catch (error) {
            console.error(`Error cargando artículos para ley ${ley.id}:`, error);
            return ley;
          }
        })
      );

      setLeyes(leyesConArticulos);
    } catch (error) {
      console.error('Error cargando leyes:', error);
      // Datos de respaldo - CORREGIDO: eliminar ley_norma_id de los artículos
      const leyesRespaldo: LeyNorma[] = [
        {
          id: 'predef-constitucion-ecuador',
          nombre: 'Constitución del Ecuador',
          categoria: 'Constitucional',
          articulos: [
            {
              id: 'art-const-1',
              // ley_norma_id: 'predef-constitucion-ecuador', // ← ELIMINAR ESTA LÍNEA
              numero_articulo: 'Art. 3',
              contenido: 'Seguridad y convivencia a través del estado'
            }
          ]
        }
      ];
      setLeyes(leyesRespaldo);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarLey = () => {
    if (!leySeleccionada) return;

    const nuevaLey: LeyNormaSeleccionada = {
      ley_id: leySeleccionada.id,
      ley_nombre: leySeleccionada.nombre,
      articulo_id: articuloSeleccionado?.id,
      articulo_numero: articuloSeleccionado?.numero_articulo
    };

    onChange([...leyesSeleccionadas, nuevaLey]);
    setLeySeleccionada(null);
    setArticuloSeleccionado(null);
  };

  const handleEliminarLey = (index: number) => {
    const nuevasLeyes = [...leyesSeleccionadas];
    nuevasLeyes.splice(index, 1);
    onChange(nuevasLeyes);
  };

  if (loading) {
    return <Typography>Cargando leyes y normas...</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Selector de ley/norma */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Seleccionar Ley/Norma
        </Typography>
        
        <Autocomplete
          value={leySeleccionada}
          onChange={(event, nuevaLey) => {
            setLeySeleccionada(nuevaLey);
            setArticuloSeleccionado(null);
          }}
          options={leyes}
          getOptionLabel={(ley) => ley.nombre}
          groupBy={(ley) => ley.categoria}
          renderInput={(params) => (
            <TextField {...params} label="Buscar ley o norma" />
          )}
          sx={{ mb: 2 }}
        />

        {leySeleccionada && permitirAgregarArticulos && (
          <Autocomplete
            value={articuloSeleccionado}
            onChange={(event, nuevoArticulo) => setArticuloSeleccionado(nuevoArticulo)}
            options={leySeleccionada.articulos || []}
            getOptionLabel={(articulo) => 
              `Artículo ${articulo.numero_articulo}: ${articulo.contenido.substring(0, 50)}...`
            }
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar artículo (opcional)" />
            )}
            sx={{ mb: 2 }}
          />
        )}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAgregarLey}
          disabled={!leySeleccionada}
          fullWidth
        >
          Agregar {articuloSeleccionado ? 'Artículo' : 'Ley'}
        </Button>
      </Paper>

      {/* Lista de leyes seleccionadas */}
      {leyesSeleccionadas.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Leyes/Normas Aplicables ({leyesSeleccionadas.length})
          </Typography>
          
          <List>
            {leyesSeleccionadas.map((ley, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <GavelIcon sx={{ mr: 2, color: '#f59e0b' }} />
                  <ListItemText
                    primary={ley.ley_nombre}
                    secondary={
                      ley.articulo_numero 
                        ? `Artículo ${ley.articulo_numero}` 
                        : 'Ley completa'
                    }
                  />
                  {permitirEliminar && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="eliminar"
                        onClick={() => handleEliminarLey(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                {index < leyesSeleccionadas.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default LeyNormaSelector;