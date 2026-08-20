import React, { useState, useEffect } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { Customer } from '../types';
import { customerApi } from '../api/customerApi';
import { supplierApi } from '@/features/suppliers/api/supplierApi';
import { Supplier } from '@/features/suppliers/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CustomerDetailPanel } from './CustomerDetailPanel';
import { SupplierDebt } from '../types';

export const CustomersTab: React.FC = () => {
  const { customers, searchQuery, setSearchQuery, loading, error, refreshCustomers } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await customerApi.createCustomer({ name: newName, phone: newPhone || null });
    setNewName('');
    setNewPhone('');
    setShowCreate(false);
    refreshCustomers();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>+ Nuevo cliente</Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleCreate}>Guardar cliente</Button>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-slate-500">No hay clientes registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Deuda</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.phone || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.current_balance > 0 ? 'destructive' : 'secondary'}>
                        {formatCurrency(c.current_balance)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCustomer(c)}>
                        Ver cuenta
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedCustomer && (
        <CustomerDetailPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={refreshCustomers}
        />
      )}
    </div>
  );
};

export const SupplierDebtsTab: React.FC = () => {
  const [debts, setDebts] = useState<SupplierDebt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const data = await customerApi.listSupplierDebts();
      setDebts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
    supplierApi.searchSuppliers('').then(setSuppliers).catch(() => setSuppliers([]));
  }, []);

  const handleCreate = async () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || !parsedAmount || parsedAmount <= 0) return;
    await customerApi.createSupplierDebt({
      title,
      amount: parsedAmount,
      supplier_id: supplierId ? parseInt(supplierId, 10) : null,
      description: description || null,
      due_date: dueDate || null,
    });
    setTitle('');
    setAmount('');
    setSupplierId('');
    setDescription('');
    setDueDate('');
    setShowCreate(false);
    loadDebts();
  };

  const handleMarkPaid = async (id: number) => {
    await customerApi.markSupplierDebtPaid(id);
    loadDebts();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(!showCreate)}>+ Nueva deuda con proveedor</Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrar deuda con proveedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Deuda Ferretería XYZ" />
              </div>
              <div className="space-y-2">
                <Label>Monto ($) *</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Sin proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Vencimiento</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button onClick={handleCreate}>Guardar deuda</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : debts.length === 0 ? (
            <p className="text-sm text-slate-500">No hay deudas pendientes con proveedores</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.title}</TableCell>
                    <TableCell>{d.supplier_name || '—'}</TableCell>
                    <TableCell>{d.due_date?.slice(0, 10) || '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {d.amount != null ? formatCurrency(d.amount) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleMarkPaid(d.id)}>
                        Marcar pagada
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
