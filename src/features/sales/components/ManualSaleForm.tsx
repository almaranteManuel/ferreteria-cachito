import React, { useState, useEffect, useCallback } from 'react';
import { productApi } from '@/features/products/api/productApi';
import { Product } from '@/features/products/types';
import { customerApi } from '@/features/customers/api/customerApi';
import { Customer } from '@/features/customers/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CartItem, calcSalePrice, PAYMENT_METHODS } from '../types';
import { saleApi } from '../api/saleApi';

interface ManualSaleFormProps {
  onSuccess: () => void;
}

export const ManualSaleForm: React.FC<ManualSaleFormProps> = ({ onSuccess }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [customerId, setCustomerId] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await productApi.searchProducts(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  useEffect(() => {
    customerApi.searchCustomers('').then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const addToCart = (product: Product) => {
    const unitPrice = calcSalePrice(product.price, product.variant);
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          code: product.code,
          description: product.description,
          quantity: 1,
          unit_price: unitPrice,
          stock: product.stock,
        },
      ];
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    );
  };

  const updatePrice = (productId: number, price: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, unit_price: price } : i))
    );
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const handleSubmit = async () => {
    setError(null);
    if (cart.length === 0) {
      setError('Agregá al menos un producto');
      return;
    }
    if (paymentMethod === 'CUENTA_CORRIENTE' && !customerId) {
      setError('Seleccioná un cliente para fiado');
      return;
    }

    setSubmitting(true);
    try {
      await saleApi.createDetailedSale({
        date,
        payment_method: paymentMethod,
        customer_id: customerId ? parseInt(customerId, 10) : null,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });
      setCart([]);
      onSuccess();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Código o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 border-b last:border-b-0 text-sm"
                  onClick={() => addToCart(p)}
                >
                  <span className="font-medium">{p.description}</span>
                  <span className="text-slate-500 ml-2">
                    {formatCurrency(calcSalePrice(p.price, p.variant))} · Stock: {p.stock}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carrito de venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {cart.length === 0 ? (
            <p className="text-sm text-slate-500">No hay productos en el carrito</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-20">Cant.</TableHead>
                  <TableHead className="w-28">Precio</TableHead>
                  <TableHead className="w-24">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="text-sm">{item.description}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        className="h-8"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.product_id, parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8"
                        value={item.unit_price}
                        onChange={(e) =>
                          updatePrice(item.product_id, parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pago</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {paymentMethod === 'CUENTA_CORRIENTE' && (
            <div className="space-y-2">
              <Label>Cliente (fiado)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Seleccionar cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <Badge variant="default" className="text-base px-3 py-1">
              Total: {formatCurrency(cartTotal)}
            </Badge>
            <Button onClick={handleSubmit} disabled={submitting || cart.length === 0}>
              {submitting ? 'Procesando...' : 'Confirmar venta'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
