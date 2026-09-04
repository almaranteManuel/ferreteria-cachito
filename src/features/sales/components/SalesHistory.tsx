import React from 'react';
import { Sale } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  dateRange: { start: string; end: string } | null;
  setDateRange: (dateRange: { start: string; end: string } | null) => void;
  deleteSale: (id: number) => Promise<void>;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  loading,
  error,
  dateRange,
  setDateRange,
  deleteSale,
}) => {

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
    if (!confirm('¿Eliminar esta venta?')) return;
    await deleteSale(saleId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ventas recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={dateRange?.start ?? ''}
              onChange={(e) => {
                const start = e.target.value;
                const end = dateRange?.end ?? '';
                setDateRange(start && end ? { start, end } : null);
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={dateRange?.end ?? ''}
              onChange={(e) => {
                const end = e.target.value;
                const start = dateRange?.start ?? '';
                setDateRange(start && end ? { start, end } : null);
              }}
            />
          </div>
          {dateRange && (
            <button
              onClick={() => setDateRange(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpiar
            </button>
          )}
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
                {sales.map((sale) => (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
