// src/app/services/workflow/workflow-estado.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private readonly apiUrl = `${environment.apiUrl}/workflow-estados`;

  constructor(private http: HttpClient) { }

  /**
   * Busca todos os estados que pertencem a um workflow específico.
   * Corresponde à rota: GET /estados-do-workflow/{idWorkflow}
   */
  obterEstadosPorWorkflow(idWorkflow: number): Observable<WorkflowEstado[]> {
    // Esperamos uma resposta genérica (any[]) para poder mapear os campos manualmente.
    return this.http.get<RespostaApi<any[]>>(`${this.apiUrl}/estados-do-workflow/${idWorkflow}`)
      .pipe(
        map(response => {
          const dadosApi = response.dados || [];
          // Mapeia a resposta para o formato que a aplicação espera.
          return dadosApi.map(item => ({
            id: item.id || item.idEstado, // Usa 'id' ou 'idEstado'
            nome: item.nome || item.nomeEstado, // Usa 'nome' ou 'nomeEstado'
            descricao: item.descricao,
            idWorkFlow: item.idWorkFlow,
            nomeWorFlow: item.nomeWorFlow,
            isEstadoInicial: item.isEstadoInicial,
            criadoPor: item.criadoPor,
            dataCriacao: item.dataCriacao,
            modificadoPor: item.modificadoPor,
            dataModificacao: item.dataModificacao
          }) as WorkflowEstado);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Busca uma lista simplificada de estados para uso em dropdowns,
   * filtrando por um ID de workflow específico.
   * Corresponde à rota: GET /selecao-por-workflow/{idWorkflow}
   */
  obterParaSelecaoPorWorkflow(idWorkflow: number): Observable<EstadoSelecao[]> {
    return this.http.get<RespostaApi<EstadoSelecao[]>>(`${this.apiUrl}/selecao-por-workflow/${idWorkflow}`)
      .pipe(
        map(response => response.dados || []),
        catchError(this.handleError)
      );
  }

  /**
   * Cria um novo estado de workflow.
   */
  criarEstado(payload: WorkflowEstadoCriacaoPayload): Observable<WorkflowEstado> {
    return this.http.post<RespostaApi<WorkflowEstado>>(this.apiUrl, payload)
      .pipe(
        map(response => {
          if (response.dados) {
            return response.dados;
          }
          throw new Error(response.mensagem || 'Falha ao criar/atualizar estado do workflow.');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Atualiza um estado de workflow existente.
   */
  atualizarEstado(id: number, payload: WorkflowEstadoAtualizacaoPayload): Observable<WorkflowEstado> {
    return this.http.put<RespostaApi<WorkflowEstado>>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map(response => {
          if (response.dados) {
            return response.dados;
          }
          throw new Error(response.mensagem || 'Falha ao atualizar estado do workflow.');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Remove um estado de workflow.
   */
  remover(id: number): Observable<boolean> {
    return this.http.delete<RespostaApi<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.sucesso),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Ocorreu um erro no WorkflowEstadoService:', error);
    const errorMessage = error.error?.mensagem || 'Erro desconhecido. Verifique sua conexão ou contate o suporte.';
    return throwError(() => new Error(errorMessage));
  }
}
