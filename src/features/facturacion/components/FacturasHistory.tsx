import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { facturacionApi } from '../api/facturacionApi';
import { Factura, FacturaWithItems, formatearNumeroFactura } from '../types';

interface FacturasHistoryProps {
  facturas: Factura[];
  loading: boolean;
  error: string | null;
}

const nf = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDate = (value: string) => {
  const date = value.split('T')[0].split(' ')[0];
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export const FacturasHistory: React.FC<FacturasHistoryProps> = ({
  facturas,
  loading,
  error,
}) => {
  const [selectedFactura, setSelectedFactura] = useState<FacturaWithItems | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const showDetails = async (factura: Factura) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      setSelectedFactura(await facturacionApi.getFactura(factura.id));
    } catch (err) {
      setDetailError(String(err));
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Facturas emitidas</CardTitle>
          <CardDescription>
            Historial reciente de comprobantes autorizados y su detalle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando facturas...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : facturas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay facturas emitidas.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>N.º de factura</TableHead>
                    <TableHead className="text-right">Monto total</TableHead>
                    <TableHead className="text-right">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturas.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell>{formatDate(factura.fecha)}</TableCell>
                      <TableCell className="font-mono">
                        Factura C {formatearNumeroFactura(factura)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${nf.format(factura.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showDetails(factura)}
                          disabled={loadingDetail}
                        >
                          Ver detalle
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

      <Dialog
        open={selectedFactura !== null || loadingDetail || detailError !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFactura(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFactura
                ? `Factura C ${formatearNumeroFactura(selectedFactura)}`
                : 'Detalle de factura'}
            </DialogTitle>
            <DialogDescription>
              {selectedFactura
                ? `${formatDate(selectedFactura.fecha)} · Cliente: ${
                    selectedFactura.cliente_nombre ?? 'Consumidor Final'
                  }`
                : 'Consultando el detalle guardado...'}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <p className="text-sm text-muted-foreground">Cargando detalle...</p>
          ) : detailError ? (
            <p className="text-sm text-destructive">{detailError}</p>
          ) : selectedFactura ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">P. unitario</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedFactura.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell className="text-right">{nf.format(item.cantidad)}</TableCell>
                      <TableCell className="text-right">
                        ${nf.format(item.precio_unitario)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${nf.format(item.cantidad * item.precio_unitario)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end border-t pt-3 text-lg font-semibold">
                Total: ${nf.format(selectedFactura.total)}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
