import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '../types';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  error: string | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
    products,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    onEdit,
    onDelete,
}) => {
    const pageSize = 20;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
    const visibleProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return products.slice(start, start + pageSize);
    }, [currentPage, products]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

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
                                {visibleProducts.map((product) => (
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
                    {!loading && !error && products.length > 0 && (
                        <div className="flex items-center justify-between gap-4 pt-4 text-sm text-slate-500">
                            <span>
                                Mostrando {(currentPage - 1) * pageSize + 1}-
                                {Math.min(currentPage * pageSize, products.length)} de {products.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((page) => page - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span>
                                    Página {currentPage} de {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((page) => page + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}