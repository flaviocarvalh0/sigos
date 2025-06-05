import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ActionButtonConfig, NavbarComponent, NavbarUser } from '../../../../shared/components/nav-bar/nav-bar.component';
import { SidebarComponent } from '../../../../shared/components/side-bar/side-bar.component';
import { ToastsContainerComponent } from '../../../../shared/components/toats-container/toasts-container.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SidebarAccordionGroup } from '../../../../Models/sidebar.model';
import { AuthService } from '../../../../services/auth/auth.service';



@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    ToastsContainerComponent,
    ConfirmationDialogComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  adminSidebarMenuGroups: SidebarAccordionGroup[] = [];
  currentUserForLayout: NavbarUser | null = null;
  navbarActionButton: ActionButtonConfig;

  constructor(
    public authService: AuthService,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.navbarActionButton = {
      iconClass: 'bi bi-house-door-fill', // Ícone de Home
      route: '/ordem-servico', // Rota para a página principal da aplicação
      title: 'Voltar para Home',
      buttonClass: 'btn-outline-light' // Estilo do botão
    };
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserForLayout = user ? {
        id: user.id,
        nome: user.nome,
        login: user.login,
        email: user.email
      } : null;
    });

    this.setupAdminMenu();

    if (isPlatformBrowser(this.platformId)) {
      if (window.innerWidth < 768) {
        this.isSidebarCollapsed = true;
      }
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          if (window.innerWidth < 768) {
            this.isSidebarCollapsed = true;
          }
        });
    }
  }

  private setupAdminMenu(): void {
    this.adminSidebarMenuGroups = [
      {
        id: 'adminManagement',
        headerText: 'Administração',
        isInitiallyOpen: true,
        navLinks: [
          { label: 'Usuários', routerLink: '/admin/usuarios', iconClass: 'bi bi-people-fill' },
          { label: 'Grupos', routerLink: '/admin/grupos', iconClass: 'bi bi-collection-fill' }
        ]
      },
      // Opcional: Link para voltar à aplicação principal, caso não queira na navbar
      // {
      //   id: 'appNavigation',
      //   headerText: 'Navegação',
      //   isInitiallyOpen: false,
      //   navLinks: [
      //     { label: 'Voltar ao App', routerLink: '/ordem-servico', iconClass: 'bi bi-arrow-left-circle' }
      //   ]
      // }
    ];
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  handleUserProfileClick(userId: number | undefined): void {
    if (userId) {
      this.router.navigate(['/admin/usuarios/editar', userId]); // Mantém a mesma lógica
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
