import { PecaService } from './../../../services/peca.service';
import { Component } from '@angular/core';
import { Estoque } from '../../../Models/estoque.model';
import { EstoqueService } from '../../../services/estoque.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Peca } from '../../../Models/peca.model';
import { Router } from '@angular/router';

declare const bootstrap: any;

@Component({
  selector: 'app-list-estoque',
  standalone: true,
  templateUrl: './list-estoque.component.html',
  styleUrl: './list-estoque.component.css',
  imports: [[NgIf, NgFor], FormsModule],
})
export class ListEstoqueComponent {
  estoqueItems: Estoque[] = [];
  peca: Peca[] = [];
  carregando = true;
  constructor(
    private estoqueService: EstoqueService,
    private pecaService: PecaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarEstoque();
    this.carregarPecas();
  }

  carregarEstoque(): void {
    this.estoqueService.listar().subscribe({
      next: (items) => {
        this.estoqueItems = items;
      },
      error: (error) => {
        console.error('Erro ao carregar estoque:', error);
        this.showToast('Erro ao carregar estoque');
      },
    });
  }

  carregarPecas(): void {
    this.pecaService.listar().subscribe({
      next: (items) => {
        this.peca = items;
      },
      error: (error) => {
        console.error('Erro ao carregar estoque:', error);
        this.showToast('Erro ao carregar estoque');
      },
    });
  }
  getNomePeca(idPeca: number): string {
    const peca = this.peca.find((p) => p.id === idPeca);
    return peca ? peca.nome : 'Desconhecida';
  }

  novoEstoque(): void {
    this.router.navigate(['/estoque/form']);
  }

  editarEstoque(id: number): void {
    this.router.navigate(['/estoque/form', id]);
  }

  excluir(id: number): void {
    if (confirm('Tem certeza que deseja excluir este item do estoque?')) {
      this.estoqueService.excluir(id).subscribe({
        next: () => {
          this.showToast('Item excluído com sucesso!');
          this.carregarEstoque();
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          this.showToast('Erro ao excluir item');
        },
      });
    }
  }

  private showToast(message: string): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const toastBody = toastEl.querySelector('.toast-body');
      if (toastBody) toastBody.textContent = message;

      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }
}
