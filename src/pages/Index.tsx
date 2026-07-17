import TechnicianDashboard from "@/components/TechnicianDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";

/**
 * Rota "/": dispatcher de home por perfil.
 *
 * Prioridade quando o usuário acumula múltiplas roles: staff > gerador > cliente.
 * `profile.role` já reflete essa prioridade (ver ROLE_PRIORITY em useAuth.tsx).
 *
 * - cliente (não-staff)              → /meu-painel (portal do cliente, ClientDashboard)
 * - gerador (não-staff, não-cliente)  → /billing/gerador (Dashboard do Gerador)
 * - eletromecânica (EPC)              → /rdo/dashboard
 * - tecnico_campo                     → TechnicianDashboard (renderizado aqui mesmo)
 * - demais staff                      → Home (hub + dashboard operacional)
 */
const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile?.role) return;
    if (profile.role === 'cliente') {
      navigate('/meu-painel');
    } else if (profile.role === 'gerador') {
      navigate('/billing/gerador');
    } else if (['sup_eletromecanico', 'eletromecanico', 'lider_eletromecanico'].includes(profile.role)) {
      // Equipe de eletromecânica (EPC) vai direto ao Dashboard de RDOs
      navigate('/rdo/dashboard');
    }
  }, [profile, navigate]);

  // Se for técnico, mostrar dashboard específico
  if (profile?.role === 'tecnico_campo') {
    return <TechnicianDashboard />;
  }

  return <Home />;
};

export default Index;
