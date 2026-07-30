import { MainLayout } from '../app/layouts/MainLayout';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { ThemeProvider } from "@/components/theme-provider"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <MainLayout>
        <ProductsPage />
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;