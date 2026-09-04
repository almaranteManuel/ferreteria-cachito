import React from 'react';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface ProductTableProps {
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ onEdit, onDelete }) => {
    const { products, searchQuery, setSearchQuery, loading, error } = useProducts();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Buscador Express</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        type="text"
                        placeholder="Escanear código de barras o tipear descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="text-base py-5"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Listado de Productos</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
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
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-right">Precio de Venta</TableHead>
                                    <TableHead className="text-right w-[100px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="max-w-[300px] truncate">
                                            {product.description}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.price !== null ? formatCurrency(product.price) : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.price !== null && product.variant !== null
                                                ? formatCurrency(product.price * product.variant)
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => onEdit(product)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:text-destructive"
                                                    onClick={() => onDelete(product)}
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
}