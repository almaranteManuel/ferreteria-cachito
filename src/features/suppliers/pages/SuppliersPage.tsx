import React from 'react';
import { useSuppliers } from '../hooks/useSuppliers';

// Componentes de Shadcn UI cargados desde tu directorio local
import { Button } from '@/components/ui/button';
import { SupplierTable } from '@/features/suppliers/components/supplierTable';

export const SuppliersPage: React.FC = () => {
    const { error } = useSuppliers();

    return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header del Módulo */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestión de Proveedores
            </h1>
            <p className="text-sm text-slate-500">
            Consulta rápida de proveedores y sus datos de contacto
            </p>
        </div>
        <Button onClick={() => alert('Próximamente: Modal Nuevo Proveedor')}>
          + Nuevo Proveedor
        </Button>
      </div>

            {/* Alerta de Error */}
      {error && (
        <div className="p-4 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200">
          Error al consultar SQLite: {error}
        </div>
      )}

    
    {/* Tabla de Proveedores */}
      <SupplierTable />
    </div>
  );
}