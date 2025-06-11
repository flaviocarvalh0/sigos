// list-workflow.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { ToastService } from '../../../../../../services/toast.service';
import { ListagemDinamicaComponent } from '../../../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { Workflow } from '../../../../../../Models/workflow/workflow.model';
import { WorkflowService } from '../../../../../../services/workflow/workflow.service';
import { ConfirmationService } from '../../../../../../services/confirmation.service';

@Component({
  selector: 'app-list-workflow',
  standalone: true,
  imports: [CommonModule, ListagemDinamicaComponent],
  template: `
    <app-listagem-dinamica
      titulo="Workflows Configurados"
      [dados]="workflows"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="navegarParaFormulario()"
      (editar)="onEditar($event)"
      (excluir)="onRemover($event)"
    ></app-listagem-dinamica>
  `
})
export class ListWorkflowComponent implements OnInit, OnDestroy {
  workflows: Workflow[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true, largura: '80px' },
    { campo: 'nome', titulo: 'Nome', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'descricao', titulo: 'Descrição', tipo: 'texto' as const, ordenavel: true, filtro: false },
  ];

  constructor(
    private workflowService: WorkflowService,
    private toast: ToastService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarWorkflows();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarWorkflows(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.workflowService.obterTodos().subscribe({
        next: (res) => {
          this.workflows = res || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.toast.error(`Erro ao buscar os workflows. ${err.message}`);
          console.error(err);
          this.isLoading = false;
        }
      })
    );
  }

  navegarParaFormulario(): void {
    this.router.navigate(['/admin/workflow/form']);
  }

  // CORREÇÃO: O método agora recebe 'id' (um número)
  onEditar(id: number): void {
    if (id == null) {
        console.error('Tentativa de editar com ID nulo:', id);
        this.toast.error('Não foi possível identificar o item para edição.');
        return;
    }
    this.router.navigate(['/admin/workflow/form', id]);
  }

  // CORREÇÃO: O método agora recebe 'id' (um número)
  onRemover(id: number): void {
    if (id == null) {
        this.toast.error('Não foi possível identificar o workflow para remoção.');
        return;
    }

    // Encontra o workflow na lista local para obter o nome para a mensagem
    const item = this.workflows.find(w => w.id === id);
    const nome = item?.nome || `Workflow ID ${id}`;

    this.subscriptions.add(
      this.confirmationService.confirm({
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja remover o workflow "${nome}"? Esta ação não pode ser desfeita.`
      })
      .pipe(take(1)) // Adicionado take(1) para evitar inscrições múltiplas
      .subscribe(confirmado => {
        if (confirmado) {
          this.isLoading = true;
          this.workflowService.remover(id).subscribe({
            next: () => {
              this.toast.success(`Workflow "${nome}" removido com sucesso.`);
              this.workflows = this.workflows.filter(w => w.id !== id);
              this.isLoading = false;
            },
            error: (err) => {
              this.toast.error(`Erro ao remover o workflow. ${err.message}`);
              console.error(err);
              this.isLoading = false;
            }
          });
        }
      })
    );
  }
}
