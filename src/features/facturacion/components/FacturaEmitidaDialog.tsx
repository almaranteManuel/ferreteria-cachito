import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FacturaWithItems, formatearNumeroFactura } from '../types';
import { FacturaPrintView } from './FacturaPrintView';

interface FacturaEmitidaDialogProps {
  factura: FacturaWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Muestra la vista previa del comprobante emitido.
 * La impresión SOLO ocurre si el usuario aprieta "Imprimir factura".
 */
export const FacturaEmitidaDialog: React.FC<FacturaEmitidaDialogProps> = ({
  factura,
  open,
  onOpenChange,
}) => {
  const [imprimiendo, setImprimiendo] = React.useState(false);

  if (!factura) return null;

  const imprimir = () => {
    setImprimiendo(true);
    // Esperar al próximo frame para que la vista de impresión esté montada.
    requestAnimationFrame(() => {
      window.print();
      setImprimiendo(false);
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Factura emitida</DialogTitle>
            <DialogDescription>
              Comprobante autorizado por ARCA en modo homologación. Revisá la
              vista previa; solo se imprime si apretás "Imprimir factura".
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between text-sm border rounded-md px-3 py-2 bg-muted/40">
            <span className="font-mono font-semibold">
              Factura C {formatearNumeroFactura(factura)}
            </span>
            <span className="font-semibold">${factura.total.toFixed(2)}</span>
          </div>

          {/* Vista previa del comprobante (idéntica a lo que sale por impresora) */}
          <div className="border rounded-md overflow-y-auto max-h-[55vh] bg-white">
            <FacturaPrintView factura={factura} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button onClick={imprimir} disabled={imprimiendo}>
              {imprimiendo ? 'Preparando...' : 'Imprimir factura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vista de impresión: fuera de pantalla, visible solo al imprimir */}
      {imprimiendo && (
        <div className="factura-print-area fixed -left-[10000px] top-0 opacity-0 pointer-events-none">
          <FacturaPrintView factura={factura} />
        </div>
      )}
    </>
  );
};
