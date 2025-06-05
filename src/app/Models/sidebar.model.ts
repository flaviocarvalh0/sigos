// src/app/shared/models/sidebar-menu.model.ts (crie este arquivo ou similar)
export interface SidebarNavLink {
  label: string;
  routerLink: string;
  iconClass: string;
  // requiredRole?: string | string[]; // Opcional: para controle de acesso por item
}

export interface SidebarAccordionGroup {
  id: string; // Usado para data-bs-target, aria-controls e id do elemento
  headerText: string;
  isInitiallyOpen?: boolean;
  navLinks: SidebarNavLink[];
  // requiredRole?: string | string[]; // Opcional: para controle de acesso por grupo
}