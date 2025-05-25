import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MovimentacaoEstoque } from '../Models/movimento_estoque.model';

@Injectable({
  providedIn: 'root'
})
export class MovimentacaoEstoqueService {
  private movimentacoes: MovimentacaoEstoque[] = [
    {
      id: 1,
      quantidade: 10,
      data: new Date('2023-01-15'),
      tipo_de_movimentacao: 'ENTRADA',
      id_peca: 1,
      id_usuario_criador: 1,
      data_criacao: new Date('2023-01-15')
    },
    {
      id: 2,
      quantidade: 5,
      data: new Date('2023-01-20'),
      tipo_de_movimentacao: 'SAIDA',
      id_peca: 1,
      id_usuario_criador: 2,
      data_criacao: new Date('2023-01-20')
    },
    {
      id: 3,
      quantidade: 15,
      data: new Date('2023-02-01'),
      tipo_de_movimentacao: 'ENTRADA',
      id_peca: 2,
      id_usuario_criador: 1,
      data_criacao: new Date('2023-02-01')
    }
  ];

  private idCounter = 4;

  constructor() { }

  listarPorPeca(idPeca: number): Observable<MovimentacaoEstoque[]> {
    return of(this.movimentacoes.filter(m => m.id_peca === idPeca));
  }

  listarTodos(): Observable<MovimentacaoEstoque[]> {
    return of(this.movimentacoes);
  }

  buscarPorId(id: number): Observable<MovimentacaoEstoque | undefined> {
    return of(this.movimentacoes.find(m => m.id === id));
  }

  criar(movimentacao: Omit<MovimentacaoEstoque, 'id'>): Observable<MovimentacaoEstoque> {
    const novaMovimentacao: MovimentacaoEstoque = {
      ...movimentacao,
      id: this.idCounter++,
      data_criacao: new Date()
    };
    this.movimentacoes.push(novaMovimentacao);
    return of(novaMovimentacao);
  }

  atualizar(id: number, movimentacao: MovimentacaoEstoque): Observable<MovimentacaoEstoque | undefined> {
    const index = this.movimentacoes.findIndex(m => m.id === id);
    if (index !== -1) {
      this.movimentacoes[index] = {
        ...this.movimentacoes[index],
        ...movimentacao,
        data_modificacao: new Date()
      };
      return of(this.movimentacoes[index]);
    }
    return of(undefined);
  }

  excluir(id: number): Observable<boolean> {
    const index = this.movimentacoes.findIndex(m => m.id === id);
    if (index !== -1) {
      this.movimentacoes.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
