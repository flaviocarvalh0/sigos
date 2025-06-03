// src/app/features/modelo/pages/list-modelo/list-modelo.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ModeloService } from '../../../../services/modelo.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { Modelo } from '../../../../Models/modelo.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-modelo',
  templateUrl: './list-modelo.component.html',
  styleUrls: ['./list-modelo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule,]
})
export class ListModeloComponent implements OnInit, OnDestroy {
  modelos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];
  isLoading = false;

  filtroNome: string = '';
  filtroId: string = '';

  sortColumn: keyof Modelo | 'id' | 'nome' = 'nome';
  sortDirection: 'asc' | 'desc' = 'asc';
  carregando: boolean = false;

  private subscriptions = new Subscription();

  constructor(
    private modeloService: ModeloService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarListaModelos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
onIdFilterChange(): void {
  // Se o campo ID for limpo e outros filtros estiverem ativos, eles devem ser reaplicados.
  // Se o ID for preenchido, aplicarFiltros já dará prioridade a ele.
  this.aplicarFiltros();
}


  carregarListaModelos(): void {
  this.carregando = true;
  const sub = this.modeloService.obterTodos().subscribe({
    next: (dados) => {
      this.modelos = dados;
      this.aplicarFiltros();
      this.carregando = false;
    },
    error: (err) => {
      this.toastService.error(err.message || 'Erro ao carregar modelos.');
      this.carregando = false;
    }
  });
  this.subscriptions.add(sub);
}


  aplicarFiltros(): void {
    let resultadoFiltrado = [...this.modelos];

    if (this.filtroId.trim()) {
      const idNumerico = parseInt(this.filtroId.trim(), 10);
      if (!isNaN(idNumerico)) {
        const encontrado = this.modelos.find(m => m.id === idNumerico);
        resultadoFiltrado = encontrado ? [encontrado] : [];
      } else {
        resultadoFiltrado = [];
      }
    } else if (this.filtroNome.trim()) {
      const filtro = this.filtroNome.toLowerCase().trim();
      resultadoFiltrado = resultadoFiltrado.filter(m =>
        m.nome.toLowerCase().includes(filtro)
      );
    }

    if (this.sortColumn) {
      resultadoFiltrado.sort((a, b) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];

        let comparison = 0;
        if (valA === null || valA === undefined) comparison = -1;
        else if (valB === null || valB === undefined) comparison = 1;
        else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else {
          comparison = valA > valB ? 1 : valA < valB ? -1 : 0;
        }
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    this.modelosFiltrados = resultadoFiltrado;
  }

  limparFiltros(): void {
    this.filtroId = '';
    this.filtroNome = '';
    this.aplicarFiltros();
  }

  onSort(column: keyof Modelo | 'id' | 'nome'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.aplicarFiltros();
  }

  editarModelo(id: number | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID do modelo inválido para edição.');
      return;
    }
    this.router.navigate(['/modelo/form', id]);
  }

  novoModelo(): void {
    this.router.navigate(['/modelo/form']);
  }

  excluirModelo(id: number | undefined, nomeModelo: string | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID do modelo inválido para exclusão.');
      return;
    }

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Modelo',
      message: `Tem certeza que deseja excluir o modelo \"${nomeModelo || 'ID ' + id}\"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Cancelar'
    };

    const sub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        this.modeloService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Modelo \"${nomeModelo || 'ID ' + id}\" excluído com sucesso!`);
            this.carregarListaModelos();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir modelo.');
            this.isLoading = false;
          }
        });
      }
    });
    this.subscriptions.add(sub);
  }
}
