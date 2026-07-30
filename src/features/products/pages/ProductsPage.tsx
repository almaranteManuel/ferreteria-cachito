import React from 'react';
import { useProducts } from '../hooks/useProducts';

// Componentes de Shadcn UI cargados desde tu directorio local
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ProductsPage: React.FC = () => {
  const { products, searchQuery, setSearchQuery, loading, error } = useProducts();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
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
        <Button onClick={() => alert('Próximamente: Modal Nuevo Producto')}>
          + Nuevo Producto
        </Button>
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
              placeholder="Escanear código de barras o tipear descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="text-base py-5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Error */}
      {error && (
        <div className="p-4 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200">
          Error al consultar SQLite: {error}
        </div>
      )}

      {/* Tabla Shadcn UI */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[180px]">Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[150px]">Precio Venta</TableHead>
              <TableHead className="w-[120px]">Stock</TableHead>
              <TableHead className="text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Cargando inventario...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No se encontraron productos coincidentes
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/80">
                  <TableCell className="font-mono font-semibold text-slate-700">
                    {product.code}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {product.description}
                  </TableCell>
                  <TableCell className="font-bold text-emerald-600">
                    {product.price !== null ? formatCurrency(product.price) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 5 ? 'default' : 'destructive'}>
                      {product.stock} un.
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => alert(`Editar ${product.id}`)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};