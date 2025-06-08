import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Fornecedor, FornecedorCriacaoPayload, FornecedorAtualizacaoPayload } from '../Models/fornecedor.model';
import { CrudService } from './crud.service';
import { RespostaApi } from '../Models/reposta-api.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FornecedorService extends CrudService<Fornecedor, number> {
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'fornecedores'; // Conforme seu FornecedorController

  constructor(http: HttpClient) {
    super(http);

  }

  // obterTodos() é herdado e usa GET /api/fornecedores
  // obterPorId(id: number) é herdado e usa GET /api/fornecedores/{id}
  // remover(id: number) é herdado e usa DELETE /api/fornecedores/{id}

  // Sobrescrevendo criar para usar FornecedorCriacaoPayload.
  criarFornecedor(payload: FornecedorCriacaoPayload): Observable<Fornecedor> {
    return super.criar(payload as Omit<Fornecedor, 'id'>);
    // Ou, para total controle do payload enviado à API, se houver diferenças sutis:
    /*
    return this.http.post<RespostaApi<Fornecedor>>(`${this.fullApiUrl}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error("Erro ao criar fornecedor (resposta API):", response.mensagem, response.erros);
          throw new Error(response.mensagem || 'Falha ao criar fornecedor.');
        }),
        catchError(this.handleError)
      );
    */
  }

  // Sobrescrevendo atualizar para usar FornecedorAtualizacaoPayload.
  atualizarFornecedor(id: number, payload: FornecedorAtualizacaoPayload): Observable<Fornecedor> {
    return this.http.put<RespostaApi<Fornecedor>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error(`Erro ao atualizar fornecedor ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao atualizar fornecedor ${id}.`);
        }),
        catchError(this.handleError)
      );
  }
}
