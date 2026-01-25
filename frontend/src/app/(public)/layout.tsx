// frontend/src/app/(public)/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { Box } from '@mui/material';

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f6fa',
      }}
    >
      {children}
    </Box>
  );
}
