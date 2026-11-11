'use client';

import React from 'react';
import { FpsCalculatorView } from '@/components/fps/FpsCalculatorView';

export default function FpsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <FpsCalculatorView />
    </div>
  );
}
