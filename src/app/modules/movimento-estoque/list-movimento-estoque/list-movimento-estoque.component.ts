// list-movimentacao-estoque.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ListagemDinamicaComponent } from '../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { ToastService } from '../../../services/toast.service';
import { MovimentacaoEstoque } from '../../../Models/movimento_estoque.model';
import { MovimentacaoEstoqueService } from '../../../services/movimentacao_estoque.service';

@Component({
  selector: 'app-list-movimento-estoque',
  template: `<app-listagem-dinamica
              titulo="Movimentações de Estoque"
              [dados]="dados"
              [colunas]="colunas"
              [mostrarAcoes]="false"
              [mostrarFiltros]="false"
              (criarNovo)="novaMovimentacao()">
            </app-listagem-dinamica>`,
  standalone: true,
  imports: [CommonModule, ListagemDinamicaComponent]
})
export class ListMovimentoEstoqueComponent implements OnInit {
  dados: MovimentacaoEstoque[] = [];
  carregando = false;

colunas = [
  {
    campo: 'id',
    titulo: 'ID',
    ordenavel: true,
    filtro: true,
    largura: '80px',
    tipo: 'texto' as const
  },
  {
    campo: 'nomePeca',
    titulo: 'Peça',
    ordenavel: true,
    filtro: true,
    tipo: 'texto' as const
  },
  {
    campo: 'tipoMovimentacao',
    titulo: 'Tipo',
    ordenavel: true,
    filtro: true,
    tipo: 'texto' as const
  },
  {
    campo: 'quantidade',
    titulo: 'Quantidade',
    ordenavel: true,
    tipo: 'texto' as const
  },
  {
    campo: 'observacao',
    titulo: 'Observação',
    filtro: false,
    tipo: 'texto' as const
  },
  {
    campo: 'dataMovimentacao',
    titulo: 'Data',
    tipo: 'data' as const,
    ordenavel: true
  }
];


  constructor(
    private movimentacaoEstoqueService: MovimentacaoEstoqueService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregando = true;
    this.movimentacaoEstoqueService.obterTodos().subscribe({
      next: (res) => {
        this.dados = res;
        this.carregando = false;
      },
      error: () => {
        this.toastService.error('Erro ao carregar movimentações.');
        this.carregando = false;
      }
    });
  }

  novaMovimentacao(): void {
    this.router.navigate(['/movimento-estoque/form']);
  }
}
