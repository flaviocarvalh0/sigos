// src/app/services/modelo.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';


import { CrudService } from './crud.service';
import { Modelo, ModeloAtualizacaoPayload, ModeloCriacaoPayload } from '../Models/modelo.model';
import { RespostaApi } from '../Models/reposta-api.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModeloService extends CrudService<Modelo, number> {
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'modelos';

  constructor(http: HttpClient) {
    super(http);
    console.log(`[ModeloService] Inicializado para interagir com: ${this.fullApiUrl}`);
  }

  // Sobrescrevendo para usar payload específico
  override criar(payload: ModeloCriacaoPayload): Observable<Modelo> {
    return this.http.post<RespostaApi<Modelo>>(`${this.fullApiUrl}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error("Erro ao criar modelo (resposta API):", response.mensagem, response.erros);
          throw new Error(response.mensagem || 'Falha ao criar modelo.');
        }),
        catchError(this.handleError)
      );
  }

  override atualizar(id: number, payload: ModeloAtualizacaoPayload): Observable<Modelo> {
    return this.http.put<RespostaApi<Modelo>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error(`Erro ao atualizar modelo ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao atualizar modelo ${id}.`);
        }),
        catchError(this.handleError)
      );
  }


  obterPorMarca(idMarca: number): Observable<{ id: number, descricao: string }[]> {
    return this.http.get<RespostaApi<{ id: number, descricao: string }[]>>(`${this.fullApiUrl}/selecao/marca/${idMarca}`, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) return response.dados;
          throw new Error(response.mensagem || 'Falha ao obter modelos por marca.');
        }),
        catchError(this.handleError)
      );
  }
}
