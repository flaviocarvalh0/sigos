import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { PrazoGarantiaService } from '../../../services/prazo_garantia.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../Models/confirmation.model';
import { PrazoGarantia } from '../../../Models/prazo-garantia.model';
import { FormLayoutComponent } from '../../../shared/components/form-layout/form-layout.component';
import { AuditoriaData } from '../../../Models/AuditoriaData.model';

@Component({
  selector: 'app-form-prazo-garantia',
  standalone: true,
  templateUrl: './form-prazo-garantia.component.html',
  styleUrls: ['./form-prazo-garantia.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormLayoutComponent],
})
export class FormPrazoGarantiaComponent implements OnInit, OnDestroy {
  @Input() prazoIdParaEditar?: number;
  close!: (result?: any) => void;

  private fb = inject(FormBuilder);
  private service = inject(PrazoGarantiaService);
  private toast = inject(ToastService);
  private confirmation = inject(ConfirmationService);
  private router = inject(Router);

  form!: FormGroup;
  isEditando = false;
  isLoading = false;
  dataUltimaModificacao?: Date;
  auditoria: AuditoriaData | null = null;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.form = this.fb.group({
      prazoEmDias: [0, [Validators.required, Validators.min(1)]],
      descricao: ['', Validators.required],
      ativo: [true],
      criadoPor: [{ value: '', disabled: true }],
      dataCriacao: [{ value: '', disabled: true }],
      modificadoPor: [{ value: '', disabled: true }],
      dataModificacao: [{ value: '', disabled: true }],
    });

    this.form.get('prazoEmDias')?.valueChanges.subscribe(dias => {
      this.form.get('descricao')?.setValue(dias && dias > 0 ? `${dias} Dias` : '', { emitEvent: false });
    });

    if (this.prazoIdParaEditar !== undefined) {
      this.isEditando = true;
      this.carregarPrazo(this.prazoIdParaEditar);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarPrazo(id: number): void {
    this.isLoading = true;
    this.service.obterPorId(id).subscribe({
      next: (prazo) => {
        if (!prazo) {
          this.toast.error('Prazo de garantia não encontrado.');
          this.finalizarModal('cancelado');
          return;
        }
        this.dataUltimaModificacao = prazo.dataModificacao;

        this.form.patchValue({
          prazoEmDias: prazo.prazoEmDias,
          descricao: prazo.descricao,
          ativo: prazo.ativo,
          criadoPor: prazo.criadoPor,
          dataCriacao: prazo.dataCriacao,
          modificadoPor: prazo.modificadoPor,
          dataModificacao: prazo.dataModificacao
        });

        this.auditoria = {
          criadoPor: prazo.criadoPor ?? undefined,
          dataCriacao: prazo.dataCriacao,
          modificadoPor: prazo.modificadoPor ?? undefined,
          dataModificacao: prazo.dataModificacao,
        };

        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error(err.message || 'Erro ao carregar o prazo.');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dados = this.form.getRawValue();
    this.isLoading = true;

    if (this.isEditando && this.prazoIdParaEditar) {
      const payload = {
        id: this.prazoIdParaEditar,
        prazoEmDias: dados.prazoEmDias,
        descricao: dados.descricao,
        ativo: dados.ativo,
        dataUltimaModificacao: this.dataUltimaModificacao
      };

      this.service.atualizar(this.prazoIdParaEditar, payload).subscribe({
        next: () => {
          this.toast.success('Prazo de garantia atualizado com sucesso!');
          this.finalizarModal('salvo');
        },
        error: (err) => {
          this.toast.error(err.message || 'Erro ao atualizar prazo.');
          this.isLoading = false;
        }
      });

    } else {
      const payload = {
        prazoEmDias: dados.prazoEmDias,
        descricao: dados.descricao,
        ativo: dados.ativo
      };

      this.service.criar(payload).subscribe({
        next: () => {
          this.toast.success('Prazo de garantia cadastrado com sucesso!');
          this.finalizarModal('salvo');
        },
        error: (err) => {
          this.toast.error(err.message || 'Erro ao cadastrar prazo.');
          this.isLoading = false;
        }
      });
    }
  }

  onExcluir(): void {
    if (!this.prazoIdParaEditar) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja excluir o prazo "${this.form.get('descricao')?.value}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const sub = this.confirmation.confirm(config).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.service.remover(this.prazoIdParaEditar!).subscribe({
          next: () => {
            this.toast.success('Prazo de garantia excluído com sucesso!');
            this.finalizarModal('excluido');
          },
          error: (err) => {
            this.toast.error(err.message || 'Erro ao excluir prazo.');
            this.isLoading = false;
          }
        });
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
}
