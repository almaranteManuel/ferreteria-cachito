import React, { useState } from 'react';
import { useSuppliers } from '../hooks/useSuppliers';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../types';
import { supplierApi } from '../api/supplierApi';

import { Button } from '@/components/ui/button';
import { SupplierTable } from '@/features/suppliers/components/supplierTable';
import { SupplierFormDialog } from '@/features/suppliers/components/SupplierFormDialog';

export const SuppliersPage: React.FC = () => {
  const { error, refreshSuppliers } = useSuppliers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleOpenCreateModal = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`¿Eliminar "${supplier.name}"?`)) return;
    await supplierApi.deleteSupplier(supplier.id);
    refreshSuppliers();
  };

  const handleSubmitSupplier = async (dto: CreateSupplierDto | UpdateSupplierDto) => {
    if (selectedSupplier) {
      await supplierApi.updateSupplier(dto as UpdateSupplierDto);
    } else {
      await supplierApi.createSupplier(dto as CreateSupplierDto);
    }
    refreshSuppliers();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestión de Proveedores
          </h1>
          <p className="text-sm text-slate-500">
            Consulta rápida de proveedores y sus datos de contacto
          </p>
        </div>
        <Button onClick={handleOpenCreateModal}>
          + Nuevo Proveedor
        </Button>
      </div>

      {error && (
        <div className="p-4 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200">
          Error al consultar SQLite: {error}
        </div>
      )}

      <SupplierTable onEdit={handleEditSupplier} onDelete={handleDeleteSupplier} />

      <SupplierFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        supplierToEdit={selectedSupplier}
        onSubmit={handleSubmitSupplier}
      />
    </div>
  );
};