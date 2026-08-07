import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Product, CreateProductDto, UpdateProductDto } from '../types';
import { productApi } from '../api/productApi';

import { Button } from '@/components/ui/button';
import { ProductTable } from '../components/productTable';
import { ProductFormDialog } from '../components/productFormDialog';

export const ProductsPage: React.FC = () => {
  const { error, refreshProducts } = useProducts();

  // Estados para controlar la apertura del modal y la edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Abrir modal para Crear
  const handleOpenCreateModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  // Handler enviado al modal para ejecutar la persistencia en SQLite
  const handleSubmitProduct = async (dto: CreateProductDto | UpdateProductDto) => {
    if (selectedProduct) {
      // Edición
      await productApi.updateProduct({
        ...selectedProduct,
        ...dto,
        id: selectedProduct.id,
      });
    } else {
      // Alta
      await productApi.createProduct(dto as CreateProductDto);
    }

    // Refrescar la tabla para actualizar los datos en tiempo real
    refreshProducts();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header del Módulo */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventario de Productos
          </h1>
          <p className="text-sm text-slate-500">
            Gestión de stock y consulta rápida de precios para mostrador
          </p>
        </div>
        <Button onClick={handleOpenCreateModal}>
          + Nuevo Producto
        </Button>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="p-4 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200">
          Error al consultar SQLite: {error}
        </div>
      )}

      {/* Tabla de Productos */}
      <ProductTable />

      {/* Modal para Crear/Editar */}
      <ProductFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        productToEdit={selectedProduct}
        onSubmit={handleSubmitProduct}
      />
    </div>
  );
};