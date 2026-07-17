import {
  Building2,
  Users,
  Zap,
  Package,
  Route,
  BarChart3,
  Home as HomeIcon,
  ClipboardList,
  Calendar,
  CheckSquare,
  TrendingUp,
  Monitor,
  ShieldAlert,
  PackageCheck,
  Boxes,
  HardHat,
  FileSpreadsheet,
  BookOpen,
  Wrench,
  Gauge,
  FilePlus2,
  Receipt,
  User,
  Activity,
  Sun,
  Wallet,
  FileText,
  FileCheck2,
  type LucideIcon,
} from 'lucide-react';

/**
 * Fonte única de navegação do Super App.
 *
 * Cada item de funcionalidade (rota + role + ícone + descrição) é definido
 * UMA vez em `NAV_ITEMS`. A Sidebar (`AppSidebar.tsx`) e o Hub inicial
 * (`Home.tsx`) apenas agrupam/exibem esses mesmos itens — nunca duplicam a
 * lista de roles, para não divergirem com o tempo.
 */

export type Role =
  | 'admin'
  | 'area_tecnica'
  | 'engenharia'
  | 'supervisao'
  | 'lider'
  | 'backoffice'
  | 'sup_eletromecanico'
  | 'lider_eletromecanico'
  | 'tecnico_campo'
  | 'eletromecanico'
  | 'gerador'
  | 'cliente';

export interface NavItem {
  /** Chave estável usada para lookups (não exibida). */
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  /** Descrição de uma linha, usada pelos cards do Hub inicial. */
  description?: string;
  /** roles permitidas; se omitido, todas as autenticadas */
  allow?: Role[];
  /** Marca o item como fonte de um badge de contagem dinâmica na sidebar. */
  badgeKey?: 'rme' | 'insumos';
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

// Líder tem as mesmas permissões que Supervisor (mesma área), apenas nomenclatura diferente.
// area_tecnica é tratada como equivalente de staff técnico (enum do Sunflow).
export const STAFF: Role[] = ['admin', 'engenharia', 'area_tecnica', 'supervisao', 'lider'];
export const STAFF_BO: Role[] = [...STAFF, 'backoffice'];
export const ELETRO: Role[] = ['eletromecanico', 'sup_eletromecanico', 'lider_eletromecanico'];

export const hasAnyRole = (userRoles: Role[], allow?: Role[]) =>
  !allow || allow.some((r) => userRoles.includes(r));

// ---------------------------------------------------------------------------
// Itens (definidos uma única vez)
// ---------------------------------------------------------------------------

export const NAV_ITEMS = {
  // Operação
  dashboard: {
    key: 'dashboard',
    title: 'Dashboard',
    url: '/',
    icon: HomeIcon,
    allow: [...STAFF_BO, 'tecnico_campo', ...ELETRO],
  },
  tickets: {
    key: 'tickets',
    title: 'Tickets',
    url: '/tickets',
    icon: Package,
    description: 'Abertura e acompanhamento de chamados',
    allow: STAFF_BO,
  },
  workOrders: {
    key: 'workOrders',
    title: 'Ordens de Serviço',
    url: '/work-orders',
    icon: ClipboardList,
    description: 'Ordens de serviço em campo',
    allow: STAFF_BO,
  },
  rme: {
    key: 'rme',
    title: 'RME',
    url: '/rme',
    icon: BarChart3,
    description: 'Relatório de manutenção e execução',
    allow: STAFF_BO,
  },
  aprovarRME: {
    key: 'aprovarRME',
    title: 'Aprovar RMEs',
    url: '/gerenciar-rme',
    icon: CheckSquare,
    allow: ['admin', 'engenharia', 'supervisao'],
    badgeKey: 'rme',
  },
  rdo: {
    key: 'rdo',
    title: 'RDO',
    url: '/rdo',
    icon: FileSpreadsheet,
    description: 'Relatório diário de obra',
    allow: [...STAFF, ...ELETRO],
  },
  aprovarRDO: {
    key: 'aprovarRDO',
    title: 'Aprovar RDOs',
    url: '/gerenciar-rdo',
    icon: CheckSquare,
    allow: ['admin', 'engenharia', 'sup_eletromecanico'],
  },
  dashboardRDO: {
    key: 'dashboardRDO',
    title: 'Dashboard RDO',
    url: '/rdo/dashboard',
    icon: HomeIcon,
    allow: [...STAFF, ...ELETRO],
  },
  obras: {
    key: 'obras',
    title: 'Obras',
    url: '/obras',
    icon: HardHat,
    description: 'Acompanhamento de obras e EPC',
    allow: [...STAFF, 'sup_eletromecanico', 'lider_eletromecanico'],
  },
  catalogoAtividades: {
    key: 'catalogoAtividades',
    title: 'Catálogo de Atividades',
    url: '/obra-catalogo',
    icon: BookOpen,
    allow: ['admin'],
  },
  agenda: {
    key: 'agenda',
    title: 'Agenda',
    url: '/agenda',
    icon: Calendar,
    description: 'Agendamento de visitas e equipes',
    allow: STAFF_BO,
  },
  rotas: {
    key: 'rotas',
    title: 'Rotas',
    url: '/routes',
    icon: Route,
    description: 'Roteirização das equipes de campo',
    allow: [...STAFF_BO, 'tecnico_campo'],
  },
  cargaTrabalho: {
    key: 'cargaTrabalho',
    title: 'Carga de Trabalho',
    url: '/carga-trabalho',
    icon: TrendingUp,
    description: 'Distribuição de trabalho por técnico',
    allow: STAFF,
  },
  confirmacoes: {
    key: 'confirmacoes',
    title: 'Confirmações',
    url: '/dashboard-presenca',
    icon: Monitor,
    description: 'Confirmações de presença em campo',
    allow: STAFF,
  },
  insumos: {
    key: 'insumos',
    title: 'Insumos & Kits',
    url: '/insumos',
    icon: Package,
    description: 'Controle de insumos, kits e devoluções',
    allow: [...STAFF_BO, 'tecnico_campo'],
  },
  kits: {
    key: 'kits',
    title: 'Kits',
    url: '/kits',
    icon: Boxes,
    allow: ['admin', 'backoffice'],
  },
  validarInsumos: {
    key: 'validarInsumos',
    title: 'Validar Insumos',
    url: '/backoffice/insumos',
    icon: PackageCheck,
    allow: [...STAFF, 'backoffice'],
    badgeKey: 'insumos',
  },
  tecnicos: {
    key: 'tecnicos',
    title: 'Técnicos',
    url: '/tecnicos',
    icon: User,
    description: 'Cadastro da equipe técnica',
    allow: STAFF_BO,
  },
  prestadores: {
    key: 'prestadores',
    title: 'Prestadores',
    url: '/prestadores',
    icon: Users,
    description: 'Cadastro de prestadores de serviço',
    allow: STAFF_BO,
  },
  equipamentos: {
    key: 'equipamentos',
    title: 'Equipamentos',
    url: '/equipamentos',
    icon: Zap,
    description: 'Inventário de equipamentos',
    allow: STAFF_BO,
  },
  clientesOM: {
    key: 'clientesOM',
    title: 'Clientes',
    url: '/clientes',
    icon: Building2,
    description: 'Cadastro de clientes de O&M',
    allow: STAFF_BO,
  },
  relatorios: {
    key: 'relatorios',
    title: 'Relatórios',
    url: '/relatorios',
    icon: BarChart3,
    description: 'Relatórios operacionais e de performance',
    allow: STAFF_BO,
  },

  // Monitoramento
  monitoramentoUsinas: {
    key: 'monitoramentoUsinas',
    title: 'Usinas',
    url: '/monitoring',
    icon: Activity,
    description: 'Monitoramento das usinas em tempo real',
    allow: STAFF,
  },

  // Faturamento (staff)
  billingDashboard: {
    key: 'billingDashboard',
    title: 'Dashboard Executivo',
    url: '/billing',
    icon: Gauge,
    description: 'Visão executiva do faturamento GD',
    allow: STAFF,
  },
  billingLancar: {
    key: 'billingLancar',
    title: 'Lançar Fatura',
    url: '/billing/admin/lancar',
    icon: FilePlus2,
    description: 'Lançamento manual de dados de fatura',
    allow: STAFF,
  },
  billingFaturas: {
    key: 'billingFaturas',
    title: 'Gerenciar Faturas',
    url: '/billing/admin/faturas',
    icon: FileText,
    description: 'Gestão das faturas de energia',
    allow: STAFF,
  },
  billingClientes: {
    key: 'billingClientes',
    title: 'Clientes GD',
    url: '/billing/admin/clientes',
    icon: Building2,
    description: 'Cadastro de clientes de faturamento GD',
    allow: STAFF,
  },
  billingUsinas: {
    key: 'billingUsinas',
    title: 'Usinas GD',
    url: '/billing/admin/usinas',
    icon: Sun,
    description: 'Cadastro das usinas geradoras',
    allow: STAFF,
  },
  billingTarifas: {
    key: 'billingTarifas',
    title: 'Tarifas',
    url: '/billing/admin/tarifas',
    icon: Receipt,
    description: 'Tarifas de energia por concessionária',
    allow: STAFF,
  },

  // Minha Área (cliente / gerador)
  meuPainel: {
    key: 'meuPainel',
    title: 'Meu Painel',
    url: '/meu-painel',
    icon: User,
    allow: ['cliente'],
  },
  meuPainelOM: {
    key: 'meuPainelOM',
    title: 'O&M',
    url: '/meu-painel/om',
    icon: Wrench,
    allow: ['cliente'],
  },
  meuPainelObras: {
    key: 'meuPainelObras',
    title: 'Obras',
    url: '/meu-painel/obras',
    icon: HardHat,
    allow: ['cliente'],
  },
  minhaEconomia: {
    key: 'minhaEconomia',
    title: 'Minha Economia',
    url: '/billing',
    icon: Wallet,
    allow: ['cliente'],
  },
  minhasFaturas: {
    key: 'minhasFaturas',
    title: 'Minhas Faturas',
    url: '/billing/energia',
    icon: FileText,
    allow: ['cliente'],
  },
  assinatura: {
    key: 'assinatura',
    title: 'Assinatura',
    url: '/billing/assinatura',
    icon: FileCheck2,
    allow: ['cliente'],
  },
  minhaUsina: {
    key: 'minhaUsina',
    title: 'Minha Usina',
    url: '/billing/gerador',
    icon: Sun,
    allow: ['gerador'],
  },

  // Campo (técnico)
  minhasOS: {
    key: 'minhasOS',
    title: 'Minhas OS',
    url: '/minhas-os',
    icon: ClipboardList,
    allow: ['tecnico_campo', ...ELETRO],
  },
  minhasDevolucoes: {
    key: 'minhasDevolucoes',
    title: 'Minhas Devoluções',
    url: '/minhas-devolucoes',
    icon: PackageCheck,
    allow: ['tecnico_campo', ...ELETRO],
  },

  // Administração
  usuarios: {
    key: 'usuarios',
    title: 'Usuários',
    url: '/usuarios',
    icon: User,
    description: 'Gestão de usuários e permissões',
    allow: ['admin', 'engenharia'],
  },
  auditoria: {
    key: 'auditoria',
    title: 'Auditoria',
    url: '/audit-logs',
    icon: ShieldAlert,
    description: 'Log de auditoria do sistema',
    allow: ['admin'],
  },
} satisfies Record<string, NavItem>;

// ---------------------------------------------------------------------------
// Agrupamento para a Sidebar (navegação completa)
// ---------------------------------------------------------------------------

export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    id: 'campo',
    label: 'Meu Trabalho',
    items: [NAV_ITEMS.minhasOS, NAV_ITEMS.minhasDevolucoes],
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: [
      NAV_ITEMS.dashboard,
      NAV_ITEMS.tickets,
      NAV_ITEMS.workOrders,
      NAV_ITEMS.rme,
      NAV_ITEMS.aprovarRME,
      NAV_ITEMS.rdo,
      NAV_ITEMS.aprovarRDO,
      NAV_ITEMS.dashboardRDO,
      NAV_ITEMS.obras,
      NAV_ITEMS.catalogoAtividades,
      NAV_ITEMS.agenda,
      NAV_ITEMS.rotas,
      NAV_ITEMS.cargaTrabalho,
      NAV_ITEMS.confirmacoes,
      NAV_ITEMS.insumos,
      NAV_ITEMS.kits,
      NAV_ITEMS.validarInsumos,
      NAV_ITEMS.tecnicos,
      NAV_ITEMS.prestadores,
      NAV_ITEMS.equipamentos,
      NAV_ITEMS.clientesOM,
      NAV_ITEMS.relatorios,
    ],
  },
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    items: [NAV_ITEMS.monitoramentoUsinas],
  },
  {
    id: 'faturamento',
    label: 'Faturamento',
    items: [
      NAV_ITEMS.billingDashboard,
      NAV_ITEMS.billingLancar,
      NAV_ITEMS.billingFaturas,
      NAV_ITEMS.billingClientes,
      NAV_ITEMS.billingUsinas,
      NAV_ITEMS.billingTarifas,
    ],
  },
  {
    id: 'minha-area',
    label: 'Minha Área',
    items: [
      NAV_ITEMS.meuPainel,
      NAV_ITEMS.meuPainelOM,
      NAV_ITEMS.meuPainelObras,
      NAV_ITEMS.minhaEconomia,
      NAV_ITEMS.minhasFaturas,
      NAV_ITEMS.assinatura,
      NAV_ITEMS.minhaUsina,
    ],
  },
  {
    id: 'administracao',
    label: 'Administração',
    items: [NAV_ITEMS.usuarios, NAV_ITEMS.auditoria],
  },
];

// ---------------------------------------------------------------------------
// Agrupamento para o Hub inicial (Home) — subconjunto curado, mesmos itens
// ---------------------------------------------------------------------------

export const HOME_SECTIONS: NavSection[] = [
  {
    id: 'operacao-campo',
    label: 'Operação de Campo',
    items: [
      NAV_ITEMS.tickets,
      NAV_ITEMS.workOrders,
      NAV_ITEMS.agenda,
      NAV_ITEMS.rme,
      NAV_ITEMS.rdo,
      NAV_ITEMS.obras,
      NAV_ITEMS.rotas,
      NAV_ITEMS.cargaTrabalho,
      NAV_ITEMS.insumos,
      NAV_ITEMS.tecnicos,
      NAV_ITEMS.prestadores,
    ],
  },
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    items: [NAV_ITEMS.monitoramentoUsinas],
  },
  {
    id: 'faturamento-gd',
    label: 'Faturamento GD',
    items: [
      NAV_ITEMS.billingDashboard,
      NAV_ITEMS.billingLancar,
      NAV_ITEMS.billingFaturas,
      NAV_ITEMS.billingTarifas,
      NAV_ITEMS.billingClientes,
      NAV_ITEMS.billingUsinas,
    ],
  },
  {
    id: 'administracao',
    label: 'Administração',
    items: [NAV_ITEMS.usuarios, NAV_ITEMS.relatorios, NAV_ITEMS.auditoria],
  },
];
