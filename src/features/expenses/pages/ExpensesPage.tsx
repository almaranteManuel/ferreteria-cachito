import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { expensesApi } from '../api/expensesApi';
import { GastoPersonal, Purchase, GASTO_CATEGORIAS, GASTO_CATEGORIA_LABEL } from '../types';
import { supplierApi } from '@/features/suppliers/api/supplierApi';
import { Supplier } from '@/features/suppliers/types';
import { Trash2 } from 'lucide-react';

type Mode = 'purchases' | 'gastos';

export const ExpensesPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('purchases');

  // Compras a proveedores
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierMap, setSupplierMap] = useState<Map<number, string>>(new Map());
  const today = new Date().toISOString().slice(0, 10);
  const [pDate, setPDate] = useState(today);
  const [pSupplierId, setPSupplierId] = useState('');
  const [pAmount, setPAmount] = useState('');
  const [pError, setPError] = useState<string | null>(null);

  // Gastos personales
  const [gastos, setGastos] = useState<GastoPersonal[]>([]);
  const [gFecha, setGFecha] = useState(today);
  const [gMonto, setGMonto] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gCat, setGCat] = useState<string>('OTRO');
  const [gError, setGError] = useState<string | null>(null);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  const loadPurchases = async () => {
    try {
      setPurchases(await expensesApi.listPurchases());
    } catch {}
  };
  const loadGastos = async () => {
    try {
      setGastos(await expensesApi.listGastos());
    } catch {}
  };

  useEffect(() => {
    loadPurchases();
    loadGastos();
    supplierApi.searchSuppliers('').then((list) => {
      setSuppliers(list);
      setSupplierMap(new Map(list.map((s) => [s.id, s.name])));
    }).catch(() => {});
  }, []);

  const handleCreatePurchase = async () => {
    setPError(null);
    const amt = parseFloat(pAmount.replace(',', '.'));
    if (!pDate || !Number.isFinite(amt) || amt <= 0) {
      setPError('Completá fecha y monto mayor a cero');
      return;
    }
    try {
      await expensesApi.createPurchase({
        date: pDate,
        total_amount: amt,
        supplier_id: pSupplierId ? parseInt(pSupplierId, 10) : null,
      });
      setPAmount('');
      setPSupplierId('');
      loadPurchases();
    } catch (e) {
      setPError(String(e));
    }
  };

  const handleCreateGasto = async () => {
    setGError(null);
    const amt = parseFloat(gMonto.replace(',', '.'));
    if (!gFecha || !gDesc.trim() || !Number.isFinite(amt) || amt <= 0) {
      setGError('Completá fecha, descripción y monto mayor a cero');
      return;
    }
    try {
      await expensesApi.createGasto({
        fecha: gFecha,
        monto: amt,
        descripcion: gDesc.trim(),
        categoria: gCat,
      });
      setGMonto('');
      setGDesc('');
      setGCat('OTRO');
      loadGastos();
    } catch (e) {
      setGError(String(e));
    }
  };

  const handleDeletePurchase = async (id: number) => {
    if (!confirm('¿Eliminar compra?')) return;
    await expensesApi.deletePurchase(id);
    loadPurchases();
  };
  const handleDeleteGasto = async (id: number) => {
    if (!confirm('¿Eliminar gasto?')) return;
    await expensesApi.deleteGasto(id);
    loadGastos();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Compras &amp; Gastos</h1>
        <p className="text-sm text-slate-500">Anotá compras a proveedores y gastos personales/impuestos separados</p>
      </div>

      <div className="flex gap-2">
        <Button variant={mode === 'purchases' ? 'default' : 'outline'} onClick={() => setMode('purchases')}>
          Compra a proveedor
        </Button>
        <Button variant={mode === 'gastos' ? 'default' : 'outline'} onClick={() => setMode('gastos')}>
          Gasto personal
        </Button>
      </div>

      {mode === 'purchases' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar compra</CardTitle>
              <CardDescription>Agrega una nueva compra a un proveedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pError && <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">{pError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor (opcional)</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={pSupplierId}
                    onChange={(e) => setPSupplierId(e.target.value)}
                  >
                    <option value="">Sin proveedor / Gastos en casa</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Monto ($) *</Label>
                  <Input type="number" step="0.01" value={pAmount} onChange={(e) => setPAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <Button onClick={handleCreatePurchase}>Guardar compra</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial — Compras a proveedores</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <p className="text-sm text-slate-500">No hay compras registradas</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{String(p.date).slice(0, 10)}</TableCell>
                        <TableCell>{p.supplier_id ? (supplierMap.get(p.supplier_id) || `#${p.supplier_id}`) : '—'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.total_amount)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDeletePurchase(p.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar gasto personal / impuesto</CardTitle>
              <CardDescription>Se guarda en `gastos_personales` separado de compras</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gError && <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">{gError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input type="date" value={gFecha} onChange={(e) => setGFecha(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción *</Label>
                  <Input value={gDesc} onChange={(e) => setGDesc(e.target.value)} placeholder="Ej: Impuesto, alquiler, expensas" />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={gCat}
                    onChange={(e) => setGCat(e.target.value)}
                  >
                    {GASTO_CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{GASTO_CATEGORIA_LABEL[c as keyof typeof GASTO_CATEGORIA_LABEL]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <Label>Monto ($) *</Label>
                <Input type="number" step="0.01" value={gMonto} onChange={(e) => setGMonto(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleCreateGasto}>Guardar gasto</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial — Gastos personales</CardTitle>
            </CardHeader>
            <CardContent>
              {gastos.length === 0 ? (
                <p className="text-sm text-slate-500">No hay gastos registrados</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gastos.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-mono text-xs">{g.fecha.slice(0, 10)}</TableCell>
                        <TableCell>{g.descripcion}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{GASTO_CATEGORIA_LABEL[g.categoria as keyof typeof GASTO_CATEGORIA_LABEL] || g.categoria}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(g.monto)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDeleteGasto(g.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
