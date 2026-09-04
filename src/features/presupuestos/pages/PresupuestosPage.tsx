import React, { useCallback, useState } from 'react';
import { Product } from '@/features/products/types';
import { ProductSearchBar } from '@/features/products/components/productSearchBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calcSalePrice } from '@/features/sales/types';
import { PresupuestoItemDraft } from '../types';
import { useCrearPresupuesto, usePresupuestos } from '../hooks/usePresupuestos';
import { presupuestoApi } from '../api/presupuestoApi';
import { PresupuestoPreviewDialog } from '../components/PresupuestoPreviewDialog';
import { PresupuestoWithItems, formatearNumeroPresupuesto } from '../types';
import { Trash2 } from 'lucide-react';

const nf = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const PresupuestosPage: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(today);
  const [clienteNombre, setClienteNombre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<PresupuestoItemDraft[]>([]);

  const [manualDesc, setManualDesc] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [manualCant, setManualCant] = useState('1');
  const [manualPrecio, setManualPrecio] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPresupuesto, setPreviewPresupuesto] = useState<PresupuestoWithItems | null>(null);

  const { presupuestos, loading: loadingList, refresh } = usePresupuestos();
  const { crear, creating, error, ultimo, limpiar } = useCrearPresupuesto();

  const total = cart.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);

  const agregarProducto = useCallback((product: Product) => {
    const precio = calcSalePrice(product.price, product.variant);
    setCart((prev) => {
      const existente = prev.find((x) => x.product_id === product.id);
      if (existente) {
        return prev.map((x) =>
          x.product_id === product.id ? { ...x, cantidad: x.cantidad + 1 } : x,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          code: product.code,
          descripcion: product.description,
          cantidad: 1,
          precio_unitario: precio,
        },
      ];
    });
    setSearchQuery('');
  }, []);

  const agregarManual = () => {
    const desc = manualDesc.trim();
    const cant = parseFloat(manualCant.replace(',', '.'));
    const precio = parseFloat(manualPrecio.replace(',', '.'));
    if (!desc || !Number.isFinite(cant) || cant <= 0 || !Number.isFinite(precio) || precio < 0) return;
    setCart((prev) => [
      ...prev,
      {
        product_id: null,
        code: manualCode.trim() || null,
        descripcion: desc,
        cantidad: cant,
        precio_unitario: precio,
      },
    ]);
    setManualDesc('');
    setManualCode('');
    setManualCant('1');
    setManualPrecio('');
  };

  const actualizarItem = (index: number, patch: Partial<PresupuestoItemDraft>) => {
    setCart((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const quitarItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmar = async () => {
    const dto = {
      fecha,
      cliente_nombre: clienteNombre.trim() || null,
      items: cart.map((i) => ({
        descripcion: i.descripcion.trim(),
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        product_id: i.product_id,
        code: i.code,
      })),
    };
    const creado = await crear(dto);
    setConfirmOpen(false);
    if (creado) {
      setCart([]);
      // clienteNombre se conserva por si es mismo cliente
      refresh();
      // abrir vista previa del recién creado
      setPreviewPresupuesto(creado);
      setPreviewOpen(true);
    }
  };

  const verPresupuesto = async (id: number) => {
    try {
      const p = await presupuestoApi.getById(id);
      setPreviewPresupuesto(p);
      setPreviewOpen(true);
    } catch (e) {
      alert(String(e));
    }
  };

  const eliminarPresupuesto = async (id: number) => {
    if (!confirm('¿Eliminar presupuesto?')) return;
    try {
      await presupuestoApi.eliminar(id);
      refresh();
    } catch (e) {
      alert(String(e));
    }
  };

  const limpiarCarrito = () => {
    if (cart.length === 0) return;
    if (!confirm('¿Limpiar carrito?')) return;
    setCart([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Presupuestos</h2>
          <p className="text-muted-foreground text-sm">
            Ticket / presupuesto imprimible — Puerto Ferretería · Manuel Leiva 510
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Agregar ítems */}
        <Card>
          <CardHeader>
            <CardTitle>Agregar ítems</CardTitle>
            <CardDescription>Buscá del catálogo o cargá un concepto libre.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProductSearchBar
              id="presupuesto-search"
              label="Buscar producto"
              value={searchQuery}
              onValueChange={setSearchQuery}
              onSelect={agregarProducto}
              placeholder="Código o descripción..."
            />

            <div className="border-t pt-4 space-y-3">
              <Label>Concepto libre</Label>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5 space-y-1">
                  <Label htmlFor="manual-desc" className="text-xs text-muted-foreground">
                    Descripción
                  </Label>
                  <Input
                    id="manual-desc"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    placeholder="Ej: Cable, bolsa cemento..."
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label htmlFor="manual-code" className="text-xs text-muted-foreground">
                    Código (opcional)
                  </Label>
                  <Input
                    id="manual-code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="-"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="manual-cant" className="text-xs text-muted-foreground">
                    Cant.
                  </Label>
                  <Input
                    id="manual-cant"
                    inputMode="decimal"
                    value={manualCant}
                    onChange={(e) => setManualCant(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="manual-precio" className="text-xs text-muted-foreground">
                    Precio
                  </Label>
                  <Input
                    id="manual-precio"
                    inputMode="decimal"
                    value={manualPrecio}
                    onChange={(e) => setManualPrecio(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={agregarManual}
                  disabled={!manualDesc.trim() || !manualPrecio.trim()}
                >
                  Agregar libre
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="presupuesto-fecha">Fecha</Label>
                <Input
                  id="presupuesto-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="presupuesto-cliente">Cliente (opcional)</Label>
                <Input
                  id="presupuesto-cliente"
                  placeholder="Consumidor Final"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carrito */}
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto actual</CardTitle>
            <CardDescription>
              Editá cantidad y precio manual antes de guardar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Todavía no agregaste ítems.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-20 text-right">Cant.</TableHead>
                    <TableHead className="w-28 text-right">P. unit.</TableHead>
                    <TableHead className="w-28 text-right">Subtotal</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item, index) => (
                    <TableRow key={`${item.product_id ?? 'm'}-${index}`}>
                      <TableCell>
                        <div className="font-medium leading-tight">{item.descripcion}</div>
                        {item.code && (
                          <div className="font-mono text-xs text-muted-foreground">
                            {item.code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 w-16 text-right"
                          inputMode="decimal"
                          value={String(item.cantidad)}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value.replace(',', '.'));
                            actualizarItem(index, {
                              cantidad: Number.isFinite(v) ? v : 0,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 w-28 text-right"
                          inputMode="decimal"
                          value={String(item.precio_unitario)}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value.replace(',', '.'));
                            actualizarItem(index, {
                              precio_unitario: Number.isFinite(v) ? v : 0,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${nf.format(item.cantidad * item.precio_unitario)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive"
                          onClick={() => quitarItem(index)}
                        >
                          ✕
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {error && (
              <p className="text-sm text-destructive border border-destructive/30 rounded-md p-3">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">${nf.format(total)}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={limpiarCarrito}
                disabled={cart.length === 0}
              >
                Limpiar
              </Button>
              <Button
                className="flex-1"
                disabled={creating || cart.length === 0 || total <= 0}
                onClick={() => setConfirmOpen(true)}
              >
                {creating ? 'Guardando...' : 'Vista previa e imprimir'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Se guardará el presupuesto y verás la vista previa para aceptar o cancelar la impresión.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Últimos presupuestos guardados.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : presupuestos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay presupuestos todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>N°</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presupuestos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.fecha}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatearNumeroPresupuesto(p)}
                    </TableCell>
                    <TableCell>{p.cliente_nombre || 'Consumidor Final'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${nf.format(p.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => verPresupuesto(p.id)}>
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => eliminarPresupuesto(p.id)}
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

      {/* Confirmación antes de guardar */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Guardar presupuesto?</DialogTitle>
            <DialogDescription>
              Se guardará un presupuesto de{' '}
              <span className="font-semibold text-foreground">${nf.format(total)}</span> con{' '}
              {cart.length} ítem{cart.length === 1 ? '' : 's'} para{' '}
              <span className="font-semibold text-foreground">
                {clienteNombre.trim() || 'Consumidor Final'}
              </span>
              . Luego verás la vista previa para imprimir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmar} disabled={creating}>
              {creating ? 'Guardando...' : 'Sí, guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview recién creado o histórico */}
      <PresupuestoPreviewDialog
        presupuesto={previewPresupuesto ?? ultimo}
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewPresupuesto(null);
            limpiar();
          }
        }}
      />
    </div>
  );
};
