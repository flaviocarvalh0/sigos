import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PecaService } from '../../../../services/peca.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Peca } from '../../../../Models/peca.model';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';

@Component({
  selector: 'app-list-peca',
  templateUrl: './list-pecas.component.html',
  styleUrls: ['./list-pecas.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ListPecaComponent implements OnInit, OnDestroy {
  pecas: Peca[] = [];
  pecasFiltradas: Peca[] = [];
  isLoading = false;

  filtroNome: string = '';
  filtroId: string = '';

  sortColumn: keyof Peca | 'id' | 'nome' = 'nome';
  sortDirection: 'asc' | 'desc' = 'asc';
  carregando: boolean = false;

  private subscriptions = new Subscription();

  constructor(
    private pecaService: PecaService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarListaPecas();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onIdFilterChange(): void {
    this.aplicarFiltros();
  }

  carregarListaPecas(): void {
    this.carregando = true;
    const sub = this.pecaService.obterTodos().subscribe({
      next: (dados) => {
        this.pecas = dados;
        this.aplicarFiltros();
        this.carregando = false;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao carregar peças.');
        this.carregando = false;
      }
    });
    this.subscriptions.add(sub);
  }

  aplicarFiltros(): void {
    let resultadoFiltrado = [...this.pecas];

    if (this.filtroId.trim()) {
      const idNumerico = parseInt(this.filtroId.trim(), 10);
      if (!isNaN(idNumerico)) {
        const encontrado = this.pecas.find(p => p.id === idNumerico);
        resultadoFiltrado = encontrado ? [encontrado] : [];
      } else {
        resultadoFiltrado = [];
      }
    } else if (this.filtroNome.trim()) {
      const filtro = this.filtroNome.toLowerCase().trim();
      resultadoFiltrado = resultadoFiltrado.filter(p =>
        p.nome.toLowerCase().includes(filtro)
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

    this.pecasFiltradas = resultadoFiltrado;
  }

  limparFiltros(): void {
    this.filtroId = '';
    this.filtroNome = '';
    this.aplicarFiltros();
  }

  onSort(column: keyof Peca | 'id' | 'nome'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.aplicarFiltros();
  }

  editarPeca(id: number | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID da peça inválido para edição.');
      return;
    }
    this.router.navigate(['/peca/form', id]);
  }

  novaPeca(): void {
    this.router.navigate(['/peca/form']);
  }

  excluirPeca(id: number | undefined, nome: string | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID da peça inválido para exclusão.');
      return;
    }

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Peça',
      message: `Tem certeza que deseja excluir a peça "${nome || 'ID ' + id}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Cancelar'
    };

    const sub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        this.pecaService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Peça "${nome || 'ID ' + id}" excluída com sucesso!`);
            this.carregarListaPecas();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir peça.');
            this.isLoading = false;
          }
        });
      }
    });
    this.subscriptions.add(sub);
  }
}
