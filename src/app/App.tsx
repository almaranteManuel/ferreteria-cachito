import { useState } from 'react';
import { SuppliersPage } from '@/features/suppliers/pages/SuppliersPage';
import { MainLayout, TabType } from '../app/layouts/MainLayout';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { SalesPage } from '../features/sales/pages/SalesPage';
import { CustomersPage } from '../features/customers/pages/CustomersPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { FacturacionPage } from '@/features/facturacion/pages/FacturacionPage';
import { PresupuestosPage } from '@/features/presupuestos/pages/PresupuestosPage';
import { ExpensesPage } from '@/features/expenses/pages/ExpensesPage';
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'sales' && <SalesPage />}
        {activeTab === 'customers' && <CustomersPage />}
        {activeTab === 'billing' && <FacturacionPage />}
        {activeTab === 'suppliers' && <SuppliersPage />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'expenses' && <ExpensesPage />}
        {activeTab === 'presupuestos' && <PresupuestosPage />}
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;
