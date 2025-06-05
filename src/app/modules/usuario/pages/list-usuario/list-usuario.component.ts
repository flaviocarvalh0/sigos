// src/app/features/admin/pages/list-usuario/list-usuario.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { UsuarioService } from '../../../../services/usuario.service';
import { Usuario } from '../../../../Models/usuario.model';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';

@Component({
  selector: 'app-lista-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule, ListagemDinamicaComponent],
  template: `
    <app-listagem-dinamica
      titulo="Lista de Usuários"
      [dados]="usuarios"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="navegarParaNovoUsuario()"
      (editar)="editarUsuario($event)"
      (excluir)="excluirUsuario($event)">
    </app-listagem-dinamica>
  `
})
export class ListUsuarioComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', ordenavel: true, filtro: true, tipo: 'texto' as const },
    { campo: 'nome', titulo: 'Nome', ordenavel: true, filtro: true, tipo: 'texto' as const },
    { campo: 'email', titulo: 'Email', ordenavel: true, filtro: true, tipo: 'texto' as const },
    { campo: 'perfil', titulo: 'Perfil', filtro: true, tipo: 'texto' as const },
    { campo: 'dataCriacao', titulo: 'Criado em', ordenavel: true, tipo: 'data' as const },
    { campo: 'dataModificacao', titulo: 'Modificado em', ordenavel: true, tipo: 'dataHora' as const }
  ];

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarUsuarios(): void {
    this.isLoading = true;
    const sub = this.usuarioService.obterTodos().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
        this.toastService.error(err.message || 'Falha ao carregar usuários.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  navegarParaNovoUsuario(): void {
    this.router.navigate(['/admin/usuarios/novo']);
  }

  editarUsuario(id: number): void {
    this.router.navigate(['/admin/usuarios/editar', id]);
  }

  excluirUsuario(id: number): void {
    if (!id) {
      this.toastService.warning('ID do usuário inválido para exclusão.');
      return;
    }
    const usuario = this.usuarios.find(u => u.id === id);
    const nome = usuario?.nome || `Usuário ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Cancelar'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        const sub = this.usuarioService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Usuário "${nome}" excluído com sucesso!`);
            this.carregarUsuarios();
          },
          error: (err) => {
            console.error('Erro ao excluir usuário:', err);
            this.toastService.error(err.message || 'Erro ao excluir usuário.');
            this.isLoading = false;
          }
        });
        this.subscriptions.add(sub);
      }
    });

    this.subscriptions.add(confirmSub);
  }

  navigateToForm(id?: number): void {
    const basePath = '/admin/usuarios'; // Rota base para admin
    const returnUrl = basePath; // Sempre volta para a lista de usuários admin

    if (id) { // Editar usuário existente
      this.router.navigate([`${basePath}/editar`, id], { queryParams: { returnUrl } });
    } else { // Criar novo usuário
      this.router.navigate([`${basePath}/novo`], { queryParams: { returnUrl } });
    }
  }
}
