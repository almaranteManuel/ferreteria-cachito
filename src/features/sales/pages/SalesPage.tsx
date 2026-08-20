import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DailySaleForm } from '../components/DailySaleForm';
import { ManualSaleForm } from '../components/ManualSaleForm';
import { SalesHistory } from '../components/SalesHistory';
import { useSales } from '../hooks/useSales';

type SaleMode = 'daily' | 'manual';

export const SalesPage: React.FC = () => {
  const [mode, setMode] = useState<SaleMode>('daily');
  const { refreshSales } = useSales();

  const handleSuccess = () => {
    refreshSales();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ventas</h1>
        <p className="text-sm text-slate-500">
          Registrá el total del día o armá una venta manual por unidades
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === 'daily' ? 'default' : 'outline'}
          onClick={() => setMode('daily')}
        >
          Total del día
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => setMode('manual')}
        >
          Venta manual
        </Button>
      </div>

      {mode === 'daily' ? (
        <DailySaleForm onSuccess={handleSuccess} />
      ) : (
        <ManualSaleForm onSuccess={handleSuccess} />
      )}

      <SalesHistory />
    </div>
  );
};
