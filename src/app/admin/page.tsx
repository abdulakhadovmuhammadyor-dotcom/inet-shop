'use client';

import React from 'react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminRoutePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <AdminDashboard />
    </div>
  );
}
