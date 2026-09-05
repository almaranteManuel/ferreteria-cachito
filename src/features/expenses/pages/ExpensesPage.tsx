import React, { useEffect, useMemo, useState } from 'react';
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
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Mode = 'purchases' | 'gastos';

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const getMonthRange = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` };
};

export const ExpensesPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('purchases');
  const { requestConfirmation, confirmationDialog } = useConfirmDialog();

  // Compras a proveedores
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierMap, setSupplierMap] = useState<Map<number, string>>(new Map());
  const today = new Date().toISOString().slice(0, 10);
  const [pDate, setPDate] = useState(today);
  const [pSupplierId, setPSupplierId] = useState('');
  const [pAmount, setPAmount] = useState('');
  const [pError, setPError] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [purchasePage, setPurchasePage] = useState(1);
  const [gastoPage, setGastoPage] = useState(1);
  const pageSize = 20;

  // Gastos personales
  const [gastos, setGastos] = useState<GastoPersonal[]>([]);
  const [gFecha, setGFecha] = useState(today);
  const [gMonto, setGMonto] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gCat, setGCat] = useState<string>('OTRO');
  const [gError, setGError] = useState<string | null>(null);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  const loadPurchases = async (month = selectedMonth) => {
    try {
      const range = getMonthRange(month);
      setPurchases(await expensesApi.listPurchasesByDateRange(range.start, range.end));
    } catch {}
  };
  const loadGastos = async (month = selectedMonth) => {
    try {
      const range = getMonthRange(month);
      setGastos(await expensesApi.listGastosByDateRange(range.start, range.end));
    } catch {}
  };

  useEffect(() => {
    loadPurchases(selectedMonth);
    loadGastos(selectedMonth);
    supplierApi.searchSuppliers('').then((list) => {
      setSuppliers(list);
      setSupplierMap(new Map(list.map((s) => [s.id, s.name])));
    }).catch(() => {});
  }, [selectedMonth]);

  const monthOptions = Array.from({ length: 24 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
    };
  });
  const purchaseTotal = purchases.reduce((sum, purchase) => sum + purchase.total_amount, 0);
  const gastoTotal = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
  const purchasePages = Math.max(1, Math.ceil(purchases.length / pageSize));
  const gastoPages = Math.max(1, Math.ceil(gastos.length / pageSize));
  const visiblePurchases = useMemo(
    () => purchases.slice((purchasePage - 1) * pageSize, purchasePage * pageSize),
    [purchases, purchasePage],
  );
  const visibleGastos = useMemo(
    () => gastos.slice((gastoPage - 1) * pageSize, gastoPage * pageSize),
    [gastos, gastoPage],
  );
  useEffect(() => {
    setPurchasePage(1);
    setGastoPage(1);
  }, [selectedMonth]);
  useEffect(() => {
    if (purchasePage > purchasePages) setPurchasePage(purchasePages);
  }, [purchasePage, purchasePages]);
  useEffect(() => {
    if (gastoPage > gastoPages) setGastoPage(gastoPages);
  }, [gastoPage, gastoPages]);

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
      await loadPurchases();
      setPurchaseDialogOpen(false);
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
      await loadGastos();
    } catch (e) {
      setGError(String(e));
    }
  };

  const handleDeletePurchase = async (id: number) => {
    if (
      !(await requestConfirmation({
        title: 'Eliminar compra',
        description: '¿Querés eliminar esta compra? Esta acción no se puede deshacer.',
      }))
    ) return;
    await expensesApi.deletePurchase(id);
    loadPurchases();
  };
  const handleDeleteGasto = async (id: number) => {
    if (
      !(await requestConfirmation({
        title: 'Eliminar gasto',
        description: '¿Querés eliminar este gasto? Esta acción no se puede deshacer.',
      }))
    ) return;
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
          <Button onClick={() => setPurchaseDialogOpen(true)}>Nueva compra</Button>

          <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar compra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {pError && <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">{pError}</div>}
                <p className="text-sm text-muted-foreground">Agrega una nueva compra a un proveedor</p>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha *</Label>
                    <DatePicker value={pDate} onChange={setPDate} />
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
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancelar
                </DialogClose>
                <Button onClick={handleCreatePurchase}>Aceptar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial — Compras a proveedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="purchases-month" className="text-xs text-muted-foreground">Mes</label>
                  <select id="purchases-month" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm capitalize" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                  </select>
                </div>
                <div className="text-right"><p className="text-xs text-muted-foreground">Total del mes</p><p className="text-lg font-semibold">{formatCurrency(purchaseTotal)}</p></div>
              </div>
              {purchases.length === 0 ? (
                <p className="text-sm text-slate-500">No hay compras registradas</p>
              ) : (
                <>
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
                    {visiblePurchases.map((p) => (
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
                <div className="flex items-center justify-between gap-4 pt-4 text-sm text-slate-500">
                  <span>Mostrando {(purchasePage - 1) * pageSize + 1}-{Math.min(purchasePage * pageSize, purchases.length)} de {purchases.length}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPurchasePage((page) => page - 1)} disabled={purchasePage === 1}>Anterior</Button>
                    <span>Página {purchasePage} de {purchasePages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPurchasePage((page) => page + 1)} disabled={purchasePage === purchasePages}>Siguiente</Button>
                  </div>
                </div>
                </>
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
                  <DatePicker value={gFecha} onChange={setGFecha} />
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
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="expenses-month" className="text-xs text-muted-foreground">Mes</label>
                  <select id="expenses-month" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm capitalize" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                  </select>
                </div>
                <div className="text-right"><p className="text-xs text-muted-foreground">Total del mes</p><p className="text-lg font-semibold">{formatCurrency(gastoTotal)}</p></div>
              </div>
              {gastos.length === 0 ? (
                <p className="text-sm text-slate-500">No hay gastos registrados</p>
              ) : (
                <>
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
                    {visibleGastos.map((g) => (
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
                <div className="flex items-center justify-between gap-4 pt-4 text-sm text-slate-500">
                  <span>Mostrando {(gastoPage - 1) * pageSize + 1}-{Math.min(gastoPage * pageSize, gastos.length)} de {gastos.length}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setGastoPage((page) => page - 1)} disabled={gastoPage === 1}>Anterior</Button>
                    <span>Página {gastoPage} de {gastoPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setGastoPage((page) => page + 1)} disabled={gastoPage === gastoPages}>Siguiente</Button>
                  </div>
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
      {confirmationDialog}
    </div>
  );
};
