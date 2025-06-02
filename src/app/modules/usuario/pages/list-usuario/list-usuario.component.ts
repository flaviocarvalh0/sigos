import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { UsuarioService } from '../../../../services/usuario.service';
import { Usuario } from '../../../../Models/usuario.model'; // Remover Grupo se não for usado
import { ToastService } from '../../../../services/toast.service'; // Importar ToastService
import { ConfirmationService } from '../../../../services/confirmation.service'; // Importar ConfirmationService
import { ConfirmationConfig } from '../../../../Models/confirmation.model'; // Importar ConfirmationConfig

@Component({
  selector: 'app-lista-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule], // RouterModule para routerLink
  templateUrl: './list-usuario.component.html',
  // styleUrls: ['./lista-usuarios.component.css'] // Se tiver estilos
})
export class ListUsuarioComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  isLoading = false;
  error: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.isLoading = true;
    this.error = null;
    const sub = this.usuarioService.obterTodos().subscribe({ // Usa obterTodos do CrudService
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
        this.error = err.message || 'Falha ao carregar usuários.';
        this.toastService.error(this.error!);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  navegarParaNovoUsuario(): void {
    this.router.navigate(['/admin/usuarios/novo']);
  }

  editarUsuario(id: number | undefined): void {
    if (id !== undefined) {
      this.router.navigate(['/admin/usuarios/editar', id]);
    }
  }

  excluirUsuario(id: number | undefined, nomeUsuario: string): void {
    if (id === undefined) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o usuário "${nomeUsuario}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Cancelar'
    };

    this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        const sub = this.usuarioService.remover(id).subscribe({ // Usa remover do CrudService
          next: () => {
            this.toastService.success('Usuário excluído com sucesso!');
            this.carregarUsuarios(); // Recarrega a lista
            // isLoading será false em carregarUsuarios
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
  }

  // formatarGrupos removido se não houver campo de grupos na tabela

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
