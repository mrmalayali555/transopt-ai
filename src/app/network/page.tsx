'use client';

import { AppShell } from '@/components/layout/AppShell';
import dynamic from 'next/dynamic';

// Leaflet must be dynamically imported (no SSR)
const NetworkMap = dynamic(() => import('@/components/network/NetworkMap'), { ssr: false });

export default function NetworkPage() {
  return (
    <AppShell>
      <NetworkMap />
    </AppShell>
  );
}
