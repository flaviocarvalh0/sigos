import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, EMPTY, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

import { Categoria, CategoriaCriacaoPayload, CategoriaAtualizacaoPayload } from '../../../../Models/categoria.model';
import { CategoriaService } from '../../../../services/categoria.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { FormLayoutComponent } from '../../../../shared/components/form-layout/form-layout.component';
import { isInvalid } from '../../../../helpers/form-validation.helper';
import { AuditoriaData } from '../../../../Models/AuditoriaData.model';

@Component({
  selector: 'app-form-categoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormLayoutComponent],
  templateUrl: './form-categoria.component.html',
  styleUrls: ['./form-categoria.component.css'],
})
export class FormCategoriaComponent implements OnInit, OnDestroy {
  @Input() categoriaIdParaEditar?: number;
  close!: (result?: any) => void;

  private categoriaService = inject(CategoriaService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  isEditando = false;
  isLoading = false;
  private dataModificacaoOriginal?: Date;
  private subscriptions = new Subscription();

  auditoria: AuditoriaData | null = null; // ✅ Novo campo

  ngOnInit(): void {
    this.inicializarForm();

    if (this.categoriaIdParaEditar !== undefined) {
      this.isEditando = true;
      this.carregarCategoria(this.categoriaIdParaEditar);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  inicializarForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

carregarCategoria(id: number): void {
  this.isLoading = true;
  const sub = this.categoriaService.obterPorId(id).subscribe({
    next: (categoria) => {
      if (categoria) {
        this.dataModificacaoOriginal = categoria.dataModificacao;
        this.form.patchValue({ nome: categoria.nome });

        this.auditoria = {
          criadoPor: categoria.criadoPor ?? undefined,
          dataCriacao: categoria.dataCriacao,
          modificadoPor: categoria.modificadoPor ?? undefined,
          dataModificacao: categoria.dataModificacao,
        };
      } else {
        this.toastService.error('Categoria não encontrada.');
        this.finalizarModal('cancelado');
      }
      this.isLoading = false;
    },
    error: (err) => {
      this.toastService.error(err.message || 'Erro ao carregar categoria.');
      this.isLoading = false;
      this.finalizarModal('cancelado');
    },
  });
  this.subscriptions.add(sub);
}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dados = this.form.value;

    if (this.isEditando && this.categoriaIdParaEditar) {
      this.isLoading = true;
      const sub = this.categoriaService.obterPorId(this.categoriaIdParaEditar).pipe(
        switchMap((catBanco) => {
          if (!catBanco) {
            this.toastService.error('Categoria não encontrada no servidor.');
            this.finalizarModal('cancelado');
            return EMPTY;
          }

          const modBanco = catBanco.dataModificacao
            ? new Date(catBanco.dataModificacao).getTime()
            : null;
          const modLocal = this.dataModificacaoOriginal
            ? new Date(this.dataModificacaoOriginal).getTime()
            : null;

          if (modBanco !== modLocal) {
            return of({ error: 'concurrency', categoriaDoBanco: catBanco });
          }

          const payload: CategoriaAtualizacaoPayload = {
            id: this.categoriaIdParaEditar!,
            nome: dados.nome,
            dataUltimaModificacao: this.dataModificacaoOriginal,
          };

          return this.categoriaService.atualizar(this.categoriaIdParaEditar!, payload);
        }),
        tap(() => (this.isLoading = false)),
        catchError((err) => {
          this.isLoading = false;
          return of(err);
        })
      ).subscribe({
        next: (response: any) => {
          if (response?.error === 'concurrency') {
            const categoriaDoBanco = response.categoriaDoBanco;
            this.toastService.warning('A categoria foi alterada no servidor. Formulário atualizado.');
            if (categoriaDoBanco) {
              this.dataModificacaoOriginal = categoriaDoBanco.dataModificacao;
              this.form.patchValue({ nome: categoriaDoBanco.nome });
            }
            return;
          }
          this.toastService.success('Categoria atualizada com sucesso!');
          this.finalizarModal('salvo');
        },
        error: (err) => {
          this.toastService.error(err.message || 'Erro ao atualizar categoria.');
        },
      });

      this.subscriptions.add(sub);
    } else {
      this.isLoading = true;
      const payload: CategoriaCriacaoPayload = { nome: dados.nome };
      const sub = this.categoriaService.criar(payload).subscribe({
        next: () => {
          this.toastService.success('Categoria criada com sucesso!');
          this.finalizarModal('salvo');
        },
        error: (err) => {
          this.toastService.error(err.message || 'Erro ao criar categoria.');
          this.isLoading = false;
        },
      });
      this.subscriptions.add(sub);
    }
  }

  onExcluir(): void {
    if (!this.categoriaIdParaEditar) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja excluir a categoria "${this.form.get('nome')?.value}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar',
    };

    const sub = this.confirmationService.confirm(config).subscribe((confirmed) => {
      if (confirmed) {
        this.isLoading = true;
        const deleteSub = this.categoriaService.remover(this.categoriaIdParaEditar!).subscribe({
          next: () => {
            this.toastService.success('Categoria excluída com sucesso!');
            this.finalizarModal('excluido');
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir categoria.');
            this.isLoading = false;
          },
        });
        this.subscriptions.add(deleteSub);
      }
    });

    this.subscriptions.add(sub);
  }

  onCancelar(): void {
    this.finalizarModal('cancelado');
  }

  private finalizarModal(result?: any): void {
    if (this.close) {
      this.close(result);
    }
  }

  isInvalid(controlName: string): boolean {
    return isInvalid(this.form, controlName);
  }
}
