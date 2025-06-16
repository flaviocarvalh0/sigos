import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription, EMPTY, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Marca, MarcaAtualizacaoPayload, MarcaCriacaoPayload } from '../../../../Models/marca.model';
import { MarcaService } from '../../../../services/marca.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { FormLayoutComponent } from '../../../../shared/components/form-layout/form-layout.component';
import { isInvalid } from '../../../../helpers/form-validation.helper';

@Component({
  selector: 'app-form-marca',
  standalone: true,
  template: `
    <app-form-layout
      [form]="form"
      [titulo]="titulo"
      [auditoriaData]="auditoria"
      [isLoading]="isLoading"
      [isEditMode]="isEditando"
      (save)="onSubmit()"
      (cancel)="onCancelar()"
      (delete)="onExcluir()"
    >
      <div [formGroup]="form">
        <div class="mb-3">
          <label for="nome" class="form-label">
            Nome da Marca
            <span *ngIf="isInvalid('nome')" class="text-danger">*</span>
          </label>
          <input
            type="text"
            id="nome"
            formControlName="nome"
            class="form-control"
            [ngClass]="{ 'is-invalid': isInvalid('nome') }"
          />
          <div *ngIf="isInvalid('nome')" class="invalid-feedback">
            O nome da marca é obrigatório.
          </div>
        </div>
      </div>
    </app-form-layout>
  `,
  styleUrls: ['./form-marca.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormLayoutComponent],
})
export class FormMarcaComponent implements OnInit, OnDestroy {
  @Input() marcaIdParaEditar?: number;
  close!: (result?: any) => void;

  private fb = inject(FormBuilder);
  private marcaService = inject(MarcaService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  form!: FormGroup;
  isLoading = false;
  isEditando = false;
  auditoria: any = null;
  private currentMarcaId?: number;
  private dataUltimaModificacao?: Date;
  private subscriptions = new Subscription();

  get titulo(): string {
    return this.isEditando ? 'Editar Marca' : 'Cadastrar Marca';
  }

  ngOnInit(): void {
    this.inicializarForm();

    if (this.marcaIdParaEditar !== undefined) {
      this.currentMarcaId = this.marcaIdParaEditar;
      this.isEditando = true;
      this.carregarMarca(this.currentMarcaId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  inicializarForm(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
    });
  }

  carregarMarca(id: number): void {
    this.isLoading = true;
    const sub = this.marcaService.obterPorId(id).subscribe({
      next: (marca) => {
        if (marca) {
          this.form.patchValue({ nome: marca.nome });
          this.dataUltimaModificacao = marca.dataModificacao ? new Date(marca.dataModificacao) : undefined;
          this.auditoria = {
            criadoPor: marca.criadoPor,
            dataCriacao: marca.dataCriacao,
            modificadoPor: marca.modificadoPor,
            dataModificacao: marca.dataModificacao,
          };
        } else {
          this.toastService.error('Marca não encontrada.');
          this.finalizarModal('cancelado');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao carregar marca.');
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

    if (this.isEditando && this.currentMarcaId) {
      this.isLoading = true;

      const sub = this.marcaService.obterPorId(this.currentMarcaId).pipe(
        switchMap((marcaBanco) => {
          if (!marcaBanco) {
            this.toastService.error('Marca não encontrada no servidor.');
            this.finalizarModal('cancelado');
            return EMPTY;
          }

          const bancoMod = marcaBanco.dataModificacao
            ? new Date(marcaBanco.dataModificacao).getTime()
            : null;
          const localMod = this.dataUltimaModificacao
            ? new Date(this.dataUltimaModificacao).getTime()
            : null;

          if (bancoMod !== localMod) {
            return of({ error: 'concurrency', marcaDoBanco: marcaBanco });
          }

          const payload: MarcaAtualizacaoPayload = {
            id: this.currentMarcaId!,
            nome: dados.nome,
            dataUltimaModificacao: this.dataUltimaModificacao ?? null,
          };

          return this.marcaService.atualizar(this.currentMarcaId!, payload);
        }),
        tap(() => (this.isLoading = false)),
        catchError((err) => {
          this.isLoading = false;
          return of(err);
        })
      ).subscribe({
        next: (response: any) => {
          if (response?.error === 'concurrency') {
            const marcaBanco = response.marcaDoBanco;
            this.toastService.warning('Essa marca foi alterada. O formulário foi atualizado.');
            if (marcaBanco) {
              this.dataUltimaModificacao = marcaBanco.dataModificacao;
              this.form.patchValue({ nome: marcaBanco.nome });
              this.auditoria = {
                criadoPor: marcaBanco.criadoPor,
                dataCriacao: marcaBanco.dataCriacao,
                modificadoPor: marcaBanco.modificadoPor,
                dataModificacao: marcaBanco.dataModificacao,
              };
            }
            return;
          }
          this.toastService.success('Marca atualizada com sucesso!');
          this.finalizarModal('salvo');
        },
        error: (err) => {
          this.toastService.error(err.message || 'Erro ao atualizar marca.');
        },
      });

      this.subscriptions.add(sub);
    } else {
      this.isLoading = true;
      const payload: MarcaCriacaoPayload = { nome: dados.nome };
      const sub = this.marcaService.criar(payload).subscribe({
        next: () => {
          this.toastService.success('Marca criada com sucesso!');
          this.finalizarModal('salvo');
        },
        error: (err) => {
          this.toastService.error(err.message || 'Erro ao criar marca.');
          this.isLoading = false;
        },
      });
      this.subscriptions.add(sub);
    }
  }

  onExcluir(): void {
    if (!this.currentMarcaId) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja excluir a marca "${this.form.get('nome')?.value}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar',
    };

    const sub = this.confirmationService.confirm(config).subscribe((confirmed) => {
      if (confirmed) {
        this.isLoading = true;
        const deleteSub = this.marcaService.remover(this.currentMarcaId!).subscribe({
          next: () => {
            this.toastService.success('Marca excluída com sucesso!');
            this.finalizarModal('excluido');
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir marca.');
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
