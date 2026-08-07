import React from 'react';
import { useSuppliers } from '../hooks/useSuppliers';

// Componentes de Shadcn UI cargados desde tu directorio local
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const SupplierTable: React.FC = () => {
  const { suppliers, searchQuery, setSearchQuery, loading, error } = useSuppliers();

    return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header del Módulo */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestión de Proveedores
          </h1>
        </div>
      </div>

        {/* Contenedor Principal / Filtros */}
        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Buscador Express</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
                type="text"
                placeholder="Buscar proveedor por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="text-base py-5"
            />
          </div>
        </CardContent>
      </Card>

        {/* Tabla de Proveedores */}
        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Listado de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                            <TableCell>{supplier.name}</TableCell>
                            <TableCell>{supplier.contact_email || 'No disponible'}</TableCell>
                            <TableCell>{supplier.contact_phone || 'No disponible'}</TableCell>
                            <TableCell>{supplier.address || 'No disponible'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};