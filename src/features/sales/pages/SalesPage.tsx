import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DailySaleForm } from '../components/DailySaleForm';
import { ManualSaleForm } from '../components/ManualSaleForm';
import { SalesHistory } from '../components/SalesHistory';
import { useSales } from '../hooks/useSales';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SaleMode = 'daily' | 'manual';

export const SalesPage: React.FC = () => {
  const [mode, setMode] = useState<SaleMode>('daily');
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const {
    sales,
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    deleteSale,
    refreshSales,
  } = useSales();

  const handleSuccess = async () => {
    await refreshSales();
    setSaleDialogOpen(false);
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
          onClick={() => {
            setMode('daily');
            setSaleDialogOpen(true);
          }}
        >
          Total del día
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => {
            setMode('manual');
            setSaleDialogOpen(true);
          }}
        >
          Venta manual
        </Button>
      </div>

      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className={mode === 'manual' ? 'sm:max-w-4xl' : 'sm:max-w-lg'}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'daily' ? 'Registrar total del día' : 'Registrar venta manual'}
            </DialogTitle>
          </DialogHeader>
          {mode === 'daily' ? (
            <DailySaleForm onSuccess={handleSuccess} />
          ) : (
            <ManualSaleForm onSuccess={handleSuccess} />
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SalesHistory
        sales={sales}
        loading={loading}
        error={error}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        deleteSale={deleteSale}
      />
    </div>
  );
};
