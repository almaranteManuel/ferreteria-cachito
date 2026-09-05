import React, { useEffect, useMemo, useState } from 'react';
import { Sale } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface SalesHistoryProps {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  deleteSale: (id: number) => Promise<void>;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  loading,
  error,
  selectedMonth,
  setSelectedMonth,
  deleteSale,
}) => {
  const { requestConfirmation, confirmationDialog } = useConfirmDialog();
  const pageSize = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0].split(' ')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const handleDelete = async (saleId: number) => {
    if (
      !(await requestConfirmation({
        title: 'Eliminar venta',
        description: '¿Querés eliminar esta venta? Esta acción no se puede deshacer.',
      }))
    ) return;
    await deleteSale(saleId);
  };

  const totalPages = Math.max(1, Math.ceil(sales.length / pageSize));
  const visibleSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sales.slice(start, start + pageSize);
  }, [currentPage, sales]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const monthOptions = Array.from({ length: 24 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
    };
  });
  const monthTotal = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="text-base">Ventas recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="sales-month" className="text-xs text-muted-foreground">
              Mes
            </label>
            <select
              id="sales-month"
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm capitalize"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total del mes</p>
            <p className="text-lg font-semibold">{formatCurrency(monthTotal)}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-slate-500">No hay ventas registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(sale.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between gap-4 pt-4 text-sm text-slate-500">
              <span>
                Mostrando {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, sales.length)} de {sales.length}
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
                <span>Página {currentPage} de {totalPages}</span>
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
          </div>
        )}
      </CardContent>
    </Card>
      {confirmationDialog}
    </>
  );
};
