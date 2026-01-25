//frontend/src/hooks/useReportes.ts
import { useState, useEffect } from 'react';
import { ReporteService, Reporte, FiltrosReporte } from '@/services/reporte.service';

export function useReportes(filtros?: FiltrosReporte) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarReportes();
  }, [JSON.stringify(filtros)]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: Reporte[];
      if (filtros && Object.keys(filtros).length > 0) {
        data = await ReporteService.buscarReportes(filtros);
      } else {
        data = await ReporteService.obtenerMisReportes();
      }
      
      setReportes(data);
    } catch (err: any) {
      console.error('Error cargando reportes:', err);
      setError(err.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const refrescar = () => {
    cargarReportes();
  };

  return {
    reportes,
    loading,
    error,
    refrescar
    };
}
export function useReporte(id: string | null) {
const [reporte, setReporte] = useState<Reporte | null>(null);
const [imagenes, setImagenes] = useState<any[]>([]);
const [leyesAplicables, setLeyesAplicables] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
useEffect(() => {
if (id) {
cargarReporte(id);
}
}, [id]);
const cargarReporte = async (reporteId: string) => {
try {
setLoading(true);
setError(null);
  const data = await ReporteService.obtenerReporte(reporteId);
  setReporte(data.reporte);
  setImagenes(data.imagenes);
  setLeyesAplicables(data.leyes_aplicables);
} catch (err: any) {
  console.error('Error cargando reporte:', err);
  setError(err.message || 'Error al cargar reporte');
} finally {
  setLoading(false);
}
};
return {
reporte,
imagenes,
leyesAplicables,
loading,
error,
refrescar: () => id && cargarReporte(id)
};
}