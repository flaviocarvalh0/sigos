// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, Input, Output, EventEmitter, OnInit, HostBinding  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarAccordionGroup } from '../../../Models/sidebar.model';
import { NavbarUser } from '../nav-bar/nav-bar.component';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
})
export class SidebarComponent implements OnInit {
  @HostBinding('style.display') display = 'flex'; 
  @HostBinding('style.height') height = '100%';
  @Input() isCollapsed: boolean = false;
  @Input() menuAccordionGroups: SidebarAccordionGroup[] = [];
  @Input() currentUser: NavbarUser | null = null; // Use uma interface de usuário apropriada
  @Input() isLoggedIn: boolean = false;

  @Output() userProfileClicked = new EventEmitter<number | undefined>();

  // Para garantir que o Collapse do Bootstrap funcione com IDs dinâmicos no Accordion
  // é importante que o data-bs-parent seja consistente.
  // Se houver apenas um acordeão na sidebar, o ID pode ser fixo.
  @Input() parentAccordionId: string = 'sidebarAccordionParent';


  constructor(public router: Router) {}

  ngOnInit(): void {
    // Se precisar inicializar algo com base nos inputs
  }

  onUserProfileClick(): void {
    if (this.currentUser && this.currentUser.id) {
      this.userProfileClicked.emit(this.currentUser.id);
      // Ou navegue diretamente se a lógica for sempre a mesma:
      // this.router.navigate(['admin/usuarios/editar', this.currentUser.id]);
    }
  }

  abreviarNome(nomeCompleto: string | undefined): string {
    if (!nomeCompleto) return '';
    const partes = nomeCompleto.trim().split(/\s+/);
    if (partes.length >= 2) return `${partes[0]} ${partes[1]}`;
    return partes[0];
  }

  // Helper para construir o ID do target para o collapse
  getTargetId(groupId: string): string {
    return `#${groupId}`;
  }
}