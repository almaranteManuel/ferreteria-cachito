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
import { PresupuestoWithItems, formatearNumeroPresupuesto } from '../types';
import { PresupuestoPrintView } from './PresupuestoPrintView';

interface Props {
  presupuesto: PresupuestoWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PresupuestoPreviewDialog: React.FC<Props> = ({
  presupuesto,
  open,
  onOpenChange,
}) => {
  const [imprimiendo, setImprimiendo] = React.useState(false);

  if (!presupuesto) return null;

  const imprimir = () => {
    setImprimiendo(true);
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
            <DialogTitle>Vista previa — Presupuesto</DialogTitle>
            <DialogDescription>
              Revisá el documento antes de imprimir. Solo se imprime si apretás &quot;Imprimir&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between text-sm border rounded-md px-3 py-2 bg-muted/40">
            <span className="font-mono font-semibold">
              PRES {formatearNumeroPresupuesto(presupuesto)}
            </span>
            <span className="font-semibold">${presupuesto.total.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">
              {presupuesto.cliente_nombre || 'Consumidor Final'}
            </span>
          </div>

          <div className="border rounded-md overflow-y-auto max-h-[55vh] bg-white">
            <PresupuestoPrintView presupuesto={presupuesto} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={imprimir} disabled={imprimiendo}>
              {imprimiendo ? 'Preparando...' : 'Imprimir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {imprimiendo && (
        <div className="presupuesto-print-area fixed -left-[10000px] top-0 opacity-0 pointer-events-none">
          <PresupuestoPrintView presupuesto={presupuesto} />
        </div>
      )}
    </>
  );
};
