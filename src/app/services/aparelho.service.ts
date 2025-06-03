// src/app/services/aparelho.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // HttpParams pode ser necessário se usado diretamente
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Aparelho, AparelhoCriacaoPayload, AparelhoAtualizacaoPayload } from '../Models/aparelho.model';
import { RespostaApi } from '../Models/reposta-api.model'; // Ajuste o path se seu modelo RespostaApi estiver 
import { CrudService } from './crud.service';

@Injectable({
  providedIn: 'root'
})
export class AparelhoService extends CrudService<Aparelho, number> {
  // Definindo as propriedades abstratas da classe base
  protected readonly apiUrlBase = 'https://localhost:7119/api'; // Ajuste a porta se necessário
  protected readonly endpoint = 'aparelhos';

  constructor(http: HttpClient) {
    super(http); // Chama o construtor da classe base
    console.log(`[AparelhoService] Inicializado para interagir com: ${this.fullApiUrl}`);
  }

  override criar(payload: AparelhoCriacaoPayload): Observable<Aparelho> {

    return this.http.post<RespostaApi<Aparelho>>(`${this.fullApiUrl}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados; // A API do AparelhoCelularController retorna o Aparelho criado
          }
          console.error("Erro ao criar aparelho (resposta API):", response.mensagem, response.erros);
          throw new Error(response.mensagem || 'Falha ao criar aparelho.');
        }),
        catchError(this.handleError) // Reutiliza o handleError da classe base
      );
  }

  // Sobrescrevendo 'atualizar' para usar o payload específico AparelhoAtualizacaoPayload
  // e gerenciar o campo dataUltimaModificacao para controle de concorrência.
  override atualizar(id: number, payload: AparelhoAtualizacaoPayload): Observable<Aparelho> {
    // O CrudService.atualizar espera Partial<T> | T.
    // AparelhoAtualizacaoPayload é um DTO específico que inclui dataUltimaModificacao.
    return this.http.put<RespostaApi<Aparelho>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          // O handleError da classe base já deve tratar erros HTTP como 409 (conflito).
          // A mensagem de erro do backend "Os dados foram modificados por outro usuário..."
          // será capturada por handleError.
          console.error(`Erro ao atualizar aparelho ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao atualizar aparelho ${id}.`);
        }),
        catchError(this.handleError) // Reutiliza o handleError da classe base
      );
  }

  buscarPorCliente(clienteId: number): Observable<Aparelho[]> {
    // Usando o obterTodos herdado
    return this.obterTodos().pipe(
      map(aparelhos => aparelhos.filter(aparelho => aparelho.idCliente === clienteId)),
      catchError(this.handleError) // Adiciona tratamento de erro caso obterTodos falhe
    );
  }
  excluir(id: number): Observable<void> {
    console.warn("Método `excluir(id)` está obsoleto, use `remover(id)` que é herdado do CrudService.");
    return this.remover(id);
  }
}