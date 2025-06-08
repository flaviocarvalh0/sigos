import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { CrudService } from './crud.service'; // Seu CrudService genérico

import { RespostaApi } from '../Models/reposta-api.model'; // Sua interface de RespostaApi
import { Grupo } from '../Models/usuario.model';
import { GrupoAtualizacaoPayload, GrupoCriacaoPayload, GrupoSelecao } from '../Models/grupo.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GrupoService extends CrudService<Grupo, number> {

  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'grupos'; // Conforme seu FornecedorController

  constructor(http: HttpClient) {
    super(http);
  }

  override criar(payload: GrupoCriacaoPayload): Observable<Grupo> {
      return this.http.post<RespostaApi<Grupo>>(`${this.fullApiUrl}`, payload, this.getHttpOptions()).pipe(
        map(response => {
          if (response.sucesso && response.dados) return response.dados;
          throw new Error(response.mensagem || 'Falha ao criar categoria.');
        }),
        catchError(this.handleError)
      );
    }

    override atualizar(id: number, payload: GrupoAtualizacaoPayload): Observable<Grupo> {
      return this.http.put<RespostaApi<Grupo>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions()).pipe(
        map(response => {
          if (response.sucesso && response.dados) return response.dados;
          throw new Error(response.mensagem || 'Falha ao atualizar categoria.');
        }),
        catchError(this.handleError)
      );
    }

  // O CrudService já deve fornecer:
  // obterTodos(): Observable<RespostaApi<Grupo[]>>
  // obterPorId(id: number): Observable<RespostaApi<Grupo>>
  // criar(payload: GrupoCriacaoPayload): Observable<RespostaApi<Grupo>>
  // atualizar(id: number, payload: GrupoAtualizacaoPayload): Observable<RespostaApi<Grupo>>
  // remover(id: number): Observable<RespostaApi<boolean>>
}
