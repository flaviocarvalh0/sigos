// src/app/pages/admin/workflow/workflow-estados/workflow-estados.component.ts

import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';

import { WorkflowEstado, WorkflowEstadoCriacaoPayload } from '../../../../../../Models/workflow/workflow-estado.model';
import { WorkflowEstadoService } from '../../../../../../services/workflow/workflow-estado.service';
import { ToastService } from '../../../../../../services/toast.service';
import { ConfirmationService } from '../../../../../../services/confirmation.service';

@Component({
  selector: 'app-workflow-estados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workflow-estado.component.html',
})
export class WorkflowEstadosComponent implements OnInit {
  @Input() workflowId!: number;

  estados: WorkflowEstado[] = [];
  form!: FormGroup;
  isLoading = false;

  private fb = inject(FormBuilder);
  private estadoService = inject(WorkflowEstadoService);
  private toast = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.buildForm();
    if (this.workflowId) {
      this.carregarEstados();
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      descricao: ['', [Validators.maxLength(500)]],
      isEstadoInicial: [false]
    });
  }

  carregarEstados(): void {
    this.isLoading = true;
    // CORREÇÃO: Chamamos o método correto que espera o ID do workflow.
    this.estadoService.obterEstadosPorWorkflow(this.workflowId).subscribe({
      next: (estadosDoWorkflow) => {
        // A API já retorna a lista filtrada, então podemos atribuir diretamente.
        this.estados = estadosDoWorkflow;
        console.log(estadosDoWorkflow);
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Erro ao carregar os estados do workflow.');
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

    const payload: WorkflowEstadoCriacaoPayload = {
      idWorkFlow: this.workflowId,
      nome: formValue.nome,
      descricao: formValue.descricao,
      isEstadoInicial: formValue.isEstadoInicial
    };

    this.estadoService.criarEstado(payload).subscribe({
      next: () => {
        this.toast.success('Novo estado criado com sucesso!');
        this.form.reset({ isEstadoInicial: false });
        this.carregarEstados();
      },
      error: (err) => {
        this.toast.error(`Erro ao criar estado: ${err.message}`);
        console.error(err);
      }
    });
  }

  onRemover(estado: WorkflowEstado): void {
    this.confirmationService.confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja remover o estado "${estado.nome}"? Isso pode afetar transições existentes.`
    })
    .pipe(take(1))
    .subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        this.estadoService.remover(estado.id!).subscribe({
          next: () => {
            this.toast.success(`Estado "${estado.nome}" removido com sucesso.`);
            this.estados = this.estados.filter(e => e.id !== estado.id);
            this.isLoading = false;
          },
          error: (err) => {
            this.toast.error(`Erro ao remover o estado. ${err.message}`);
            this.isLoading = false;
          }
        });
      }
    });
  }
}
