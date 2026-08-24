import React, { useCallback, useEffect, useState } from 'react';
import { productApi } from '@/features/products/api/productApi';
import { Product } from '@/features/products/types';
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
import { ItemFacturaCarrito } from '../types';
import { useEmitirFactura } from '../hooks/useFacturacion';
import { FacturaEmitidaDialog } from '../components/FacturaEmitidaDialog';

const nf = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const FacturacionPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<ItemFacturaCarrito[]>([]);

  const [manualDescripcion, setManualDescripcion] = useState('');
  const [manualCantidad, setManualCantidad] = useState('1');
  const [manualPrecio, setManualPrecio] = useState('');

  const { emitir, emitting, error, ultimaEmitida, limpiar } = useEmitirFactura();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchResults(await productApi.searchProducts(query));
    } catch {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  const agregarProducto = (product: Product) => {
    const precio = calcSalePrice(product.price, product.variant);
    setCart((prev) => {
      const existente = prev.find((i) => i.product_id === product.id);
      if (existente) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          descripcion: product.description,
          cantidad: 1,
          precio_unitario: precio,
        },
      ];
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const agregarManual = () => {
    const desc = manualDescripcion.trim();
    const cant = parseFloat(manualCantidad.replace(',', '.'));
    const precio = parseFloat(manualPrecio.replace(',', '.'));
    if (!desc || !Number.isFinite(cant) || cant <= 0 || !Number.isFinite(precio) || precio <= 0) {
      return;
    }
    setCart((prev) => [
      ...prev,
      { product_id: null, descripcion: desc, cantidad: cant, precio_unitario: precio },
    ]);
    setManualDescripcion('');
    setManualCantidad('1');
    setManualPrecio('');
  };

  const actualizarItem = (index: number, patch: Partial<ItemFacturaCarrito>) => {
    setCart((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const quitarItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const total = cart.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);

  const emitirFactura = async () => {
    const factura = await emitir({
      items: cart.map((i) => ({
        descripcion: i.descripcion.trim(),
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        product_id: i.product_id,
      })),
      cliente_nombre: null,
    });
    setConfirmarAbierto(false);
    if (factura) {
      setCart([]);
      setDialogOpen(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Facturación</h2>
        <p className="text-muted-foreground text-sm">
          Factura C electrónica a Consumidor Final (ARCA homologación).
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CARGA DE ÍTEMS */}
        <Card>
          <CardHeader>
            <CardTitle>Agregar ítems</CardTitle>
            <CardDescription>
              Buscá productos del catálogo o cargá un concepto libre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="busqueda-producto">Buscar producto</Label>
              <Input
                id="busqueda-producto"
                placeholder="Código o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent flex justify-between items-center text-sm"
                      onClick={() => agregarProducto(p)}
                    >
                      <span>
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {p.code}
                        </span>
                        {p.description}
                      </span>
                      <span className="font-semibold">
                        ${nf.format(calcSalePrice(p.price, p.variant))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <Label>Concepto libre</Label>
              <div className="grid grid-cols-[1fr_80px_110px_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label htmlFor="manual-desc" className="text-xs text-muted-foreground">
                    Descripción
                  </Label>
                  <Input
                    id="manual-desc"
                    value={manualDescripcion}
                    onChange={(e) => setManualDescripcion(e.target.value)}
                    placeholder="Ej: Trabajo de soldadura"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="manual-cant" className="text-xs text-muted-foreground">
                    Cant.
                  </Label>
                  <Input
                    id="manual-cant"
                    inputMode="decimal"
                    value={manualCantidad}
                    onChange={(e) => setManualCantidad(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="manual-precio" className="text-xs text-muted-foreground">
                    Precio unit.
                  </Label>
                  <Input
                    id="manual-precio"
                    inputMode="decimal"
                    value={manualPrecio}
                    onChange={(e) => setManualPrecio(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={agregarManual}
                  disabled={!manualDescripcion.trim() || !manualPrecio.trim()}
                >
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COMPROBANTE EN CURSO */}
        <Card>
          <CardHeader>
            <CardTitle>Comprobante</CardTitle>
            <CardDescription>Factura C · Consumidor Final</CardDescription>
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
                      <TableCell className="font-medium">{item.descripcion}</TableCell>
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
                        ${nf.format(item.precio_unitario)}
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

            <Button
              className="w-full"
              size="lg"
              disabled={emitting || cart.length === 0 || total <= 0}
              onClick={() => setConfirmarAbierto(true)}
            >
              {emitting ? 'Emitiendo...' : 'Emitir Factura C'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CONFIRMACIÓN PREVIA A LA EMISIÓN */}
      <Dialog open={confirmarAbierto} onOpenChange={setConfirmarAbierto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Emitir esta factura?</DialogTitle>
            <DialogDescription>
              Se solicitará un CAE a ARCA por una Factura C de{' '}
              <span className="font-semibold text-foreground">
                ${nf.format(total)}
              </span>{' '}
              con {cart.length} ítem{cart.length === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmarAbierto(false)}
              disabled={emitting}
            >
              Cancelar
            </Button>
            <Button onClick={emitirFactura} disabled={emitting}>
              {emitting ? 'Emitiendo...' : 'Sí, emitir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaEmitidaDialog
        factura={ultimaEmitida}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) limpiar();
        }}
      />
    </div>
  );
};
