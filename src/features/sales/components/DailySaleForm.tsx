import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PAYMENT_METHODS } from '../types';
import { saleApi } from '../api/saleApi';

interface DailySaleFormProps {
  onSuccess: () => void;
}

export const DailySaleForm: React.FC<DailySaleFormProps> = ({ onSuccess }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('EFECTIVO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const total = parseFloat(amount);
    if (!total || total <= 0) {
      setError('Ingresá un monto válido');
      return;
    }

    setSubmitting(true);
    try {
      await saleApi.createDailySale({
        date,
        total_amount: total,
        payment_method: paymentMethod,
      });
      setAmount('');
      onSuccess();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Total del día</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {error && (
            <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="daily-date">Fecha</Label>
            <Input
              id="daily-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily-amount">Monto total ($)</Label>
            <Input
              id="daily-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily-payment">Forma de pago</Label>
            <select
              id="daily-payment"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.filter((m) => m !== 'CUENTA_CORRIENTE').map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Registrar total del día'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
