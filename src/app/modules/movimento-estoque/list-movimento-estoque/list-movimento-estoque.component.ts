import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MovimentacaoEstoque } from '../../../Models/movimento_estoque.model';
import { MovimentacaoEstoqueService } from '../../../services/movimentacao_estoque.service';
import { PecaService } from '../../../services/peca.service';
import { NgClass, NgFor, NgIf } from '@angular/common';

declare const bootstrap: any;

@Component({
  selector: 'app-list-movimento-estoque',
  imports: [NgClass, [NgIf,NgFor]],
  templateUrl: './list-movimento-estoque.component.html',
  styleUrl: './list-movimento-estoque.component.css',
})
export class ListMovimentoEstoqueComponent {
  movimentacoes: MovimentacaoEstoque[] = [];
  nomePecas: Record<number, string> = {};

  constructor(
    private movimentacaoService: MovimentacaoEstoqueService,
    private pecaService: PecaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarMovimentacoes();
    this.pecaService.listar().subscribe((pecas) => {
      pecas.forEach((p) => {
        this.nomePecas[p.id!] = p.nome;
      });
    });
  }

  carregarMovimentacoes(): void {
    this.movimentacaoService.listarTodos().subscribe((m) => {
      this.movimentacoes = m;
    });
  }

  getNomePeca(id: number): string {
    return this.nomePecas[id] || '...';
  }

  novaMovimentacao(): void {
    this.router.navigate(['/movimento-estoque/form']);
  }

  editarMovimentacao(id: number): void {
    this.router.navigate(['/movimento-estoque/form', id]);
  }

  excluir(id: number): void {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      this.movimentacaoService.excluir(id).subscribe(() => {
        this.carregarMovimentacoes();
        this.showToast('Movimentação excluída com sucesso!');
      });
    }
  }

  showToast(mensagem: string): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      toastEl.querySelector('.toast-body')!.textContent = mensagem;
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }
}
