import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Product, CreateProductDto, UpdateProductDto } from '../types';
import { productApi } from '../api/productApi';

import { Button } from '@/components/ui/button';
import { ProductTable } from '../components/productTable';
import { ProductFormDialog } from '../components/productFormDialog';

export const ProductsPage: React.FC = () => {
  const {
    products,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    totalProducts,
    refreshProducts,
  } = useProducts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleOpenCreateModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.description}"?`)) return;
    await productApi.deleteProduct(product.id);
    await refreshProducts();
  };

  const handleSubmitProduct = async (dto: CreateProductDto | UpdateProductDto) => {
    if (selectedProduct) {
      await productApi.updateProduct({
        ...selectedProduct,
        ...dto,
        id: selectedProduct.id,
      });
    } else {
      await productApi.createProduct(dto as CreateProductDto);
    }
    await refreshProducts();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
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

      {error && (
        <div className="p-4 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200">
          Error al consultar SQLite: {error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Total de productos</p>
        <p className="text-2xl font-semibold text-slate-900">{totalProducts}</p>
      </div>

      <ProductTable
        products={products}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        error={error}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />

      <ProductFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        productToEdit={selectedProduct}
        onSubmit={handleSubmitProduct}
      />
    </div>
  );
};