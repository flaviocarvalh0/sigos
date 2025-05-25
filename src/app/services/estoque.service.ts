import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Estoque } from '../Models/estoque.model';

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {
  private estoque: Estoque[] = [
    {
      id: 1,
      quantidade_atual: 15,
      id_peca: 1,
      id_usuario_criador: 1,
      data_criacao: new Date('2023-01-15')
    },
    {
      id: 2,
      quantidade_atual: 8,
      id_peca: 2,
      id_usuario_criador: 1,
      data_criacao: new Date('2023-02-20')
    },
    {
      id: 3,
      quantidade_atual: 25,
      id_peca: 3,
      id_usuario_criador: 2,
      data_criacao: new Date('2023-03-10')
    }
  ];

  private idCounter = 4;

  constructor() { }

  listar(): Observable<Estoque[]> {
    return of(this.estoque);
  }

  buscarPorId(id: number): Observable<Estoque | undefined> {
    return of(this.estoque.find(item => item.id === id));
  }

  buscarPorPeca(idPeca: number): Observable<Estoque | undefined> {
    return of(this.estoque.find(item => item.id_peca === idPeca));
  }

  atualizarQuantidade(idPeca: number, quantidade: number): Observable<Estoque | undefined> {
    const index = this.estoque.findIndex(item => item.id_peca === idPeca);
    if (index !== -1) {
      this.estoque[index].quantidade_atual = quantidade;
      this.estoque[index].data_modificacao = new Date();
      return of(this.estoque[index]);
    }
    return of(undefined);
  }

  criar(item: Omit<Estoque, 'id'>): Observable<Estoque> {
    const novoItem: Estoque = {
      ...item,
      id: this.idCounter++,
      data_criacao: new Date()
    };
    this.estoque.push(novoItem);
    return of(novoItem);
  }

  atualizar(id: number, item: Estoque): Observable<Estoque | undefined> {
    const index = this.estoque.findIndex(i => i.id === id);
    if (index !== -1) {
      this.estoque[index] = {
        ...this.estoque[index],
        ...item,
        data_modificacao: new Date()
      };
      return of(this.estoque[index]);
    }
    return of(undefined);
  }

  excluir(id: number): Observable<boolean> {
    const index = this.estoque.findIndex(item => item.id === id);
    if (index !== -1) {
      this.estoque.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
