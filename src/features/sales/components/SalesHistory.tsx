import React from 'react';
import { useSales } from '../hooks/useSales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const SalesHistory: React.FC = () => {
  const { sales, loading, error } = useSales();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ventas recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-slate-500">No hay ventas registradas</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>
                    <Badge variant={sale.sale_type === 'TOTAL_DIA' ? 'secondary' : 'default'}>
                      {sale.sale_type === 'TOTAL_DIA' ? 'Total día' : 'Detallada'}
                    </Badge>
                  </TableCell>
                  <TableCell>{sale.payment_method}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sale.total_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
