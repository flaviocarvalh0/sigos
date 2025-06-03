import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, of, EMPTY } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

import { Categoria, CategoriaCriacaoPayload, CategoriaAtualizacaoPayload } from '../../../../Models/categoria.model';
import { CategoriaService } from '../../../../services/categoria.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';

@Component({
  selector: 'app-form-categoria',
  templateUrl: './form-categoria.component.html',
  styleUrls: ['./form-categoria.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class FormCategoriaComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  formCategoria!: FormGroup;
  currentCategoriaId: number | null = null;
  isEditando = false;
  isLoading = false;
  private dataModificacaoOriginal?: Date;
  private subscriptions = new Subscription();

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.isLoading = true;
    const routeSub = this.route.paramMap.subscribe(params => {
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

  initForm(categoria?: Categoria): void {
    this.formCategoria = this.fb.group({
      nome: [categoria?.nome || '', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]]
    });
  }

  carregarCategoria(id: number): void {
    this.isLoading = true;
    const catSub = this.categoriaService.obterPorId(id).subscribe({
      next: (categoria: Categoria | undefined) => {
        if (categoria) {
          this.dataModificacaoOriginal = categoria.dataModificacao;
          this.formCategoria.patchValue({
            nome: categoria.nome
          });
        } else {
          this.toastService.error('Categoria não encontrada.');
          this.router.navigate(['/categoria']);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar categoria:', err);
        this.toastService.error(err.message || 'Erro ao carregar dados da categoria.');
        this.isLoading = false;
        this.router.navigate(['/categoria']);
      }
    });
    this.subscriptions.add(catSub);
  }

  onSubmit(): void {
    if (this.formCategoria.invalid) {
      this.formCategoria.markAllAsTouched();
      this.toastService.warning('Formulário inválido. Verifique o campo Nome.');
      return;
    }

    const formValue = this.formCategoria.value;

    if (this.isEditando && this.currentCategoriaId) {
      this.isLoading = true;
      const updateSub = this.categoriaService.obterPorId(this.currentCategoriaId).pipe(
        switchMap(catBanco => {
          if (!catBanco) {
            this.toastService.error('Categoria não encontrada no servidor.');
            this.router.navigate(['/categoria']);
            return EMPTY;
          }

          const modBanco = catBanco.dataModificacao ? new Date(catBanco.dataModificacao).getTime() : null;
          const modLocal = this.dataModificacaoOriginal ? new Date(this.dataModificacaoOriginal).getTime() : null;

          if (modBanco !== modLocal) {
            return of({ error: 'concurrency', categoriaDoBanco: catBanco });
          }

          const payload: CategoriaAtualizacaoPayload = {
            id: this.currentCategoriaId!,
            nome: formValue.nome,
            dataUltimaModificacao: this.dataModificacaoOriginal
          };
          return this.categoriaService.atualizar(this.currentCategoriaId!, payload);
        }),
        tap(() => this.isLoading = false),
        catchError(err => { this.isLoading = false; return of(err); })
      ).subscribe({
        next: (response: Categoria | { error: string, categoriaDoBanco?: Categoria }) => {
          if ((response as { error: string })?.error === 'concurrency') {
            const categoriaDoBanco = (response as { error: string, categoriaDoBanco: Categoria }).categoriaDoBanco;
            this.toastService.warning('Essa categoria foi alterada. O formulário foi atualizado.');
            if (categoriaDoBanco) {
              this.dataModificacaoOriginal = categoriaDoBanco.dataModificacao;
              this.formCategoria.patchValue(categoriaDoBanco);
            }
            return;
          }
          this.toastService.success('Categoria atualizada com sucesso!');
          this.router.navigate(['/categoria']);
        },
        error: (err) => {
          this.isLoading = false;
          if (err.error !== 'concurrency') {
            this.toastService.error(err.message || 'Erro ao atualizar categoria.');
            console.error('Erro ao atualizar categoria:', err);
          }
        }
      });
      this.subscriptions.add(updateSub);
    } else {
      this.isLoading = true;
      const payload: CategoriaCriacaoPayload = { nome: formValue.nome };
      const createSub = this.categoriaService.criar(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.success('Categoria criada com sucesso!');
          this.router.navigate(['/categoria']);
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Erro ao criar categoria.');
          console.error('Erro ao criar categoria:', err);
        }
      });
      this.subscriptions.add(createSub);
    }
  }

  onCancelar(): void {
    this.router.navigate(['/categoria']);
  }

  onExcluir(): void {
    if (!this.currentCategoriaId) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja excluir a categoria "${this.formCategoria.get('nome')?.value}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        const deleteSub = this.categoriaService.remover(this.currentCategoriaId!).subscribe({
          next: () => {
            this.isLoading = false;
            this.toastService.success('Categoria excluída com sucesso!');
            this.router.navigate(['/categoria']);
          },
          error: (err) => {
            this.isLoading = false;
            this.toastService.error(err.message || 'Erro ao excluir categoria.');
            console.error('Erro ao excluir categoria:', err);
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }

  isInvalidControl(controlName: string): boolean {
    const control = this.formCategoria.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getControlErrors(controlName: string): any {
    const control = this.formCategoria.get(controlName);
    return control ? control.errors : null;
  }

  get cardTitle(): string {
    return this.isEditando ? 'Editar Categoria' : 'Cadastrar Nova Categoria';
  }

  get saveButtonText(): string {
    return this.isEditando ? 'Atualizar Categoria' : 'Salvar Categoria';
  }
}
