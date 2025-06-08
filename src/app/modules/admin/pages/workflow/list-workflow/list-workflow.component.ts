import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../../../../../services/toast.service';
import { ListagemDinamicaComponent } from '../../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { Workflow } from '../../../../../Models/workflow/workflow.model';
import { WorkflowService } from '../../../../../services/workflow/workflow.service';


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
    private router: Router
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
          this.toast.error(`Erro ao buscar os workflows. ${err}`);
          console.error(err);
          this.isLoading = false;
        }
      })
    );
  }

  navegarParaFormulario(): void {
    this.router.navigate(['/admin/workflow/form']);
  }

    onEditar(item: any): void {
    const id = typeof item === 'number' ? item : item?.id;
    if (id == null) {
        console.error('Tentativa de editar com ID nulo:', item);
        this.toast.error('Não foi possível identificar o grupo para edição.');
        return;
    }
    this.router.navigate(['/admin/workflow/form', id]);
  }

   onRemover(item: any): void { // Pode ser 'item: Grupo'
    const id = typeof item === 'number' ? item : item?.id;
    const nome = item?.nome || `Workflow ID ${id}`;

    if (id == null) {
        console.error('Tentativa de remover com ID nulo:', item);
        this.toast.error('Não foi possível identificar o workflow para remoção.');
        return;
    }
  }
}
