import React, { useState, useEffect } from 'react';
import { Product, CreateProductDto, UpdateProductDto } from '../types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product | null;
  onSubmit: (dto: CreateProductDto | UpdateProductDto) => Promise<void>;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  productToEdit,
  onSubmit,
}) => {
  const isEditing = Boolean(productToEdit);

  // Estados del Formulario
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [ownPrice, setOwnPrice] = useState('');
  const [variant, setVariant] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [stock, setStock] = useState<string>('0');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar datos en el formulario al abrir o cambiar el producto a editar
  useEffect(() => {
    if (productToEdit) {
      setCode(productToEdit.code || '');
      setDescription(productToEdit.description || '');
      setPrice(productToEdit.price !== null ? String(productToEdit.price) : '');
      setOwnPrice(productToEdit.own_price || '');
      setVariant(productToEdit.variant !== null ? String(productToEdit.variant) : '');
      setCategoryId(productToEdit.category_id !== null ? String(productToEdit.category_id) : '');
      setStock(String(productToEdit.stock ?? 0));
    } else {
      // Resetear si es un Alta de nuevo producto
      setCode('');
      setDescription('');
      setPrice('');
      setOwnPrice('');
      setVariant('');
      setCategoryId('');
      setStock('0');
    }
    setFormError(null);
  }, [productToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones básicas de mostrador
    if (!code.trim()) {
      setFormError('El código de barras / interno es obligatorio.');
      return;
    }
    if (!description.trim()) {
      setFormError('La descripción del producto es obligatoria.');
      return;
    }

    setSubmitting(true);

    try {
      const parsedPrice = price.trim() !== '' ? parseFloat(price) : null;
      const parsedVariant = variant.trim() !== '' ? parseFloat(variant) : null;
      const parsedCategoryId = categoryId.trim() !== '' ? parseInt(categoryId, 10) : null;
      const parsedStock = stock.trim() !== '' ? parseInt(stock, 10) : 0;

      if (isEditing) {
        const updateDto: UpdateProductDto = {
          code,
          description,
          price: parsedPrice,
          own_price: ownPrice.trim() || undefined,
          variant: parsedVariant,
          category_id: parsedCategoryId,
          stock: parsedStock,
        };
        await onSubmit(updateDto);
      } else {
        const createDto: CreateProductDto = {
          code,
          description,
          price: parsedPrice,
          own_price: ownPrice.trim() || undefined,
          variant: parsedVariant,
          category_id: parsedCategoryId,
          stock: parsedStock,
        };
        await onSubmit(createDto);
      }

      onOpenChange(false);
    } catch (err) {
      setFormError(typeof err === 'string' ? err : 'Error al guardar en SQLite');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modificá los datos del artículo seleccionado en la base de datos.'
                : 'Ingresá los datos del nuevo producto para incorporar al inventario.'}
            </DialogDescription>
          </DialogHeader>

          {/* Alerta de Error local del Formulario */}
          {formError && (
            <div className="mt-4 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-4">
            {/* Fila 1: Código y Descripción */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="Ej: 77912345"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Input
                  id="description"
                  placeholder="Ej: Martillo Galponero 500g Stanley"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Fila 2: Precio Venta y Precio Propio/Costo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio mayorista ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownPrice">Precio Costo / Propio</Label>
                <Input
                  id="ownPrice"
                  placeholder="Opcional"
                  value={ownPrice}
                  onChange={(e) => setOwnPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Fila 3: Stock, Variante y Categoría */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Actual</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant">Variante de venta</Label>
                <Input
                  id="variant"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                />
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="categoryId">ID Categoría</Label>
                <Input
                  id="categoryId"
                  type="number"
                  placeholder="Opcional"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                />
              </div> */}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar Cambios'
                : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};