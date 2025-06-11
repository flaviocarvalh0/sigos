// src/app/pages/admin/workflow/workflow-acoes/workflow-acoes.component.ts

import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { WorkFlowAcao, WorkFlowAcaoCriacaoPayload } from '../../../../../../Models/workflow/workflow-acao.model';
import { WorkflowAcaoService } from '../../../../../../services/workflow/workflow-acao.service';
import { ToastService } from '../../../../../../services/toast.service';
import { ConfirmationService } from '../../../../../../services/confirmation.service';



@Component({
  selector: 'app-workflow-acoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workflow-acoes.component.html',
})
export class WorkflowAcoesComponent implements OnInit {
  @Input() workflowId!: number;
  @Output() dataChanged = new EventEmitter<void>();

  acoes: WorkFlowAcao[] = [];
  form!: FormGroup;
  isLoading = false;

  private fb = inject(FormBuilder);
  private acaoService = inject(WorkflowAcaoService);
  private toast = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.buildForm();
    if (this.workflowId) {
      this.carregarAcoes();
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      descricao: ['', [Validators.maxLength(500)]],
    });
  }

  carregarAcoes(): void {
    this.isLoading = true;
    this.acaoService.obterAcoesPorWorkflow(this.workflowId).subscribe({
      next: (acoesDoWorkflow) => {
        this.acoes = acoesDoWorkflow;
        console.log(acoesDoWorkflow);
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Erro ao carregar as ações do workflow.');
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.toast.error('Formulário inválido. O nome é obrigatório.');
      return;
    }

    const formValue = this.form.value;

    const payload: WorkFlowAcaoCriacaoPayload = {
      idWorkFlow: this.workflowId,
      nome: formValue.nome,
      descricao: formValue.descricao,
    };

    this.acaoService.criarAcao(payload).subscribe({
      next: () => {
        this.toast.success('Nova ação criada com sucesso!');
        this.form.reset();
        this.carregarAcoes();
        this.dataChanged.emit();
      },
      error: (err) => {
        this.toast.error(`Erro ao criar ação: ${err.message}`);
      }
    });
  }

  onRemover(acao: WorkFlowAcao): void {
    this.confirmationService.confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja remover a ação "${acao.nome}"? Isso pode afetar transições existentes.`
    })
    .pipe(take(1))
    .subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        this.acaoService.remover(acao.id!).subscribe({
          next: () => {
            this.toast.success(`Ação "${acao.nome}" removida com sucesso.`);
            this.acoes = this.acoes.filter(a => a.id !== acao.id);
            this.dataChanged.emit();
            this.isLoading = false;
          },
          error: (err) => {
            this.toast.error(`Erro ao remover a ação. ${err.message}`);
            this.isLoading = false;
          }
        });
      }
    });
  }
}
