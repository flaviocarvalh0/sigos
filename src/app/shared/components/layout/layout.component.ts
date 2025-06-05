// src/app/shared/components/layout/layout.component.ts (ou onde estiver)
import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { filter } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ToastsContainerComponent } from '../toats-container/toasts-container.component';
import { NavbarComponent, NavbarUser } from '../nav-bar/nav-bar.component';
import { SidebarComponent } from '../side-bar/side-bar.component';
import { SidebarAccordionGroup } from '../../../Models/sidebar.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmationDialogComponent,
    ToastsContainerComponent,
    NavbarComponent, // Adicione
    SidebarComponent, // Adicione
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'], // Os estilos gerais do layout permanecem aqui
})
export class LayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  mainSidebarMenuGroups: SidebarAccordionGroup[] = []; // Configuração do menu para este layout
  currentUserForLayout: NavbarUser | null = null;

  constructor(
    public authService: AuthService,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserForLayout = user ? {
        id: user.id,
        nome: user.nome,
        login: user.login,
        email: user.email
      } : null;
    });

    this.setupMainMenu(); // Configura o menu principal

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (isPlatformBrowser(this.platformId)) {
          if (window.innerWidth < 768) {
            this.isSidebarCollapsed = true;
          }
        }
      });

      if (isPlatformBrowser(this.platformId)) { // Executar apenas no navegador
      // Colapsar inicialmente se a tela for pequena
      if (window.innerWidth < 768) { // Ponto de quebra para colapsar (ex: Bootstrap 'md')
        this.isSidebarCollapsed = true;
      }

      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          if (window.innerWidth < 768) {
            this.isSidebarCollapsed = true;
          }
        });
      }
  }

  private setupMainMenu(): void {
    this.mainSidebarMenuGroups = [
      {
        id: 'menuPrincipal',
        headerText: 'Menu Principal',
        isInitiallyOpen: true,
        navLinks: [
          { label: 'Ordens de Serviço', routerLink: '/ordem-servico', iconClass: 'bi bi-clipboard-data' },
          { label: 'Clientes', routerLink: '/cliente', iconClass: 'bi bi-people-fill' },
        ],
      },
      {
        id: 'cadastrosGerais',
        headerText: 'Cadastros Gerais',
        navLinks: [
          { label: 'Empresa', routerLink: '/empresa', iconClass: 'bi bi-building' },
          { label: 'Fornecedores', routerLink: '/fornecedor', iconClass: 'bi bi-truck' },
          { label: 'Aparelhos', routerLink: '/aparelho', iconClass: 'bi bi-phone-fill' },
        ],
      },
      {
        id: 'catalogo',
        headerText: 'Catálogo',
        navLinks: [
          { label: 'Marcas', routerLink: '/marca', iconClass: 'bi bi-tag' },
          { label: 'Modelos', routerLink: '/modelo', iconClass: 'bi bi-badge-tm' },
          { label: 'Categorias', routerLink: '/categoria', iconClass: 'bi bi-tags' },
          { label: 'Serviços', routerLink: '/servico', iconClass: 'bi bi-tools' },
          { label: 'Peças', routerLink: '/peca', iconClass: 'bi bi-gear-fill' },
          { label: 'Prazo Garantias', routerLink: '/prazo_garantia', iconClass: 'bi bi-calendar-check' },
        ],
      },
      {
        id: 'estoque',
        headerText: 'Estoque',
        navLinks: [
          { label: 'Movimentações', routerLink: '/movimento-estoque', iconClass: 'bi bi-arrow-down-up' },
        ],
      },
    ];
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  handleUserProfileClick(userId: number | undefined): void {
    const currentAppUrl = this.router.url.split('?')[0];
    if (userId) {
      this.router.navigate(['/meu-perfil/editar/', userId], {
      queryParams: { returnUrl: currentAppUrl || '/ordem-servico' }
    });
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // get isAdmin(): boolean { // Mantido se necessário para outras lógicas no template do layout
  //   return this.authService.hasRole('admin');
  // }
}
