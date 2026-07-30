import React, { useState } from 'react';
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

// Íconos opcionales (podés usar lucide-react o cualquier set de íconos)
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Receipt, 
  BarChart3, 
  Bell 
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Estado para controlar qué sección está seleccionada
  const [activeTab, setActiveTab] = useState<'products' | 'sales' | 'customers' | 'billing'>('products');

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
                  
                  {/* Ítem: Productos / Inventario (ACTIVO POR AHORA) */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'products'}
                      onClick={() => setActiveTab('products')}
                      tooltip="Productos"
                    >
                      <Package className="h-4 w-4" />
                      <span>Productos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Ventas / Mostrador */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'sales'}
                      onClick={() => alert('Próximamente: Módulo de Ventas POS')}
                      tooltip="Ventas / Caja"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Ventas / POS</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Cta. Cte. / Clientes */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === 'customers'}
                      onClick={() => alert('Próximamente: Módulo de Clientes')}
                      tooltip="Clientes / Fiado"
                    >
                      <Users className="h-4 w-4" />
                      <span>Clientes & Cta. Cte.</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Proveedores & Compras */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Proveedores"
                      onClick={() => alert('Próximamente: Proveedores')}
                    >
                      <Truck className="h-4 w-4" />
                      <span>Proveedores</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Facturación y Reportes</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  
                  {/* Ítem: Facturación ARCA */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Facturación ARCA"
                      onClick={() => alert('Próximamente: Facturación ARCA/AFIP')}
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Facturación (ARCA)</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Reportes */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Reportes"
                      onClick={() => alert('Próximamente: Dashboard de Reportes')}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Reportes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Ítem: Recordatorios */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Recordatorios"
                      onClick={() => alert('Próximamente: Recordatorios')}
                    >
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

        {/* CONTENIDO PRINCIPAL (HEADER + VISTAS) */}
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          
          {/* Header Superior del Dashboard */}
          <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-4 w-[1px] bg-slate-200" />
              <span className="text-sm font-medium text-slate-600">
                {activeTab === 'products' && 'Gestión de Inventario'}
              </span>
            </div>

            {/* Status Indicador de la DB local */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs font-medium text-slate-500">Sistema Activo</span>
            </div>
          </header>

          {/* Área de trabajo desplazable */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          
        </SidebarInset>

      </div>
    </SidebarProvider>
  );
};