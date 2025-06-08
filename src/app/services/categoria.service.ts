// src/app/services/categoria.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { CrudService } from './crud.service';
import { RespostaApi } from '../Models/reposta-api.model';
import { Categoria, CategoriaAtualizacaoPayload, CategoriaCriacaoPayload } from '../Models/categoria.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService extends CrudService<Categoria, number> {
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'categorias';

  constructor(http: HttpClient) {
    super(http);
  }

  getCategorias(): Observable<Categoria[]> {
    return this.obterTodos();
  }

  override criar(payload: CategoriaCriacaoPayload): Observable<Categoria> {
    return this.http.post<RespostaApi<Categoria>>(`${this.fullApiUrl}`, payload, this.getHttpOptions()).pipe(
      map(response => {
        if (response.sucesso && response.dados) return response.dados;
        throw new Error(response.mensagem || 'Falha ao criar categoria.');
      }),
      catchError(this.handleError)
    );
  }

  override atualizar(id: number, payload: CategoriaAtualizacaoPayload): Observable<Categoria> {
    return this.http.put<RespostaApi<Categoria>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions()).pipe(
      map(response => {
        if (response.sucesso && response.dados) return response.dados;
        throw new Error(response.mensagem || 'Falha ao atualizar categoria.');
      }),
      catchError(this.handleError)
    );
  }
}
