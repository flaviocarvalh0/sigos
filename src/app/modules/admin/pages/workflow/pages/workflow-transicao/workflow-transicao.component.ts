// src/app/pages/admin/workflow/workflow-transicoes/workflow-transicoes.component.ts

import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { forkJoin, take } from 'rxjs';



import { EstadoSelecao } from '../../../../../../Models/workflow/workflow-estado.model';
import { SelectItemDto } from '../../../../../../Models/prazo-garantia.model';
import { WorkflowtTransacaoService } from '../../../../../../services/workflow/workflow-transicao.service';
import { WorkflowEstadoService } from '../../../../../../services/workflow/workflow-estado.service';
import { WorkflowAcaoService } from '../../../../../../services/workflow/workflow-acao.service';
import { ToastService } from '../../../../../../services/toast.service';
import { ConfirmationService } from '../../../../../../services/confirmation.service';
import { WorkFlowTransicao, WorkFlowTransicaoCriacaoDto } from '../../../../../../Models/workflow/workflow-transicao.model';


@Component({
  selector: 'app-workflow-transicoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './workflow-transicao.component.html',
})
export class WorkflowTransicoesComponent implements OnInit {
  @Input() workflowId!: number;

  transicoes: WorkFlowTransicao[] = [];
  estados: EstadoSelecao[] = [];
  acoes: SelectItemDto[] = [];

  form!: FormGroup;
  isLoading = false;

  private fb = inject(FormBuilder);
  private transicaoService = inject(WorkflowtTransacaoService);
  private estadoService = inject(WorkflowEstadoService);
  private acaoService = inject(WorkflowAcaoService);
  private toast = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.buildForm();
    if (this.workflowId) {
      this.recarregarListas();
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      idEstadoOrigem: [null, Validators.required],
      idAcao: [null, Validators.required],
      idEstadoDestino: [null, Validators.required],
    });
  }

public recarregarListas(): void {
    this.isLoading = true;
    forkJoin({
      transicoes: this.transicaoService.obterTransicoesPorWorkflow(this.workflowId),
      estados: this.estadoService.obterParaSelecaoPorWorkflow(this.workflowId),
      acoes: this.acaoService.obterParaSelecaoPorWorkflow(this.workflowId)
    }).subscribe({
      next: ({ transicoes, estados, acoes }) => {
        this.transicoes = transicoes;
        this.estados = estados;
        this.acoes = acoes;
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Erro ao carregar dados para as transições.');
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.toast.error('Todos os campos são obrigatórios para criar uma transição.');
      return;
    }

    const payload: WorkFlowTransicaoCriacaoDto = {
      idWorkFlow: this.workflowId,
      ...this.form.value
    };

    this.transicaoService.criarTransicao(payload).subscribe({
      next: () => {
        this.toast.success('Nova transição criada com sucesso!');
        this.form.reset();
        this.recarregarListas(); // Recarrega a lista
      },
      error: (err) => {
        this.toast.error(`Erro ao criar transição: ${err.message}`);
      }
    });
  }

  onRemover(transicao: WorkFlowTransicao): void {
    this.confirmationService.confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja remover a transição: ${transicao.nomeEstadoOrigem} -> ${transicao.nomeAcao} -> ${transicao.nomeEstadoDestino}?`
    })
    .pipe(take(1))
    .subscribe(confirmado => {
      if (confirmado) {
        this.transicaoService.remover(transicao.id!).subscribe({
          next: () => {
            this.toast.success('Transição removida com sucesso.');
            this.transicoes = this.transicoes.filter(t => t.id !== transicao.id);
          },
          error: (err) => {
            this.toast.error(`Erro ao remover a transição. ${err.message}`);
          }
        });
      }
    });
  }
}
