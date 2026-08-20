import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CustomersTab, SupplierDebtsTab } from '../components/AccountTabs';

type AccountMode = 'customers' | 'suppliers';

export const CustomersPage: React.FC = () => {
  const [mode, setMode] = useState<AccountMode>('customers');

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Clientes & Cuenta Corriente
        </h1>
        <p className="text-sm text-slate-500">
          Fiado de clientes y deudas pendientes con proveedores
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === 'customers' ? 'default' : 'outline'}
          onClick={() => setMode('customers')}
        >
          Clientes (fiado)
        </Button>
        <Button
          variant={mode === 'suppliers' ? 'default' : 'outline'}
          onClick={() => setMode('suppliers')}
        >
          Deudas con proveedores
        </Button>
      </div>

      {mode === 'customers' ? <CustomersTab /> : <SupplierDebtsTab />}
    </div>
  );
};
