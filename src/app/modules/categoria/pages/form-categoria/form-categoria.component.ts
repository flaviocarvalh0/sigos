// src/app/features/categoria/pages/form-categoria/form-categoria.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of, Subscription, EMPTY } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import {
  Categoria,
  CategoriaCriacaoPayload,
  CategoriaAtualizacaoPayload,
} from '../../../../Models/categoria.model';
import { CategoriaService } from '../../../../services/categoria.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import {
  FormularioDinamicoComponent,
  FormularioDinamicoConfig,
} from '../../../../shared/components/formulario-dinamico/formulario-dinamico.component';

@Component({
  selector: 'app-form-categoria',
  template: `<app-form-dinamico
    [config]="config"
    [data]="dadosIniciais"
    [isLoading]="isLoading"
    [isEditando]="isEditando"
    (salvar)="onSubmit($event)"
    (cancelar)="onCancelar()"
    (excluir)="onExcluir()"
  >
  </app-form-dinamico> `,
  styleUrls: ['./form-categoria.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormularioDinamicoComponent],
})
export class FormCategoriaComponent implements OnInit, OnDestroy {
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  dadosIniciais: any = {};
  currentCategoriaId: number | null = null;
  isEditando = false;
  isLoading = false;
  private dataModificacaoOriginal?: Date;
  private subscriptions = new Subscription();

  config: FormularioDinamicoConfig = {
    titulo: this.cardTitle,
    iconeTitulo: 'bi bi-tag',
    classeTituloCard: 'bg-primary text-white',
    botoes: {
      salvarTexto: this.saveButtonText,
      cancelarTexto: 'Cancelar',
      excluirTexto: 'Excluir',
      cancelar: true,
      excluir: this.isEditando,
    },
    abas: [
      {
        titulo: '',
        campos: [
          {
            nome: 'nome',
            tipo: 'texto',
            rotulo: 'Nome da Categoria',
            placeholder: 'Digite o nome da categoria',
            obrigatorio: true,
            col: 'col-md-12',
            mensagensErro: {
              required: 'O nome é obrigatório.',
            },
          },
        ],
      },
    ],
  };

  ngOnInit(): void {
    this.isLoading = true;
    const routeSub = this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.currentCategoriaId = +idParam;
        this.isEditando = true;
        this.carregarCategoria(this.currentCategoriaId);
      } else {
        this.isEditando = false;
        this.isLoading = false;
      }
    });
    this.subscriptions.add(routeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarCategoria(id: number): void {
    this.isLoading = true;
    const sub = this.categoriaService.obterPorId(id).subscribe({
      next: (categoria: Categoria | undefined) => {
        if (categoria) {
          this.dataModificacaoOriginal = categoria.dataModificacao;
          this.dadosIniciais = {
            nome: categoria.nome,
          };
        } else {
          this.toastService.error('Categoria não encontrada.');
          this.router.navigate(['/categoria']);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao carregar categoria.');
        this.isLoading = false;
        this.router.navigate(['/categoria']);
      },
    });
    this.subscriptions.add(sub);

    this.config = {
      ...this.config,
      titulo: this.cardTitle,
      botoes: {
        ...this.config.botoes,
        salvarTexto: this.saveButtonText,
        excluir: this.isEditando,
      },
    };
  }

  onSubmit(dados: any): void {
    if (this.isEditando && this.currentCategoriaId) {
      this.isLoading = true;
      const sub = this.categoriaService
        .obterPorId(this.currentCategoriaId)
        .pipe(
          switchMap((catBanco) => {
            if (!catBanco) {
              this.toastService.error('Categoria não encontrada no servidor.');
              this.router.navigate(['/categoria']);
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
              id: this.currentCategoriaId!,
              nome: dados.nome,
              dataUltimaModificacao: this.dataModificacaoOriginal,
            };
            return this.categoriaService.atualizar(
              this.currentCategoriaId!,
              payload
            );
          }),
          tap(() => (this.isLoading = false)),
          catchError((err) => {
            this.isLoading = false;
            return of(err);
          })
        )
        .subscribe({
          next: (
            response:
              | Categoria
              | { error: string; categoriaDoBanco?: Categoria }
          ) => {
            if ((response as { error: string })?.error === 'concurrency') {
              const categoriaDoBanco = (response as any).categoriaDoBanco;
              this.toastService.warning(
                'Essa categoria foi alterada. O formulário foi atualizado.'
              );
              if (categoriaDoBanco) {
                this.dataModificacaoOriginal = categoriaDoBanco.dataModificacao;
                this.dadosIniciais = {
                  nome: categoriaDoBanco.nome,
                };
              }
              return;
            }
            this.toastService.success('Categoria atualizada com sucesso!');
            this.router.navigate(['/categoria']);
          },
          error: (err) => {
            if (err.error !== 'concurrency') {
              this.toastService.error(
                err.message || 'Erro ao atualizar categoria.'
              );
              console.error('Erro ao atualizar categoria:', err);
            }
          },
        });
      this.subscriptions.add(sub);
    } else {
      this.isLoading = true;
      const payload: CategoriaCriacaoPayload = { nome: dados.nome };
      const sub = this.categoriaService.criar(payload).subscribe({
        next: () => {
          this.toastService.success('Categoria criada com sucesso!');
          this.router.navigate(['/categoria']);
        },
        error: (err) => {
          this.toastService.error(err.message || 'Erro ao criar categoria.');
          this.isLoading = false;
        },
      });
      this.subscriptions.add(sub);
    }
  }

  onCancelar(): void {
    this.router.navigate(['/categoria']);
  }

  onExcluir(): void {
    if (!this.currentCategoriaId) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja excluir a categoria "${this.dadosIniciais.nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar',
    };

    const sub = this.confirmationService
      .confirm(config)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isLoading = true;
          const deleteSub = this.categoriaService
            .remover(this.currentCategoriaId!)
            .subscribe({
              next: () => {
                this.toastService.success('Categoria excluída com sucesso!');
                this.router.navigate(['/categoria']);
              },
              error: (err) => {
                this.toastService.error(
                  err.message || 'Erro ao excluir categoria.'
                );
                this.isLoading = false;
              },
            });
          this.subscriptions.add(deleteSub);
        }
      });
    this.subscriptions.add(sub);
  }

  get cardTitle(): string {
    return this.isEditando ? 'Editar Categoria' : 'Cadastrar Categoria';
  }

  get saveButtonText(): string {
    return this.isEditando ? 'Atualizar Categoria' : 'Salvar Categoria';
  }
}
