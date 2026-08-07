import React from 'react';
import { useProducts } from '../hooks/useProducts';

// Componentes de Shadcn UI cargados desde tu directorio local
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const ProductTable: React.FC = () => {
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
                            placeholder="Escanear código de barras o tipear descripción..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                            className="text-base py-5"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Productos */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Listado de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Cargando productos...</p>
                    ) : error ? (
                        <p>Error al cargar productos: {error}</p>
                    ) : products.length === 0 ? (
                        <p>No se encontraron productos.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Código de Barras</TableHead>
                                    <TableHead>Precio de Venta</TableHead>
                                    <TableHead>Stock Actual</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            {product.code}
                                        </TableCell>
                                        <TableCell>
                                            {product.description}
                                        </TableCell>
                                        <TableCell>
                                            {product.price !== null ? formatCurrency(product.price) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.stock > 5 ? 'default' : 'destructive'}>
                                                {product.stock} un.
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}