// src/app/services/peca.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Peca } from '../Models/peca.model';

@Injectable({
  providedIn: 'root',
})
export class PecaService {
  private pecas: Peca[] = [
    {
      id: 1,
      nome: 'Tela Samsung Galaxy S10',
      preco_custo: 45.9,
      preco_venda: 89.9,
      localizacao_fisica: 'Prateleira A3',
      quantidade_minima_estoque: 10,
      quantidade_atual_estoque: 20,
      id_marca: 1,
      id_modelo: 5,
      id_fornecedor: 3,
    },
    {
      id: 2,
      nome: 'Microfone iPhone 11',
      preco_custo: 12.5,
      preco_venda: 29.9,
      localizacao_fisica: 'Prateleira B1',
      quantidade_minima_estoque: 15,
      quantidade_atual_estoque: 30,
      id_marca: 2,
      id_modelo: 8,
      id_fornecedor: 2,
    },
  ];

  constructor() {}

  listar(): Observable<Peca[]> {
    return of(this.pecas);
  }

  buscarPorId(id: number): Observable<Peca | undefined> {
    return of(this.pecas.find((p) => p.id === id));
  }

  criar(peca: Peca): Observable<Peca> {
    const novoId = Math.max(...this.pecas.map((p) => p.id || 0)) + 1;
    const novaPeca = { ...peca, id: novoId };
    this.pecas.push(novaPeca);
    return of(novaPeca);
  }

  atualizar(id: number, peca: Peca): Observable<Peca> {
    const index = this.pecas.findIndex((p) => p.id === id);
    if (index >= 0) {
      this.pecas[index] = { ...peca, id };
      return of(this.pecas[index]);
    }
    throw new Error('Peça não encontrada');
  }

  excluir(id: number): Observable<boolean> {
    const index = this.pecas.findIndex((p) => p.id === id);
    if (index >= 0) {
      this.pecas.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  atualizarQuantidade(id: number, novaQuantidade: number): void {
    this.buscarPorId(id).subscribe((peca) => {
      if (!peca) {
        throw new Error('Peça não encontrada');
      }
      peca.quantidade_atual_estoque = novaQuantidade;
    });
  }
}
