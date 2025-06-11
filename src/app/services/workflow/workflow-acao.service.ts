// src/app/services/workflow/workflow-acao.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { RespostaApi } from '../../Models/reposta-api.model';
import {
  WorkFlowAcao,
  WorkFlowAcaoCriacaoPayload,
  WorkFlowAcaoAtualizacaoPayload,
  AcaoSelecao
} from '../../Models/workflow/workflow-acao.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowAcaoService {
  private readonly apiUrl = `${environment.apiUrl}/workflow-acoes`;

  constructor(private http: HttpClient) { }

  /**
   * Busca todas as ações que pertencem a um workflow específico.
   * Corresponde à rota: GET /acoes-do-workflow/{idWorkflow}
   */
 obterAcoesPorWorkflow(idWorkflow: number): Observable<WorkFlowAcao[]> {
    // Esperamos uma resposta genérica (any[]) para poder mapear os campos manualmente.
    return this.http.get<RespostaApi<any[]>>(`${this.apiUrl}/acoes-do-workflow/${idWorkflow}`)
      .pipe(
        map(response => {
          const dadosApi = response.dados || [];
                    console.log(dadosApi);
          // Mapeia a resposta da API para o formato que a aplicação espera.
          return dadosApi.map(item => ({
            id: item.idAcao,
            nome: item.nomeAcao,
            // A API de ações simplificada pode não retornar a descrição, então usamos um valor padrão.
            descricao: item.descricao || '',
            idWorkFlow: idWorkflow,
            // Outros campos do modelo que não vêm nesta rota recebem valores padrão.
            nomeWorFlow: '',
          } as WorkFlowAcao));
        }),
        catchError(this.handleError)
      );
  }

  obterParaSelecaoPorWorkflow(idWorkflow: number): Observable<AcaoSelecao[]> {
      return this.http.get<RespostaApi<AcaoSelecao[]>>(`${this.apiUrl}/selecao-por-workflow/${idWorkflow}`)
        .pipe(
          map(response => response.dados || []),
          catchError(this.handleError)
        );
    }


  /**
   * Cria uma nova ação de workflow.
   */
  criarAcao(payload: WorkFlowAcaoCriacaoPayload): Observable<WorkFlowAcao> {
    return this.http.post<RespostaApi<WorkFlowAcao>>(this.apiUrl, payload)
      .pipe(
        map(response => {
          if (response.dados === undefined || response.dados === null) {
            throw new Error('Resposta da API não contém dados da ação de workflow.');
          }
          return response.dados;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Remove uma ação de workflow.
   */
  remover(id: number): Observable<boolean> {
    return this.http.delete<RespostaApi<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.sucesso),
        catchError(this.handleError)
      );
  }

  // Tratamento de erro privado
  private handleError(error: any): Observable<never> {
    console.error('Ocorreu um erro no WorkflowAcaoService:', error);
    const errorMessage = error.error?.mensagem || 'Erro desconhecido.';
    return throwError(() => new Error(errorMessage));
  }
}
