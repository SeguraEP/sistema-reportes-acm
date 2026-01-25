//frontend/src/components/reportes/ReporteList.tsx

'use client';

import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  Tooltip,
  Skeleton,
  Alert,
  Button
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Reporte } from '@/services/reporte.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Props del componente
interface ReporteListProps {
  reportes: Reporte[];
  loading?: boolean;
  error?: string;
  onView?: (reporteId: string) => void;
  onEdit?: (reporteId: string) => void;
  onDelete?: (reporteId: string) => void;
  onDownload?: (reporteId: string, formato: 'pdf' | 'word') => void;
  onPrint?: (reporteId: string) => void;
  page?: number;
  rowsPerPage?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  allowEdit?: boolean;
  allowDelete?: boolean;
  emptyMessage?: string;
}

// Columnas de la tabla
const columns = [
  { id: 'id', label: 'ID Reporte', minWidth: 150, sortable: true },
  { id: 'fecha', label: 'Fecha', minWidth: 100, sortable: true },
  { id: 'zona', label: 'Zona', minWidth: 100, sortable: true },
  { id: 'distrito', label: 'Distrito', minWidth: 120, sortable: true },
  { id: 'circuito', label: 'Circuito', minWidth: 80, sortable: true },
  { id: 'hora_reporte', label: 'Hora', minWidth: 80 },
  { id: 'estado', label: 'Estado', minWidth: 100 },
  { id: 'created_at', label: 'Creado', minWidth: 120, sortable: true },
  { id: 'acciones', label: 'Acciones', minWidth: 150, align: 'center' }
];

// Función para formatear fecha
const formatFecha = (fecha: string) => {
  return format(new Date(fecha), 'dd/MM/yyyy');
};

// Función para formatear fecha completa
const formatFechaCompleta = (fecha: string) => {
  return format(new Date(fecha), "PPpp", { locale: es });
};

// Función para renderizar el estado
const renderEstadoChip = (estado: string) => {
  const colores: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    pendiente: 'warning',
    completado: 'success',
    revisado: 'info',
    archivado: 'default'
  };

  const etiquetas: Record<string, string> = {
    pendiente: 'Pendiente',
    completado: 'Completado',
    revisado: 'Revisado',
    archivado: 'Archivado'
  };

  return (
    <Chip
      label={etiquetas[estado] || estado}
      color={colores[estado] || 'default'}
      size="small"
    />
  );
};

export default function ReporteList({
  reportes = [],
  loading = false,
  error,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onPrint,
  page = 0,
  rowsPerPage = 10,
  totalRows = 0,
  onPageChange,
  onRowsPerPageChange,
  sortBy = 'created_at',
  sortDirection = 'desc',
  onSort,
  allowEdit = true,
  allowDelete = false,
  emptyMessage = 'No hay reportes para mostrar'
}: ReporteListProps) {
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange?.(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
  };

  const handleSort = (columnId: string) => {
    if (columnId !== 'acciones' && onSort) {
      onSort(columnId);
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  if (reportes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <SearchIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align as any}
                  style={{ minWidth: column.minWidth, fontWeight: 600 }}
                >
                  {column.id !== 'acciones' ? (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: column.sortable ? 'pointer' : 'default' 
                      }}
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      {column.label}
                      {column.sortable && sortBy === column.id && (
                        <SortIcon sx={{ 
                          ml: 0.5,
                          transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                          fontSize: 16 
                        }} />
                      )}
                    </Box>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportes.map((reporte) => (
              <TableRow hover key={reporte.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {reporte.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  {formatFecha(reporte.fecha)}
                </TableCell>
                <TableCell>{reporte.zona}</TableCell>
                <TableCell>{reporte.distrito}</TableCell>
                <TableCell>{reporte.circuito}</TableCell>
                <TableCell>{reporte.hora_reporte}</TableCell>
                <TableCell>
                  {renderEstadoChip(reporte.estado)}
                </TableCell>
                <TableCell>
                  {formatFechaCompleta(reporte.created_at)}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {onView && (
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => onView(reporte.id)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {onDownload && (
                      <Tooltip title="Descargar PDF">
                        <IconButton
                          size="small"
                          onClick={() => onDownload(reporte.id, 'pdf')}
                          color="secondary"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {onPrint && (
                      <Tooltip title="Imprimir">
                        <IconButton
                          size="small"
                          onClick={() => onPrint(reporte.id)}
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {allowEdit && onEdit && (
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(reporte.id)}
                          color="info"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {allowDelete && onDelete && (
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(reporte.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {onPageChange && onRowsPerPageChange && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      )}
    </Paper>
  );
}