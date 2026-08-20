import React, { useState, useEffect } from 'react';
import { Customer, CustomerWithPayments } from '../types';
import { customerApi } from '../api/customerApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface CustomerDetailPanelProps {
  customer: Customer;
  onClose: () => void;
  onUpdate: () => void;
}

export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  customer,
  onClose,
  onUpdate,
}) => {
  const [detail, setDetail] = useState<CustomerWithPayments | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    try {
      const data = await customerApi.getCustomerWithPayments(customer.id);
      setDetail(data);
    } catch (err) {
      setError(String(err));
    }
  };

  useEffect(() => {
    loadDetail();
  }, [customer.id]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await customerApi.addPayment({
        customer_id: customer.id,
        amount,
        payment_method: 'EFECTIVO',
        note: note || null,
      });
      setDetail(updated);
      setPaymentAmount('');
      setNote('');
      onUpdate();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDebt = async () => {
    const amount = parseFloat(debtAmount);
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await customerApi.addDebt({
        customer_id: customer.id,
        amount,
        note: note || null,
      });
      setDetail(updated);
      setDebtAmount('');
      setNote('');
      onUpdate();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{customer.name}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 py-2">
          <span className="text-sm text-slate-500">Saldo adeudado:</span>
          <Badge variant={detail && detail.current_balance > 0 ? 'destructive' : 'default'}>
            {formatCurrency(detail?.current_balance ?? customer.current_balance)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Registrar pago ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
            />
            <Button size="sm" onClick={handlePayment} disabled={submitting}>
              Registrar pago
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Agregar deuda / fiado ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              placeholder="0.00"
            />
            <Button size="sm" variant="outline" onClick={handleAddDebt} disabled={submitting}>
              Agregar deuda
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nota (opcional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historial de movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {!detail?.payments.length ? (
              <p className="text-sm text-slate-500">Sin movimientos</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.date?.slice(0, 10)}</TableCell>
                      <TableCell>
                        <Badge variant={p.transaction_type === 'DEUDA' ? 'destructive' : 'default'}>
                          {p.transaction_type === 'DEUDA' ? 'Deuda' : 'Pago'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
