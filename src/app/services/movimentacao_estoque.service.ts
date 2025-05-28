import { PecaService } from './peca.service';
import { Injectable } from '@angular/core';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { MovimentacaoEstoque } from '../Models/movimento_estoque.model';
import { Peca } from '../Models/peca.model';

@Injectable({
  providedIn: 'root',
})
export class MovimentacaoEstoqueService {
  private movimentacoes: MovimentacaoEstoque[] = [];

  private idCounter = 4;

  constructor(private pecaService: PecaService) {}

  listarPorPeca(idPeca: number): Observable<MovimentacaoEstoque[]> {
    return of(this.movimentacoes.filter((m) => m.id_peca === idPeca));
  }

  listarTodos(): Observable<MovimentacaoEstoque[]> {
    return of(this.movimentacoes);
  }

  buscarPorId(id: number): Observable<MovimentacaoEstoque | undefined> {
    return of(this.movimentacoes.find((m) => m.id === id));
  }

criar(mov: MovimentacaoEstoque): Observable<MovimentacaoEstoque> {
  return this.pecaService.buscarPorId(mov.id_peca).pipe(
    switchMap(peca => {
      if (!peca) {
        return throwError(() => new Error('Peça não encontrada'));
      }

      if (mov.tipo_de_movimentacao === 'SAIDA' && peca.quantidade_atual_estoque! < mov.quantidade) {
        return throwError(() => new Error('Estoque insuficiente para essa saída'));
      }

      this.atualizarEstoqueDaPeca(mov.id_peca, mov.quantidade, mov.tipo_de_movimentacao);
      
      mov.id = this.movimentacoes.length + 1;
      this.movimentacoes.push(mov);

      return of(mov);
    })
  );
}



  atualizar(id: number, data: any): Observable<any> {
    const index = this.movimentacoes.findIndex((m) => m.id === id);
    if (index === -1)
      return throwError(() => new Error('Movimentação não encontrada'));

    const movimentoAntigo = this.movimentacoes[index];

    // Reverter efeito da movimentação anterior
    this.reverterEstoqueDaPeca(
      movimentoAntigo.id_peca,
      movimentoAntigo.quantidade,
      movimentoAntigo.tipo_de_movimentacao
    );

    // Atualizar movimentação
    this.movimentacoes[index] = { ...data, id };

    // Aplicar nova movimentação
    this.atualizarEstoqueDaPeca(
      data.id_peca,
      data.quantidade,
      data.tipo_de_movimentacao
    );

    return of(this.movimentacoes[index]);
  }

  excluir(id: number): Observable<void> {
    const movimentacao = this.movimentacoes.find((m) => m.id === id);
    if (!movimentacao) {
      return throwError(() => new Error('Movimentação não encontrada'));
    }

    // Reverte o estoque antes de excluir
    this.reverterEstoqueDaPeca(
      movimentacao.id_peca,
      movimentacao.quantidade,
      movimentacao.tipo_de_movimentacao
    );

    this.movimentacoes = this.movimentacoes.filter((m) => m.id !== id);
    return of(undefined);
  }

  atualizarEstoqueDaPeca(
    pecaId: number,
    quantidadeMovimentada: number,
    tipo: 'ENTRADA' | 'SAIDA'
  ): void {
    this.pecaService.buscarPorId(pecaId).subscribe((peca) => {
      if (!peca) {
        throw new Error('Peça não encontrada');
      }

      let quantidadeAtual = peca.quantidade_atual_estoque ?? 0;

      if (tipo === 'ENTRADA') {
        quantidadeAtual += quantidadeMovimentada;
      } else if (tipo === 'SAIDA') {
        if (quantidadeAtual < quantidadeMovimentada) {
          throw new Error('Estoque insuficiente para saída');
        }
        quantidadeAtual -= quantidadeMovimentada;
      }

      this.pecaService.atualizarQuantidade(pecaId, quantidadeAtual);
    });
  }

  reverterEstoqueDaPeca(
    id_peca: number,
    quantidade: number,
    tipo: 'ENTRADA' | 'SAIDA'
  ): void {
    const peca = this.pecaService.buscarPorId(id_peca);

    if (peca instanceof Observable) {
      peca.subscribe((p) => {
        if (!p) throw new Error('Peça não encontrada');

        const atual = p.quantidade_atual_estoque ?? 0;

        if (tipo === 'ENTRADA') {
          // Reverter entrada = subtrair
          p.quantidade_atual_estoque = atual - quantidade;
        } else if (tipo === 'SAIDA') {
          // Reverter saída = somar
          p.quantidade_atual_estoque = atual + quantidade;
        }

        // Atualiza a peça no "banco de dados"
        this.pecaService.atualizar(p.id!, p).subscribe();
      });
    } else {
      throw new Error('pecaService.buscarPorId deve retornar um Observable');
    }
  }
}
