import { Component, inject, OnInit, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, of, EMPTY } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ServicoService } from '../../../../services/servico.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { Servico, ServicoAtualizacaoPayload, ServicoCriacaoPayload } from '../../../../Models/servico.mode';
import { FormLayoutComponent } from '../../../../shared/components/form-layout/form-layout.component';
import { AuditoriaData } from '../../../../Models/AuditoriaData.model';

@Component({
  selector: 'app-form-servico',
  templateUrl: './form-servico.component.html',
  styleUrls: ['./form-servico.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormLayoutComponent],
})
export class FormServicoComponent implements OnInit, OnDestroy {
  @Input() servicoIdParaEditar?: number;
  close!: (result?: any) => void;

  private fb = inject(FormBuilder);
  private servicoService = inject(ServicoService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  form!: FormGroup;
  isEditando = false;
  isLoading = false;
  dataUltimaModificacao?: Date | null;
  auditoria: AuditoriaData | null = null;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.inicializarFormulario();

    if (this.servicoIdParaEditar !== undefined) {
      this.isEditando = true;
      this.carregarServico(this.servicoIdParaEditar);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      descricao: ['', [Validators.maxLength(500)]],
      precoPadrao: [null, [Validators.required, Validators.min(0.01)]],
      tempoEstimadoMinutos: [null, [Validators.required, Validators.min(1)]],
      ativo: [true, Validators.required],
      criadoPor: [{ value: '', disabled: true }],
      dataCriacao: [{ value: '', disabled: true }],
      modificadoPor: [{ value: '', disabled: true }],
      dataModificacao: [{ value: '', disabled: true }]
    });
  }

  carregarServico(id: number): void {
    this.isLoading = true;
    const sub = this.servicoService.obterPorId(id).subscribe({
      next: (servico) => {
        if (servico) {
          this.dataUltimaModificacao = servico.dataModificacao;

          this.form.patchValue({
            nome: servico.nome,
            descricao: servico.descricao,
            precoPadrao: servico.precoPadrao,
            tempoEstimadoMinutos: servico.tempoEstimadoMinutos,
            ativo: servico.ativo,
            criadoPor: servico.criadoPor,
            dataCriacao: servico.dataCriacao,
            modificadoPor: servico.modificadoPor,
            dataModificacao: servico.dataModificacao
          });

          this.auditoria = {
            criadoPor: servico.criadoPor ?? undefined,
            dataCriacao: servico.dataCriacao,
            modificadoPor: servico.modificadoPor ?? undefined,
            dataModificacao: servico.dataModificacao
          };
        } else {
          this.toastService.error('Serviço não encontrado.');
          this.finalizarModal('cancelado');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao carregar serviço.');
        this.isLoading = false;
        this.finalizarModal('cancelado');
      }
    });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dados = this.form.getRawValue();

    if (this.isEditando && this.servicoIdParaEditar) {
      const sub = this.servicoService.obterPorId(this.servicoIdParaEditar).pipe(
        switchMap((servicoBanco) => {
          if (!servicoBanco) {
            this.toastService.error('Serviço não encontrado no servidor.');
            this.finalizarModal('cancelado');
            return EMPTY;
          }

          const bancoMod = servicoBanco.dataModificacao
            ? new Date(servicoBanco.dataModificacao).getTime()
            : null;
          const localMod = this.dataUltimaModificacao
            ? new Date(this.dataUltimaModificacao).getTime()
            : null;

          if (bancoMod !== localMod) {
            return of({ error: 'concurrency', servicoDoBanco: servicoBanco });
          }

          const payload: ServicoAtualizacaoPayload = {
            id: this.servicoIdParaEditar!,
            nome: dados.nome,
            descricao: dados.descricao,
            precoPadrao: dados.precoPadrao,
            tempoEstimadoMinutos: dados.tempoEstimadoMinutos,
            ativo: dados.ativo,
            dataUltimaModificacao: this.dataUltimaModificacao
          };

          this.isLoading = true;
          return this.servicoService.atualizar(this.servicoIdParaEditar!, payload);
        }),
        catchError((err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Erro ao atualizar serviço.');
          return EMPTY;
        })
      ).subscribe({
        next: (response: Servico | { error: string, servicoDoBanco?: Servico }) => {
          this.isLoading = false;

          if ((response as any)?.error === 'concurrency') {
            const servicoBanco = (response as any).servicoDoBanco;
            this.toastService.warning('Este serviço foi alterado por outro usuário. O formulário foi recarregado.');
            if (servicoBanco) {
              this.dataUltimaModificacao = servicoBanco.dataModificacao ?? null;
              this.form.patchValue({
                nome: servicoBanco.nome,
                descricao: servicoBanco.descricao,
                precoPadrao: servicoBanco.precoPadrao,
                tempoEstimadoMinutos: servicoBanco.tempoEstimadoMinutos,
                ativo: servicoBanco.ativo,
                criadoPor: servicoBanco.criadoPor,
                dataCriacao: servicoBanco.dataCriacao,
                modificadoPor: servicoBanco.modificadoPor,
                dataModificacao: servicoBanco.dataModificacao
              });
            }
            return;
          }

          this.toastService.success('Serviço atualizado com sucesso!');
          this.finalizarModal('salvo');
        }
      });

      this.subscriptions.add(sub);
    } else {
      const payload: ServicoCriacaoPayload = {
        nome: dados.nome,
        descricao: dados.descricao,
        precoPadrao: dados.precoPadrao,
        tempoEstimadoMinutos: dados.tempoEstimadoMinutos,
        ativo: dados.ativo
      };

      this.isLoading = true;
      const sub = this.servicoService.criar(payload).subscribe({
        next: () => {
          this.toastService.success('Serviço criado com sucesso!');
          this.finalizarModal('salvo');
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Erro ao criar serviço.');
        }
      });

      this.subscriptions.add(sub);
    }
  }

  onCancelar(): void {
    this.finalizarModal('cancelado');
  }

  onExcluir(): void {
    if (!this.servicoIdParaEditar) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja excluir o serviço "${this.form.get('nome')?.value}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const sub = this.confirmationService.confirm(config).subscribe((confirmed) => {
      if (confirmed) {
        this.isLoading = true;
        const deleteSub = this.servicoService.remover(this.servicoIdParaEditar!).subscribe({
          next: () => {
            this.toastService.success('Serviço excluído com sucesso!');
            this.finalizarModal('excluido');
          },
          error: (err) => {
            this.isLoading = false;
            this.toastService.error(err.message || 'Erro ao excluir serviço.');
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });

    this.subscriptions.add(sub);
  }

  private finalizarModal(result?: any): void {
    if (this.close) {
      this.close(result);
    }
  }

  public isInvalidControl(controlName: string): boolean {
    const control = this.form.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

   get cardTitle(): string {
    return this.isEditando ? 'Editar Serviço' : 'Cadastrar Novo Serviço';
  }
}
