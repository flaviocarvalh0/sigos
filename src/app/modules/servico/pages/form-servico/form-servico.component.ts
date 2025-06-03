// src/app/features/servico/pages/form-servico/form-servico.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core'; // Adicionado OnDestroy
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Adicionado RouterModule
import { CommonModule } from '@angular/common';
// NgSelectModule não é usado neste formulário, pode ser removido se não houver planos para ele aqui.
// import { NgSelectModule } from '@ng-select/ng-select';
import { Subscription, of, EMPTY } from 'rxjs'; // Adicionado Subscription, of, EMPTY
import { switchMap, tap, catchError } from 'rxjs/operators'; // Adicionado tap, catchError
// Corrigido para servico.service
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model'; // Ajuste o path
import { ServicoService } from '../../../../services/servico.service';
import { Servico, ServicoAtualizacaoPayload, ServicoCriacaoPayload } from '../../../../Models/servico.mode';

@Component({
  selector: 'app-form-servico', // Seletor corrigido de 'app-form-modelo'
  templateUrl: './form-servico.component.html',
  styleUrls: ['./form-servico.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule // Adicionado para routerLink (se houver no template de botões)
    // NgSelectModule // Removido se não for usado
  ],
})
export class FormServicoComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private servicoService = inject(ServicoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  isEditando = false;
  formServico!: FormGroup; // Renomeado de 'form'
  currentServicoId: number | null = null; // Renomeado de 'servicoId'
  isLoading = false;
  private dataModificacaoOriginal: string | Date | null = null;
  private subscriptions = new Subscription();

  constructor() {
    this.initForm(); // Inicializa a estrutura do formulário
  }

  ngOnInit(): void {
    this.isLoading = true;
    const routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.currentServicoId = +id;
        this.isEditando = true;
        this.carregarServico(this.currentServicoId);
      } else {
        this.isEditando = false;
        this.initForm(); // Garante que o form está limpo para um novo serviço
        this.formServico.patchValue({ ativo: true }); // Default para novo serviço
        this.isLoading = false;
      }
    });
    this.subscriptions.add(routeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  initForm(servico?: Servico): void {
    this.formServico = this.fb.group({
      nome: [servico?.nome || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      descricao: [servico?.descricao || '', [Validators.maxLength(500)]],
      // Ajustado para precoPadrao e tempoEstimadoMinutos
      precoPadrao: [servico?.precoPadrao || null, [Validators.required, Validators.min(0.01)]],
      tempoEstimadoMinutos: [servico?.tempoEstimadoMinutos || null, [Validators.required, Validators.min(1)]],
      ativo: [servico ? servico.ativo : true, Validators.required] // Campo 'ativo' adicionado
    });
  }

  carregarServico(id: number): void {
    this.isLoading = true;
    const servicoSub = this.servicoService.obterPorId(id).subscribe({
      next: (servico: Servico | undefined) => {
        if (servico) {
          this.dataModificacaoOriginal = servico.dataModificacao || null;
          // this.initForm(servico); // Recriar o form pode perder subscriptions de valueChanges se houver
          this.formServico.patchValue({
            nome: servico.nome,
            descricao: servico.descricao,
            precoPadrao: servico.precoPadrao,
            tempoEstimadoMinutos: servico.tempoEstimadoMinutos,
            ativo: servico.ativo
          });
        } else {
          this.toastService.error('Serviço não encontrado.');
          this.router.navigate(['/servico']); // Navega para a lista se não encontrado
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar serviço:', err);
        this.toastService.error(err.message || 'Erro ao carregar dados do serviço');
        this.isLoading = false;
        this.router.navigate(['/servico']);
      }
    });
    this.subscriptions.add(servicoSub);
  }

  onSubmit(): void {
    if (this.formServico.invalid) {
      this.formServico.markAllAsTouched();
      this.toastService.warning('Formulário inválido. Verifique os campos destacados.');
      return;
    }

    const formValue = this.formServico.value;

    if (this.isEditando && this.currentServicoId) {
      this.isLoading = true;
      const checkAndUpdateSub = this.servicoService.obterPorId(this.currentServicoId).pipe(
        switchMap(servicoAtualDoBanco => {
          if (!servicoAtualDoBanco) {
            this.toastService.error('Serviço não encontrado no servidor. Pode ter sido excluído.');
            this.router.navigate(['/servico']);
            return EMPTY;
          }
          const dataModificacaoAtualBanco = servicoAtualDoBanco.dataModificacao || null;
          const originalTimestamp = this.dataModificacaoOriginal ? new Date(this.dataModificacaoOriginal).getTime() : null;
          const atualBancoTimestamp = dataModificacaoAtualBanco ? new Date(dataModificacaoAtualBanco).getTime() : null;

          if (originalTimestamp && atualBancoTimestamp && originalTimestamp !== atualBancoTimestamp) {
            return of({ error: 'concurrency', servicoDoBanco: servicoAtualDoBanco });
          }

          const payload: ServicoAtualizacaoPayload = {
            id: this.currentServicoId!,
            nome: formValue.nome,
            descricao: formValue.descricao || null,
            precoPadrao: formValue.precoPadrao,
            tempoEstimadoMinutos: formValue.tempoEstimadoMinutos,
            ativo: formValue.ativo,
            dataUltimaModificacao: this.dataModificacaoOriginal
          };
          return this.servicoService.atualizar(this.currentServicoId!, payload);
        }),
        tap(() => this.isLoading = false),
        catchError(err => { this.isLoading = false; return of(err); })
      ).subscribe({
        next: (response: Servico | { error: string, servicoDoBanco?: Servico }) => {
          if ((response as { error: string })?.error === 'concurrency') {
            const servicoDoBanco = (response as { error: string, servicoDoBanco: Servico }).servicoDoBanco;
            this.toastService.warning('Este serviço foi alterado. Seus dados não foram salvos. O formulário foi atualizado.');
            if (servicoDoBanco) {
              this.dataModificacaoOriginal = servicoDoBanco.dataModificacao || null;
              this.formServico.patchValue(servicoDoBanco);
            }
            return;
          }
          const servicoAtualizado = response as Servico;
          if (servicoAtualizado && servicoAtualizado.id) {
            this.toastService.success('Serviço atualizado com sucesso!');
            this.dataModificacaoOriginal = servicoAtualizado.dataModificacao || null; // Atualiza para próxima edição
            this.router.navigate(['/servico']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          if (err.error !== 'concurrency') {
            this.toastService.error(err.message || 'Erro ao atualizar serviço.');
            console.error('Erro ao atualizar serviço:', err);
          }
        }
      });
      this.subscriptions.add(checkAndUpdateSub);
    } else { // Criando novo serviço
      this.isLoading = true;
      const payload: ServicoCriacaoPayload = {
        nome: formValue.nome,
        descricao: formValue.descricao || null,
        precoPadrao: formValue.precoPadrao,
        tempoEstimadoMinutos: formValue.tempoEstimadoMinutos,
        ativo: formValue.ativo
      };
      const createSub = this.servicoService.criar(payload).subscribe({
        next: (servicoCriado) => {
          this.isLoading = false;
          this.toastService.success('Serviço criado com sucesso!');
          this.router.navigate(['/servico']);
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Erro ao criar serviço.');
          console.error('Erro ao criar serviço:', err);
        }
      });
      this.subscriptions.add(createSub);
    }
  }

  onCancelar(): void {
    this.router.navigate(['/servico']); // Navega para a lista de serviços
  }

  onExcluir(): void {
    if (!this.currentServicoId) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o serviço "${this.formServico.get('nome')?.value || 'ID: ' + this.currentServicoId}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        const deleteSub = this.servicoService.remover(this.currentServicoId!).subscribe({
          next: () => {
            this.isLoading = false;
            this.toastService.success('Serviço excluído com sucesso!');
            this.router.navigate(['/servico']);
          },
          error: (err) => {
            this.isLoading = false;
            this.toastService.error(err.message || 'Erro ao excluir serviço.');
            console.error('Erro ao excluir serviço:', err);
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }

  // Getters para o template
  public isInvalidControl(controlName: string): boolean {
    const control = this.formServico.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  public getControlErrors(controlName: string): any {
    const control = this.formServico.get(controlName);
    return control ? control.errors : null;
  }

  get cardTitle(): string {
    return this.isEditando ? 'Editar Serviço' : 'Cadastrar Novo Serviço';
  }

  get saveButtonText(): string {
    return this.isEditando ? 'Atualizar Serviço' : 'Salvar Serviço';
  }
  // Método showToast local removido, usar ToastService injetado
}