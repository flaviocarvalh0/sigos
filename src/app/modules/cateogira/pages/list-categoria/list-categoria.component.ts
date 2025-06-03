// src/app/features/categoria/pages/list-categoria/list-categoria.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoriaService } from '../../../../services/categoria.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { Categoria } from '../../../../Models/categoria.model';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list-categoria',
  templateUrl: './list-categoria.component.html',
  styleUrls: ['./list-categoria.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ListCategoriaComponent implements OnInit, OnDestroy {
  categorias: Categoria[] = [];
  categoriasFiltradas: Categoria[] = [];
  filtroId = '';
  filtroNome = '';
  isLoading = false;

  sortColumn: 'id' | 'nome' = 'nome';
  sortDirection: 'asc' | 'desc' = 'asc';

  private subscriptions = new Subscription();

  constructor(
    private categoriaService: CategoriaService,
    private router: Router,
    private toast: ToastService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarCategorias();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarCategorias(): void {
    this.isLoading = true;
    const sub = this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Erro ao carregar categorias.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  aplicarFiltros(): void {
    let resultado = [...this.categorias];

    if (this.filtroId.trim()) {
      const id = parseInt(this.filtroId.trim(), 10);
      resultado = isNaN(id)
        ? []
        : resultado.filter(c => c.id === id);
    } else if (this.filtroNome.trim()) {
      const nome = this.filtroNome.toLowerCase();
      resultado = resultado.filter(c => c.nome.toLowerCase().includes(nome));
    }

    resultado.sort((a, b) => {
      const valA = a[this.sortColumn];
      const valB = b[this.sortColumn];

      let comp = 0;
      if (valA == null) comp = -1;
      else if (valB == null) comp = 1;
      else if (typeof valA === 'string') comp = valA.localeCompare(String(valB));
      else if (typeof valA === 'number' && typeof valB === 'number') comp = valA > valB ? 1 : valA < valB ? -1 : 0;
      else comp = 0;

      return this.sortDirection === 'asc' ? comp : -comp;
    });

    this.categoriasFiltradas = resultado;
  }

  onSort(col: 'id' | 'nome'): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.aplicarFiltros();
  }

  limparFiltros(): void {
    this.filtroId = '';
    this.filtroNome = '';
    this.aplicarFiltros();
  }

  onIdChange(): void {
    this.aplicarFiltros();
  }

  editar(id: number): void {
    this.router.navigate(['/categoria/form', id]);
  }

  excluir(id: number, nome: string): void {
  const config: ConfirmationConfig = {
    title: 'Confirmar Exclusão',
    message: `Tem certeza que deseja excluir a categoria "${nome}"?`,
    acceptButtonText: 'Sim, Excluir',
    acceptButtonClass: 'btn-danger',
    cancelButtonText: 'Cancelar'
  };

  this.confirmation.confirm(config).subscribe(confirmed => {
    if (!confirmed) return;

    this.isLoading = true;

    this.categoriaService.remover(id).subscribe({
      next: () => {
        this.toast.success(`Categoria "${nome}" excluída com sucesso!`);
        this.carregarCategorias(); // Atualiza a lista
      },
      error: (err) => {
        if (err.message.includes('404') || err.message.toLowerCase().includes('não encontrada')) {
          this.toast.warning(`Categoria "${nome}" já foi excluída ou não existe.`);
        } else if (err.message.includes('constraint') || err.message.includes('relacionada')) {
          this.toast.error(`A categoria "${nome}" não pode ser excluída pois está relacionada a outros registros.`);
        } else {
          this.toast.error(err.message || `Erro ao remover categoria "${nome}".`);
        }
        this.isLoading = false;
      }
    });
  });
}


  novaCategoria(): void {
    this.router.navigate(['/categoria/form']);
  }
}
