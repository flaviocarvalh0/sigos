// src/app/services/workflow/workflow-estado.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Importa a interface de resposta padrão e os modelos específicos deste serviço
import { RespostaApi } from '../../Models/reposta-api.model';
import {
  WorkflowEstado,
  EstadoSelecao,
  WorkflowEstadoCriacaoPayload,
  WorkflowEstadoAtualizacaoPayload
} from '../../Models/workflow/workflow-estado.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowEstadoService {
  // A URL base para este serviço específico
  private readonly apiUrl = `${environment.apiUrl}/workflow-estados`;

  constructor(private http: HttpClient) { }

  /**
   * Busca todos os estados cadastrados.
   */
  obterTodos(): Observable<WorkflowEstado[]> {
    return this.http.get<RespostaApi<WorkflowEstado[]>>(this.apiUrl)
      .pipe(
        map(response => response.dados || []),
        catchError(this.handleError)
      );
  }

  /**
   * Busca uma lista simplificada de estados para uso em dropdowns,
   * filtrando por um ID de workflow específico.
   * @param idWorkflow O ID do workflow para o qual buscar os estados.
   */
  obterParaSelecao(idWorkflow: number): Observable<EstadoSelecao[]> {
    // CORREÇÃO: O ID do workflow agora é parte da URL, como solicitado.
    return this.http.get<RespostaApi<EstadoSelecao[]>>(`${this.apiUrl}/selecao-por-workflow/${idWorkflow}`)
      .pipe(
        map(response => response.dados || []),
        catchError(this.handleError)
      );
  }

  /**
   * Cria um novo estado de workflow.
   * @param payload O objeto com os dados para criar o novo estado.
   */
  criarEstado(payload: WorkflowEstadoCriacaoPayload): Observable<WorkflowEstado> {
    return this.http.post<RespostaApi<WorkflowEstado>>(this.apiUrl, payload)
      .pipe(
        map(response => {
          if (response.dados === undefined || response.dados === null) {
            throw new Error('Resposta da API não contém dados do estado de workflow.');
          }
          return response.dados;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Atualiza um estado de workflow existente.
   * @param id O ID do estado a ser atualizado.
   * @param payload O objeto com os dados para atualizar o estado.
   */
  atualizarEstado(id: number, payload: WorkflowEstadoAtualizacaoPayload): Observable<WorkflowEstado> {
    return this.http.put<RespostaApi<WorkflowEstado>>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map(response => {
          if (response.dados === undefined || response.dados === null) {
            throw new Error('Resposta da API não contém dados do estado de workflow.');
          }
          return response.dados;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Remove um estado de workflow.
   * @param id O ID do estado a ser removido.
   */
  remover(id: number): Observable<boolean> {
    return this.http.delete<RespostaApi<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.sucesso),
        catchError(this.handleError)
      );
  }

  // Tratamento de erro privado para o serviço
  private handleError(error: any): Observable<never> {
    console.error('Ocorreu um erro no WorkflowEstadoService:', error);
    const errorMessage = error.error?.mensagem || 'Erro desconhecido. Verifique sua conexão ou contate o suporte.';
    return throwError(() => new Error(errorMessage));
  }
}
