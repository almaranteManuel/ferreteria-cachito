import React from 'react';
import { useSuppliers } from '../hooks/useSuppliers';
import { Supplier } from '../types';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface SupplierTableProps {
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({ onEdit, onDelete }) => {
  const { suppliers, searchQuery, setSearchQuery, loading, error } = useSuppliers();

    return (
    <>
        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Buscador Express</CardTitle>
        </CardHeader>
        <CardContent>
            <Input
                type="text"
                placeholder="Buscar proveedor por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="text-base py-5"
            />
        </CardContent>
      </Card>

        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Listado de Proveedores</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p>Cargando proveedores...</p>
          ) : error ? (
            <p>Error al cargar proveedores: {error}</p>
            ) : suppliers.length === 0 ? (
            <p>No se encontraron proveedores.</p>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email de Contacto</TableHead>
                        <TableHead>Teléfono de Contacto</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead className="text-right w-[100px]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                            <TableCell>{supplier.name}</TableCell>
                            <TableCell>{supplier.email || '—'}</TableCell>
                            <TableCell>{supplier.phone || '—'}</TableCell>
                            <TableCell>{supplier.address || '—'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => onEdit(supplier)}
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        onClick={() => onDelete(supplier)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
};