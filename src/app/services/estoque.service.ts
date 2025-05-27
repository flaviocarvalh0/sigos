import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Estoque } from '../Models/estoque.model';

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {
  private estoqueItems: Estoque[] = [
    {
      id: 1,
      quantidade_atual: 50,
      quantidade_minima: 10,
      id_peca: 1, // ID da peça relacionada
      id_usuario_criador: 1,
      data_criacao: new Date('2023-01-10')
    },
    {
      id: 2,
      quantidade_atual: 30,
      quantidade_minima: 10,
      id_peca: 2,
      id_usuario_criador: 1,
      data_criacao: new Date('2023-01-15')
    }
  ];

  private idCounter = 4;

  constructor() { }

  // Lista todo o estoque
  listar(): Observable<Estoque[]> {
    return of(this.estoqueItems);
  }

  // Busca um item de estoque por ID
  buscarPorId(id: number): Observable<Estoque | undefined> {
    return of(this.estoqueItems.find(item => item.id === id));
  }

  // Busca estoque de uma peça específica
  buscarPorPeca(idPeca: number): Observable<Estoque | undefined> {
    return of(this.estoqueItems.find(item => item.id_peca === idPeca));
  }

  // Atualiza a quantidade de um item no estoque
  atualizarEstoque(id: number, estoque: Estoque): Observable<Estoque | undefined> {
    const item = this.estoqueItems.find(i => i.id === id);
    if (item) {
      item.id_peca = estoque.id_peca;
      item.data_modificacao = new Date();
      return of(item);
    }
    return of(undefined);
  }

  criar(item: Omit<Estoque, 'id'>): Observable<Estoque> {
    const novoItem: Estoque = {
      ...item,
      id: this.idCounter++,
      data_criacao: new Date()
    };
    this.estoqueItems.push(novoItem);
    return of(novoItem);
  }

  // Remove um item do estoque
  excluir(id: number): Observable<boolean> {
    const index = this.estoqueItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.estoqueItems.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
