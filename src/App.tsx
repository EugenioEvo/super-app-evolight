import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RealtimeProvider } from "@/hooks/useRealtimeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import RoutesPage from "./pages/Routes";
import Agenda from "./pages/Agenda";
import CargaTrabalho from "./pages/CargaTrabalho";
import Clientes from "./pages/Clientes";
import Tickets from "./pages/Tickets";
import Equipamentos from "./pages/Equipamentos";
import Insumos from "./pages/Insumos";
import Prestadores from "./pages/Prestadores";
import Tecnicos from "./pages/Tecnicos";
import MinhasOS from "./pages/MinhasOS";
import MinhasDevolucoes from "./pages/MinhasDevolucoes";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import Relatorios from "./pages/Relatorios";
import GerenciarRME from "./pages/GerenciarRME";
import DashboardPresenca from "./pages/DashboardPresenca";
import AuditLogs from "./pages/AuditLogs";
import ClientDashboard from "./pages/ClientDashboard";
import PresenceConfirmation from "./pages/PresenceConfirmation";
import VisualizarOS from "./pages/VisualizarOS";
import WorkOrders from "./pages/WorkOrders";
// WorkOrderCreate removed (Phase 3) — replaced by MultiTechnicianOSDialog (standalone mode) opened from /work-orders.
import WorkOrderDetail from "./pages/WorkOrderDetail";
import RMEWizard from "./pages/RMEWizard";
import ResetPassword from "./pages/ResetPassword";
import Candidatar from "./pages/Candidatar";
import Usuarios from "./pages/Usuarios";
import Kits from "./pages/Kits";
import BackofficeInsumos from "./pages/BackofficeInsumos";
import Obras from "./pages/Obras";
import ObraDetail from "./pages/ObraDetail";
import ObraCatalogo from "./pages/ObraCatalogo";
import RDO from "./pages/RDO";
import RDOWizard from "./pages/RDOWizard";
import GerenciarRDO from "./pages/GerenciarRDO";
import DashboardRDO from "./pages/DashboardRDO";
import PublicObraView from "./pages/PublicObraView";
import { lazy, Suspense } from "react";
import { EnergyProvider } from "@/features/billing/context/EnergyContext";
import MonitoringPlantsList from "./features/monitoring/pages/PlantsList";
import MonitoringPlantDetail from "./features/monitoring/pages/PlantDetail";

// Módulo de Faturamento GD (transplantado do energy-insights) — lazy loaded
const BillingExecutiveDashboard = lazy(() => import("./features/billing/pages/ExecutiveDashboard"));
const BillingEnergiaFatura = lazy(() => import("./features/billing/pages/EnergiaFatura"));
const BillingSolar = lazy(() => import("./features/billing/pages/Solar"));
const BillingAssinatura = lazy(() => import("./features/billing/pages/Assinatura"));
const BillingDashboardGerador = lazy(() => import("./features/billing/pages/DashboardGerador"));
const BillingLancarDados = lazy(() => import("./features/billing/pages/LancarDados"));
const BillingClientes = lazy(() => import("./features/billing/pages/BillingClientes"));
const BillingGerenciarFaturas = lazy(() => import("./features/billing/pages/GerenciarFaturas"));
const BillingUsinas = lazy(() => import("./features/billing/pages/BillingUsinas"));
const BillingTarifas = lazy(() => import("./features/billing/pages/Tarifas"));

const BillingSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    }
  >
    {children}
  </Suspense>
);

// Legacy /rme route → redirects to the unified Wizard, preserving ?os=
const LegacyRMERedirect = () => {
  const [params] = useSearchParams();
  const os = params.get("os");
  return <Navigate to={os ? `/rme-wizard/new?os=${os}` : "/minhas-os"} replace />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/candidatar-se" element={<Candidatar />} />
              <Route path="/confirmar-presenca" element={<PresenceConfirmation />} />
              <Route path="/p/obra/:token" element={<PublicObraView />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full bg-background">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col">
                        <TopHeader />
                        <main className="flex-1 overflow-auto bg-muted/30">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/meu-painel" element={
                              <ProtectedRoute roles={['cliente']}>
                                <ClientDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/meu-painel/:view" element={
                              <ProtectedRoute roles={['cliente']}>
                                <ClientDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/tickets" element={<Tickets />} />
                            <Route path="/routes" element={<RoutesPage />} />
                            <Route path="/agenda" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <Agenda />
                              </ProtectedRoute>
                            } />
                            <Route path="/carga-trabalho" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <CargaTrabalho />
                              </ProtectedRoute>
                            } />
                            <Route path="/dashboard-presenca" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <DashboardPresenca />
                              </ProtectedRoute>
                            } />
                            <Route path="/clientes" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <Clientes />
                              </ProtectedRoute>
                            } />
                            <Route path="/prestadores" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <Prestadores />
                              </ProtectedRoute>
                            } />
                            <Route path="/usuarios" element={
                              <ProtectedRoute roles={['admin', 'engenharia']}>
                                <Usuarios />
                              </ProtectedRoute>
                            } />
                            <Route path="/tecnicos" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <Tecnicos />
                              </ProtectedRoute>
                            } />
                            <Route path="/minhas-os" element={<MinhasOS />} />
                            <Route path="/minhas-devolucoes" element={
                              <ProtectedRoute roles={['tecnico_campo', 'admin', 'engenharia', 'supervisao', 'lider', 'backoffice']}>
                                <MinhasDevolucoes />
                              </ProtectedRoute>
                            } />
                            <Route path="/equipamentos" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <Equipamentos />
                              </ProtectedRoute>
                            } />
                            <Route path="/insumos" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider', 'backoffice', 'tecnico_campo']}>
                                <Insumos />
                              </ProtectedRoute>
                            } />
                            <Route path="/kits" element={
                              <ProtectedRoute roles={['admin', 'backoffice']}>
                                <Kits />
                              </ProtectedRoute>
                            } />
                            <Route path="/backoffice/insumos" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider', 'backoffice']}>
                                <BackofficeInsumos />
                              </ProtectedRoute>
                            } />
                            <Route path="/rme" element={<LegacyRMERedirect />} />
                            <Route path="/gerenciar-rme" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao']}>
                                <GerenciarRME />
                              </ProtectedRoute>
                            } />
                            <Route path="/obras" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider', 'sup_eletromecanico', 'lider_eletromecanico']}>
                                <Obras />
                              </ProtectedRoute>
                            } />
                            <Route path="/obras/:id" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider', 'sup_eletromecanico', 'lider_eletromecanico']}>
                                <ObraDetail mode="staff" />
                              </ProtectedRoute>
                            } />
                            <Route path="/obra-catalogo" element={
                              <ProtectedRoute roles={['admin']}>
                                <ObraCatalogo />
                              </ProtectedRoute>
                            } />
                            <Route path="/rdo" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider', 'sup_eletromecanico', 'lider_eletromecanico', 'eletromecanico']}>
                                <RDO />
                              </ProtectedRoute>
                            } />
                            <Route path="/rdo/dashboard" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider', 'sup_eletromecanico', 'lider_eletromecanico', 'eletromecanico']}>
                                <DashboardRDO />
                              </ProtectedRoute>
                            } />
                            <Route path="/rdo/novo" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider', 'sup_eletromecanico', 'lider_eletromecanico']}>
                                <RDOWizard />
                              </ProtectedRoute>
                            } />
                            <Route path="/rdo/:id" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider', 'sup_eletromecanico', 'lider_eletromecanico', 'eletromecanico']}>
                                <RDOWizard />
                              </ProtectedRoute>
                            } />
                            <Route path="/gerenciar-rdo" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'sup_eletromecanico']}>
                                <GerenciarRDO />
                              </ProtectedRoute>
                            } />
                            <Route path="/portal/obras/:id" element={
                              <ProtectedRoute roles={['cliente']}>
                                <ObraDetail mode="cliente" />
                              </ProtectedRoute>
                            } />
                            <Route path="/relatorios" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <Relatorios />
                              </ProtectedRoute>
                            } />
                            <Route path="/audit-logs" element={
                              <ProtectedRoute roles={['admin']}>
                                <AuditLogs />
                              </ProtectedRoute>
                            } />
                            {/* Monitoramento de usinas solares */}
                            <Route path="/monitoring" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <MonitoringPlantsList />
                              </ProtectedRoute>
                            } />
                            <Route path="/monitoring/:id" element={
                              <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                <MonitoringPlantDetail />
                              </ProtectedRoute>
                            } />
                            {/* Faturamento GD (energy-insights) */}
                            <Route path="/billing" element={
                              <EnergyProvider>
                                <BillingSuspense>
                                  <Outlet />
                                </BillingSuspense>
                              </EnergyProvider>
                            }>
                              <Route index element={
                                <ProtectedRoute roles={['admin', 'cliente', 'gerador']}>
                                  <BillingExecutiveDashboard />
                                </ProtectedRoute>
                              } />
                              <Route path="energia" element={
                                <ProtectedRoute roles={['admin', 'cliente', 'gerador']}>
                                  <BillingEnergiaFatura />
                                </ProtectedRoute>
                              } />
                              <Route path="solar" element={
                                <ProtectedRoute roles={['admin', 'cliente', 'gerador']}>
                                  <BillingSolar />
                                </ProtectedRoute>
                              } />
                              <Route path="assinatura" element={
                                <ProtectedRoute roles={['admin', 'cliente', 'gerador']}>
                                  <BillingAssinatura />
                                </ProtectedRoute>
                              } />
                              <Route path="gerador" element={
                                <ProtectedRoute roles={['admin', 'cliente', 'gerador']}>
                                  <BillingDashboardGerador />
                                </ProtectedRoute>
                              } />
                              <Route path="admin/lancar" element={
                                <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                  <BillingLancarDados />
                                </ProtectedRoute>
                              } />
                              <Route path="admin/clientes" element={
                                <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                  <BillingClientes />
                                </ProtectedRoute>
                              } />
                              <Route path="admin/faturas" element={
                                <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                  <BillingGerenciarFaturas />
                                </ProtectedRoute>
                              } />
                              <Route path="admin/usinas" element={
                                <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                  <BillingUsinas />
                                </ProtectedRoute>
                              } />
                              <Route path="admin/tarifas" element={
                                <ProtectedRoute roles={['admin', 'engenharia', 'supervisao', 'lider']}>
                                  <BillingTarifas />
                                </ProtectedRoute>
                              } />
                            </Route>
                            <Route path="/visualizar-os/:id" element={<VisualizarOS />} />
                            <Route path="/work-orders" element={<WorkOrders />} />
                            <Route path="/work-orders/new" element={<Navigate to="/work-orders" replace />} />
                            <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
                            <Route path="/rme-wizard/:id" element={<RMEWizard />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;