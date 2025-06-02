// src/app/layout/layout/layout.component.ts
import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router'; // RouterModule para routerLink
import { AuthService } from '../../../services/auth/auth.service'; // Importe seu AuthService
import { filter } from 'rxjs/operators';
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";
import { ToastsContainerComponent } from "../toats-container/toasts-container.component";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmationDialogComponent, ToastsContainerComponent], // Adicione RouterModule aqui
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  currentRoute: string = '';

  constructor(
    public authService: AuthService, // Tornar público para acesso no template, ou usar getters
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Opcional: Lógica para fechar sidebar em telas pequenas ao navegar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (isPlatformBrowser(this.platformId)) {
        if (window.innerWidth < 768) { // Exemplo de breakpoint para fechar sidebar
          this.isSidebarCollapsed = true;
        }
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // Método helper para verificar se o usuário é admin (exemplo)
  get isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }

  // Você pode criar outros getters para outros papéis se necessário
  // Ex: get isTecnico(): boolean { return this.authService.hasRole('tecnico'); }
}
