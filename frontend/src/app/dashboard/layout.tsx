//frontend/src/app/dashboard/layout.tsx
'use client';
import type { ReactNode } from 'react';
import TopMenu from '@/components/usuarios/TopMenu';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopMenu />
      <main className="flex-1">{children}</main>
    </div>
  );
}
