import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ModeloService } from '../../../../services/modelo.service';
import { MarcaService } from '../../../../services/marca.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { FormLayoutComponent } from '../../../../shared/components/form-layout/form-layout.component';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { Modelo, ModeloAtualizacaoPayload, ModeloCriacaoPayload } from '../../../../Models/modelo.model';
import { AuditoriaData } from '../../../../Models/AuditoriaData.model';

@Component({
  selector: 'app-form-modelo',
  standalone: true,
  templateUrl: './form-modelo.component.html',
  styleUrls: ['./form-modelo.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormLayoutComponent],
})
export class FormModeloComponent implements OnInit, OnDestroy {
  @Input() modeloIdParaEditar?: number;
  close!: (result?: any) => void;

  private fb = inject(FormBuilder);
  private modeloService = inject(ModeloService);
  private marcaService = inject(MarcaService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  form!: FormGroup;
  isEditando = false;
  isLoading = false;
  currentModeloId?: number;
  dataUltimaModificacao?: Date;
  marcas: { id: number; nome: string }[] = [];
  private subscriptions = new Subscription();

  auditoria: AuditoriaData | null = null;


  ngOnInit(): void {
  this.form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    idMarca: [null, Validators.required],

    criadoPor: [{ value: '', disabled: true }],
    dataCriacao: [{ value: '', disabled: true }],
    modificadoPor: [{ value: '', disabled: true }],
    dataModificacao: [{ value: '', disabled: true }]
  });

  this.carregarMarcas();

  if (this.modeloIdParaEditar !== undefined) {
    this.currentModeloId = this.modeloIdParaEditar;
    this.isEditando = true;
    this.carregarModelo(this.currentModeloId);
  }
}


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  inicializarForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      idMarca: [null, Validators.required],
      criadoPor: [{ value: '', disabled: true }],
      dataCriacao: [{ value: '', disabled: true }],
      modificadoPor: [{ value: '', disabled: true }],
      dataModificacao: [{ value: '', disabled: true }],
    });
  }

  carregarMarcas(): void {
    const sub = this.marcaService.obterParaSelecao().subscribe({
      next: (marcas) => {
        this.marcas = marcas.map(m => ({ id: m.id, nome: m.descricao }));
      },
      error: (err) => this.toastService.error(err.message || 'Erro ao carregar marcas.'),
    });
    this.subscriptions.add(sub);
  }

carregarModelo(id: number): void {
  this.isLoading = true;
  this.marcaService.obterParaSelecao().subscribe({
    next: (marcas) => {
      this.marcas = marcas.map(m => ({ id: m.id, nome: m.descricao }));

      this.modeloService.obterPorId(id).subscribe({
        next: (modelo) => {
          if (modelo) {
            this.form.patchValue({
              nome: modelo.nome,
              idMarca: modelo.idMarca,
              criadoPor: modelo.criadoPor,
              dataCriacao: modelo.dataCriacao,
              modificadoPor: modelo.modificadoPor,
              dataModificacao: modelo.dataModificacao
            });

            this.dataUltimaModificacao = modelo.dataModificacao;

            this.auditoria = {
              criadoPor: modelo.criadoPor ?? undefined,
              dataCriacao: modelo.dataCriacao,
              modificadoPor: modelo.modificadoPor ?? undefined,
              dataModificacao: modelo.dataModificacao
            };
          } else {
            this.toastService.error('Modelo não encontrado.');
            this.finalizarModal('cancelado');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.toastService.error(err.message || 'Erro ao carregar modelo.');
          this.isLoading = false;
          this.finalizarModal('cancelado');
        }
      });
    },
    error: (err) => {
      this.toastService.error(err.message || 'Erro ao carregar marcas.');
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

  if (this.isEditando && this.currentModeloId) {
    const payload: ModeloAtualizacaoPayload = {
      id: this.currentModeloId,
      nome: dados.nome,
      idMarca: dados.idMarca,
      dataUltimaModificacao: this.dataUltimaModificacao ?? new Date()
    };

    this.modeloService.atualizar(this.currentModeloId, payload).subscribe({
      next: () => {
        this.toastService.success('Modelo atualizado com sucesso!');
        this.finalizarModal('salvo');
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao atualizar modelo.');
        this.isLoading = false;
      }
    });
  } else {
    const payload: ModeloCriacaoPayload = {
      nome: dados.nome,
      idMarca: dados.idMarca
    };

    this.modeloService.criar(payload).subscribe({
      next: () => {
        this.toastService.success('Modelo criado com sucesso!');
        this.finalizarModal('salvo');
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao criar modelo.');
        this.isLoading = false;
      }
    });
  }
}


  onExcluir(): void {
    if (!this.currentModeloId) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja excluir o modelo "${this.form.get('nome')?.value}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar',
    };

    const sub = this.confirmationService.confirm(config).subscribe((confirmed) => {
      if (confirmed) {
        this.isLoading = true;
        const deleteSub = this.modeloService.remover(this.currentModeloId!).subscribe({
          next: () => {
            this.toastService.success('Modelo excluído com sucesso!');
            this.finalizarModal('excluido');
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir modelo.');
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
}
