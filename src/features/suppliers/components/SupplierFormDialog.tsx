import React, { useState, useEffect } from 'react';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../types';
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

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierToEdit?: Supplier | null;
  onSubmit: (dto: CreateSupplierDto | UpdateSupplierDto) => Promise<void>;
}

export const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({
  open,
  onOpenChange,
  supplierToEdit,
  onSubmit,
}) => {
  const isEditing = Boolean(supplierToEdit);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name || '');
      setEmail(supplierToEdit.email || '');
      setPhone(supplierToEdit.phone || '');
      setAddress(supplierToEdit.address || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
    }
    setFormError(null);
  }, [supplierToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('El nombre del proveedor es obligatorio.');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing && supplierToEdit) {
        const updateDto: UpdateSupplierDto = {
          id: supplierToEdit.id,
          name,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        };
        await onSubmit(updateDto);
      } else {
        const createDto: CreateSupplierDto = {
          name,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        };
        await onSubmit(createDto);
      }

      onOpenChange(false);
    } catch (err) {
      setFormError(typeof err === 'string' ? err : 'Error al guardar proveedor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modificá los datos del proveedor seleccionado.'
                : 'Ingresá los datos del nuevo proveedor.'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="mt-4 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: Bulonera del Sur SRL"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email de Contacto</Label>
              <Input
                id="email"
                placeholder="contacto@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono de Contacto</Label>
              <Input
                id="phone"
                placeholder="Ej: 011 4567-8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Ej: Av. Corrientes 1234"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
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
                : 'Crear Proveedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
