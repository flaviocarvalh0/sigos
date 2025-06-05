// src/app/shared/components/navbar/navbar.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // RouterModule já deve estar lá, Router para navegação programática
import { AuthService } from '../../../services/auth/auth.service';

export interface NavbarUser {
  nome?: string;
  login?: string;
  email?: string;
  id?: number;
}

export interface ActionButtonConfig {
  text?: string;
  iconClass?: string;
  route?: string; // Rota Angular para navegação
  action?: () => void; // Função a ser chamada no clique (alternativa à rota)
  title?: string;
  buttonClass?: string; // ex: 'btn-outline-light', 'btn-primary'
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
})
export class NavbarComponent {
  @Input() brandName: string = 'SIGOS';
  @Input() brandSubtitle: string = 'Sistema de OS';
  @Input() logoText: string = 'OS';
  @Input() currentUser: NavbarUser | null = null;
  @Input() isLoggedIn: boolean = false;
  @Input() showAdminSettingsButton: boolean = true;
  @Input() adminSettingsLink: string = '/admin/usuarios';

  // Novo Input para o botão de ação customizado
  @Input() actionButton: ActionButtonConfig | null = null;

  @Output() toggleSidebarClicked = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();
  // adminSettingsClickedEvent não é mais necessário se a navegação for direta

  constructor(public router: Router, public authService: AuthService) {} // Router injetado

  onToggleSidebar(): void {
    this.toggleSidebarClicked.emit();
  }

  onLogout(): void {
    this.authService.logout(); // Ação direta
    this.logoutClicked.emit(); // Emitir se o pai precisar de mais lógica
  }

  onAdminSettingsClick(): void {
    if (this.adminSettingsLink) {
      this.router.navigate([this.adminSettingsLink]);
    }
  }

  handleActionButtonClick(): void {
    if (this.actionButton) {
      if (this.actionButton.action) {
        this.actionButton.action();
      } else if (this.actionButton.route) {
        this.router.navigate([this.actionButton.route]);
      }
    }
  }

  abreviarNome(nomeCompleto: string | undefined): string {
    if (!nomeCompleto) return '';
    const partes = nomeCompleto.trim().split(/\s+/);
    if (partes.length >= 2) return `${partes[0]} ${partes[1]}`;
    return partes[0];
  }
}