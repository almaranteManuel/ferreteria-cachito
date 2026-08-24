import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/mode-toggle';

import { 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Receipt, 
  BarChart3, 
  Bell 
} from 'lucide-react';

export type TabType = 'products' | 'sales' | 'customers' | 'billing' | 'suppliers' | 'reports';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-slate-50">
        
        {/* BARRA LATERAL (SIDEBAR) */}
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                F
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-bold text-sm leading-none text-sidebar-foreground">Ferretería Cachito</span>
                <span className="text-xs text-muted-foreground mt-1">Gestión Local</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Módulos Principales</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  
                  {/* Ítem: Productos */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'products'}
                      onClick={() => onTabChange('products')}
                      tooltip="Productos"
                    >
                      <Package className="h-4 w-4" />
                      <span>Productos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Ventas */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'sales'}
                      onClick={() => onTabChange('sales')}
                      tooltip="Ventas / Caja"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Ventas / POS</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Facturación */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'billing'}
                      onClick={() => onTabChange('billing')}
                      tooltip="Facturación electrónica"
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Facturación</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Clientes */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'customers'}
                      onClick={() => onTabChange('customers')}
                      tooltip="Clientes / Fiado"
                    >
                      <Users className="h-4 w-4" />
                      <span>Clientes & Cta. Cte.</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Proveedores */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'suppliers'}
                      tooltip="Proveedores"
                      onClick={() => onTabChange('suppliers')}
                    >
                      <Truck className="h-4 w-4" />
                      <span>Proveedores</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Resto de grupos del Sidebar... */}
            <SidebarGroup>
              <SidebarGroupLabel>Facturación y Reportes</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Facturación ARCA" onClick={() => alert('Próximamente')}>
                      <Receipt className="h-4 w-4" />
                      <span>Facturación (ARCA)</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'reports'}
                      onClick={() => onTabChange('reports')}
                      tooltip="Reportes"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Reportes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Recordatorios" onClick={() => alert('Usá Clientes & Cta. Cte. → Deudas con proveedores')}>
                      <Bell className="h-4 w-4" />
                      <span>Recordatorios</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border group-data-[collapsible=icon]:hidden text-xs text-slate-400">
            <ModeToggle />
          </SidebarFooter>
        </Sidebar>

        {/* CONTENIDO PRINCIPAL */}
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-4 w-[1px] bg-slate-200" />
              <span className="text-sm font-medium text-slate-600">
                {activeTab === 'products' && 'Gestión de Inventario'}
                {activeTab === 'sales' && 'Ventas / Caja'}
                {activeTab === 'customers' && 'Clientes & Cuenta Corriente'}
                {activeTab === 'suppliers' && 'Gestión de Proveedores'}
                {activeTab === 'reports' && 'Reportes de Ventas'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs font-medium text-slate-500">Sistema Activo</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>

      </div>
    </SidebarProvider>
  );
};