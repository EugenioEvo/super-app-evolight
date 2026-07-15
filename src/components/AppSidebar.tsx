import { useState, useEffect } from "react";
import { Zap, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SIDEBAR_SECTIONS, hasAnyRole, type NavItem, type Role } from "@/lib/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { open } = useSidebar();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = !open;
  const [pendingRMEsCount, setPendingRMEsCount] = useState(0);
  const [pendingInsumosCount, setPendingInsumosCount] = useState(0);

  const userRoles = (profile?.roles ?? []) as Role[];

  const isStaff = userRoles.some((r) => (['admin', 'engenharia', 'area_tecnica', 'supervisao', 'lider'] as Role[]).includes(r));
  const isBackoffice = userRoles.includes('backoffice');

  useEffect(() => {
    if (isStaff) {
      loadPendingRMEsCount();
      const channel = supabase
        .channel('rme-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rme_relatorios' }, loadPendingRMEsCount)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isStaff]);

  useEffect(() => {
    if (isStaff || isBackoffice) {
      loadPendingInsumosCount();
      const channel = supabase
        .channel('insumo-saidas-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insumo_saidas' }, loadPendingInsumosCount)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insumo_devolucoes' }, loadPendingInsumosCount)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isStaff, isBackoffice]);

  const loadPendingRMEsCount = async () => {
    const { count } = await supabase.from('rme_relatorios').select('*', { count: 'exact', head: true }).eq('status', 'pendente');
    setPendingRMEsCount(count || 0);
  };

  const loadPendingInsumosCount = async () => {
    const [{ count: c1 }, { count: c2 }] = await Promise.all([
      supabase.from('insumo_saidas').select('*', { count: 'exact', head: true }).eq('status', 'pendente_aprovacao'),
      supabase.from('insumo_devolucoes').select('*', { count: 'exact', head: true }).eq('status', 'pendente_aprovacao'),
    ]);
    setPendingInsumosCount((c1 || 0) + (c2 || 0));
  };

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (path: string) =>
    isActive(path)
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const badgeCountFor = (item: NavItem) => {
    if (item.badgeKey === 'rme') return pendingRMEsCount;
    if (item.badgeKey === 'insumos') return pendingInsumosCount;
    return undefined;
  };

  const renderItem = (item: NavItem) => {
    const badgeCount = badgeCountFor(item);
    return (
      <SidebarMenuItem key={item.key}>
        <SidebarMenuButton asChild>
          <NavLink to={item.url} className={getNavClass(item.url)}>
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
            {!collapsed && !!badgeCount && badgeCount > 0 && (
              <Badge variant="destructive" className="ml-auto">{badgeCount}</Badge>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="relative p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Zap className="h-6 w-6 text-white" />
              <div className="absolute inset-0 bg-amber-400/20 rounded-lg blur"></div>
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  SunFlow
                </h2>
                <p className="text-xs text-muted-foreground">Solar O&M</p>
              </div>
            )}
          </div>
        </div>

        {SIDEBAR_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((i) => hasAnyRole(userRoles, i.allow));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={section.id}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => renderItem(item))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile && !collapsed && (
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile.nome}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
