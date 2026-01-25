//frontend/src/components/documentos/DocumentosContrato.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  fecha_subida: string;
  tamanio?: number;
}

interface DocumentosContratoProps {
  documentos?: Documento[];
  loading?: boolean;
  error?: string;
  onUpload?: (files: FileList) => Promise<void>;
  onDownload?: (documentoId: string) => void;
  onDelete?: (documentoId: string) => void;
  allowUpload?: boolean;
  allowDelete?: boolean;
  maxSize?: number; // en MB
}

export default function DocumentosContrato({
  documentos = [],
  loading = false,
  error,
  onUpload,
  onDownload,
  onDelete,
  allowUpload = true,
  allowDelete = false,
  maxSize = 10
}: DocumentosContratoProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState<Documento | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(event.target.files);
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || !onUpload) return;

    try {
      setUploading(true);
      await onUpload(selectedFiles);
      setUploadDialogOpen(false);
      setSelectedFiles(null);
    } catch (error) {
      console.error('Error subiendo archivos:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (documento: Documento) => {
    setDocumentoAEliminar(documento);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (documentoAEliminar && onDelete) {
      onDelete(documentoAEliminar.id);
      setDeleteDialogOpen(false);
      setDocumentoAEliminar(null);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return <PdfIcon color="error" />;
    if (tipo.includes('word') || tipo.includes('document')) return <DescriptionIcon color="primary" />;
    return <FileIcon />;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', py: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Documentos del Contrato
        </Typography>
        
        {allowUpload && onUpload && (
          <>
            <input
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              id="upload-documentos"
              type="file"
              multiple
              onChange={handleFileSelect}
            />
            <label htmlFor="upload-documentos">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
              >
                Subir Documentos
              </Button>
            </label>
          </>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {documentos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <DescriptionIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No hay documentos adjuntos
          </Typography>
          {allowUpload && onUpload && (
            <Typography variant="body2" color="text.secondary">
              Sube documentos relacionados con el contrato
            </Typography>
          )}
        </Box>
      ) : (
        <List>
          {documentos.map((doc) => (
            <ListItem
              key={doc.id}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  bgcolor: '#f5f5f5'
                }
              }}
            >
              <ListItemIcon>
                {getFileIcon(doc.tipo)}
              </ListItemIcon>
              <ListItemText
                primary={doc.nombre}
                secondary={
                  <>
                    <Typography variant="caption" display="block">
                      Subido: {new Date(doc.fecha_subida).toLocaleDateString()}
                    </Typography>
                    {doc.tamanio && (
                      <Chip
                        label={formatFileSize(doc.tamanio)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </>
                }
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {onDownload && (
                  <IconButton
                    size="small"
                    onClick={() => onDownload(doc.id)}
                    title="Descargar"
                  >
                    <DownloadIcon />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  component="a"
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver"
                >
                  <VisibilityIcon />
                </IconButton>
                {allowDelete && onDelete && (
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(doc)}
                    color="error"
                    title="Eliminar"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      {/* Dialog de Subir Archivos */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)}>
        <DialogTitle>Subir Documentos</DialogTitle>
        <DialogContent>
          {selectedFiles && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Archivos seleccionados:
              </Typography>
              <List>
                {Array.from(selectedFiles).map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getFileIcon(file.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={formatFileSize(file.size)}
                    />
                  </ListItem>
                ))}
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Tamaño máximo por archivo: {maxSize} MB
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !selectedFiles}
          >
            {uploading ? 'Subiendo...' : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar el documento "{documentoAEliminar?.nombre}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}