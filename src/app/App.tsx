import { useState } from 'react';
import { SuppliersPage } from '@/features/suppliers/pages/SuppliersPage';
import { MainLayout, TabType } from '../app/layouts/MainLayout';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'suppliers' && <SuppliersPage />}
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;