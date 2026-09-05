import { useCallback, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmLabel?: string;
}

interface ConfirmationRequest extends ConfirmationOptions {
  resolve: (confirmed: boolean) => void;
}

export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestRef = useRef<ConfirmationRequest | null>(null);

  const close = useCallback((confirmed: boolean) => {
    const current = requestRef.current;
    requestRef.current = null;
    setRequest(null);
    setSubmitting(false);
    current?.resolve(confirmed);
  }, []);

  const requestConfirmation = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      const nextRequest = { ...options, resolve };
      requestRef.current = nextRequest;
      setRequest(nextRequest);
    });
  }, []);

  const handleConfirm = async () => {
    setSubmitting(true);
    close(true);
  };

  const confirmationDialog = request ? (
    <Dialog open onOpenChange={(open) => !open && close(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>{request.title}</DialogTitle>
          </div>
          <DialogDescription>{request.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Procesando...' : request.confirmLabel ?? 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  return { requestConfirmation, confirmationDialog };
}
