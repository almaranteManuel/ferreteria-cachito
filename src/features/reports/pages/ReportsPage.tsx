import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';
import { YearlyReport } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export const ReportsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const [report, setReport] = useState<YearlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  useEffect(() => {
    reportApi.getAvailableYears().then((years) => {
      if (years.length > 0) {
        setAvailableYears(years);
        if (!years.includes(year)) setYear(years[0]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    reportApi.getYearlyReport(year)
      .then(setReport)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500">
            Ventas mensuales y estimación de ganancias (40% ganancia / 60% reposición)
          </p>
        </div>
        <div className="space-y-2">
          <Label>Año</Label>
          <select
            className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
            {!availableYears.includes(currentYear) && (
              <option value={currentYear}>{currentYear}</option>
            )}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {report && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total vendido {year}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(report.total_sales)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Ganancia estimada (40%)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(report.total_profit)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Reposición estimada (60%)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(report.total_restocking)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Compras a proveedores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(report.total_purchases)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Gastos personales e impuestos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(report.total_expenses)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ventas por mes — {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Total vendido</TableHead>
                    <TableHead className="text-right">Ganancia (40%)</TableHead>
                    <TableHead className="text-right">Reposición (60%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.months.map((m) => (
                    <TableRow key={m.month} className={m.total_sales === 0 ? 'text-slate-400' : ''}>
                      <TableCell>{m.month_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(m.total_sales)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        {formatCurrency(m.profit)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        {formatCurrency(m.restocking)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {loading && <p className="text-sm text-slate-500">Generando reporte...</p>}
    </div>
  );
};
