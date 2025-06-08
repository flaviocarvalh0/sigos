import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { GrupoService } from '../../../../../services/grupo.service';
import { ToastService } from '../../../../../services/toast.service';
import { GrupoAtualizacaoPayload, GrupoCriacaoPayload } from '../../../../../Models/grupo.model';
import { ConfirmationService } from '../../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../../Models/confirmation.model';
import { GrupoUsuario } from '../../../../../Models/grupo_usuario.model';
import { GrupoUsuarioService } from '../../../../../services/grupo_usuario.service';
import { UsuarioService } from '../../../../../services/usuario.service';
import { Usuario } from '../../../../../Models/usuario.model';
import { FilterPipe } from '../../../../../shared/helpers/filter.pipe';

@Component({
  selector: 'app-form-grupo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FilterPipe],
  templateUrl: './form-grupo.component.html',
})
export class FormGrupoComponent implements OnInit {
  form!: FormGroup;
  grupoId: number | null = null;
  isLoading = false;

  grupoService = inject(GrupoService);
  toast = inject(ToastService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  confirmationService = inject(ConfirmationService);
  grupoUsuarioService = inject(GrupoUsuarioService);
  usuarioService = inject(UsuarioService);
  fb = inject(FormBuilder);
  filtroUsuario = '';

  usuariosVinculados: GrupoUsuario[] = [];
  usuariosSelecionados: number[] = [];
  usuariosDisponiveis: { id: number; descricao: string }[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.grupoId = id ? +id : null;
      this.buildForm();

      if (this.grupoId) {
        this.isLoading = true;
        this.grupoService.obterPorId(this.grupoId).subscribe(grupo => {
          this.isLoading = false;
          if (grupo) {
            this.form.patchValue({
              nome: grupo.nome,
              ativo: grupo.ativo,
              dataUltimaModificacao: grupo.dataModificacao,
            });
          }
        });

        this.carregarUsuariosDoGrupo();
      }
    });
  }

  buildForm(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      ativo: [true, Validators.required],
      dataUltimaModificacao: [''],
    });
  }

onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const payload = this.form.value;

  const acaoSalvar = this.grupoId
    ? this.grupoService.atualizar(this.grupoId, {
        id: this.grupoId,
        nome: payload.nome,
        ativo: payload.ativo,
        dataUltimaModificacao: payload.dataUltimaModificacao,
      })
    : this.grupoService.criar({
        nome: payload.nome,
        ativo: payload.ativo,
      });

  acaoSalvar.subscribe({
    next: (res: any) => {
      const grupoId = this.grupoId || res.id;

      // Se for criação (sem this.grupoId ainda) e tem usuários selecionados
      if (!this.grupoId && this.usuariosSelecionados.length > 0) {
        const vinculos = this.usuariosSelecionados.map(idUsuario => ({
          idGrupo: grupoId,
          idUsuario,
        }));

        this.grupoUsuarioService.criarMultiplos(vinculos).subscribe({
          next: () => {
            this.toast.success('Grupo e usuários vinculados com sucesso!');
            this.router.navigate(['/admin/grupos']);
          },
          error: () => {
            this.toast.error('Grupo criado, mas falha ao vincular usuários.');
            this.router.navigate(['/admin/grupos']);
          }
        });
      } else {
        this.toast.success('Grupo salvo com sucesso!');
        this.router.navigate(['/admin/grupos']);
      }
    },
    error: (err) => {
      this.toast.error(err.message || 'Erro ao salvar grupo.');
    }
  });
}


  carregarUsuariosDoGrupo(): void {
    if (!this.grupoId) return;

    this.grupoUsuarioService.obterTodos().subscribe(res => {
      if (res.sucesso && res.dados) {
        this.usuariosVinculados = res.dados.filter(x => x.idGrupo === this.grupoId);
      }
    });
  }

  abrirModalSelecaoUsuarios(): void {
    this.usuarioService.obterParaSelecao().subscribe({
      next: (res) => {
        this.usuariosDisponiveis = res
          .filter(u => !this.usuariosVinculados.some(v => v.idUsuario === u.id))
          .map(u => ({
            id: u.id,
            descricao: u.descricao || u.descricao || '', // ajuste conforme o campo correto em Usuario
          }));
        const modal: any = document.getElementById('modalUsuarios');
        if (modal) {
          const bootstrapModal = new (window as any).bootstrap.Modal(modal);
          bootstrapModal.show();''
        }
      },
      error: (err) => this.toast.error('Erro ao carregar usuários disponíveis.')
    });
  }

  confirmarUsuariosSelecionados(): void {
    if (!this.grupoId) {
      this.usuariosSelecionados.forEach(idUsuario => {
        const usuario = this.usuariosDisponiveis.find(u => u.id === idUsuario);
        if (usuario) {
          this.usuariosVinculados.push({
            idUsuario,
            idGrupo: 0,
            nomeUsuario: usuario.descricao
          });
        }
      });
    } else {
      const novos = this.usuariosSelecionados.filter(
        id => !this.usuariosVinculados.some(v => v.idUsuario === id)
      );
      const vinculos = novos.map(idUsuario => ({
        idGrupo: this.grupoId!,
        idUsuario
      }));
      if (vinculos.length) {
        this.grupoUsuarioService.criarMultiplos(vinculos).subscribe(() => {
          this.toast.success('Usuários vinculados com sucesso!');
          this.carregarUsuariosDoGrupo();
        });
      }
    }

   const modalEl = document.getElementById('modalUsuarios');
  if (modalEl) {
    const instance = (window as any).bootstrap.Modal.getInstance(modalEl);
    if (instance) {
      instance.hide();
    }
  }

  }

  removerUsuario(idUsuario: number): void {
    if (!this.grupoId) return;

    this.grupoUsuarioService.removerVinculos([{ idGrupo: this.grupoId, idUsuario }]).subscribe(() => {
      this.toast.success('Usuário removido do grupo.');
      this.carregarUsuariosDoGrupo();
    });
  }

  onCancelar(): void {
    this.router.navigate(['/admin/grupos']);
  }

  onExcluir(): void {
    if (!this.grupoId) {
      this.toast.error('Grupo inválido para exclusão.');
      return;
    }

    const nome = this.form.get('nome')?.value || `Grupo ID ${this.grupoId}`;

    const configConfirm: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o grupo "${nome}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    this.confirmationService.confirm(configConfirm).subscribe((confirmado) => {
      if (confirmado) {
        this.isLoading = true;
        this.grupoService.remover(this.grupoId!).subscribe({
          next: () => {
            this.toast.success(`Grupo "${nome}" excluído com sucesso!`);
            this.router.navigate(['/admin/grupos']);
          },
          error: (err) => {
            const msgErro = err.error?.mensagem || err.message || 'Erro ao excluir grupo.';
            if (msgErro.includes('constraint') || msgErro.includes('relacionad')) {
              this.toast.error(`O grupo "${nome}" não pode ser excluído pois está relacionado a outros registros.`);
            } else {
              this.toast.error(msgErro);
            }
            console.error(err);
            this.isLoading = false;
          }
        });
      }
    });
  }

  onSelecionarUsuario(event: Event, idUsuario: number): void {
  const input = event.target as HTMLInputElement;

  if (input.checked) {
    if (!this.usuariosSelecionados.includes(idUsuario)) {
      this.usuariosSelecionados.push(idUsuario);
    }
  } else {
    this.usuariosSelecionados = this.usuariosSelecionados.filter(id => id !== idUsuario);
  }
}

}
