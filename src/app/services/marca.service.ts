// src/app/services/marca.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Marca, MarcaCriacaoPayload, MarcaAtualizacaoPayload } from '../Models/marca.model'; // Ajuste o path
import { RespostaApi } from '../Models/reposta-api.model'; // Ajuste o path
import { CrudService } from './crud.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MarcaService extends CrudService<Marca, number> {
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'marcas'; // Endpoint da API para Marcas

  constructor(http: HttpClient) {
    super(http);
    console.log(`[MarcaService] Inicializado para interagir com: ${this.fullApiUrl}`);
  }

  // O método obterPorId(id: number): Observable<Marca | undefined> é herdado.
  // O método obterTodos(queryParams?): Observable<Marca[]> é herdado.
  // O método remover(id: number): Observable<void> é herdado.

  // Wrapper para manter compatibilidade com chamadas existentes de getMarcas()
  // Idealmente, os componentes deveriam chamar obterTodos() diretamente.
  getMarcas(): Observable<Marca[]> {
    return this.obterTodos();
  }

  // Sobrescrevendo 'criar' para usar o payload específico MarcaCriacaoPayload.
  // O Controller C# para Marca espera MarcaCriacaoDto e mapeia para a entidade Marca.
  override criar(payload: MarcaCriacaoPayload): Observable<Marca> {
    return this.http.post<RespostaApi<Marca>>(`${this.fullApiUrl}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados; // API retorna a Marca criada
          }
          console.error("Erro ao criar marca (resposta API):", response.mensagem, response.erros);
          throw new Error(response.mensagem || 'Falha ao criar marca.');
        }),
        catchError(this.handleError) // Reutiliza o handleError da classe base
      );
  }

  // Sobrescrevendo 'atualizar' para usar o payload específico MarcaAtualizacaoPayload.
  // Este payload inclui 'dataUltimaModificacao' para controle de concorrência.
  // O Controller C# para Marca espera MarcaAtualizacaoDto.
  override atualizar(id: number, payload: MarcaAtualizacaoPayload): Observable<Marca> {
    return this.http.put<RespostaApi<Marca>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados; // API retorna a Marca atualizada
          }
          // O handleError da classe base já trata erros HTTP, incluindo 409 (Conflito)
          // se o backend retornar esse status com uma RespostaApi correspondente.
          console.error(`Erro ao atualizar marca ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao atualizar marca ${id}.`);
        }),
        catchError(this.handleError) // Reutiliza o handleError da classe base
      );
  }


}