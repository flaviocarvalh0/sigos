import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TransicaoDisponivel, WorkFlowTransicao, WorkFlowTransicaoCriacaoDto } from '../../Models/workflow/workflow-transicao.model';
import { RespostaApi } from '../../Models/reposta-api.model';

@Injectable({
  providedIn: 'root'
})
export class WorkflowtTransacaoService {
  private apiUrl = `${environment.apiUrl}/workflow-transicoes`;

  constructor(private http: HttpClient) { }

  obterTransicoesPossiveis(idWorkflow: number, idEstadoOrigem: number): Observable<TransicaoDisponivel[]> {
    const url = `${this.apiUrl}/workflow/${idWorkflow}/estado/${idEstadoOrigem}`;
    // A API retorna um objeto { dados: Transicao[] }, então usamos o pipe(map)
    return this.http.get<{ dados: TransicaoDisponivel[] }>(url)
      .pipe(map(response => response.dados || []));
  }

 obterTransicoesPorWorkflow(idWorkflow: number): Observable<WorkFlowTransicao[]> {
    // Espera uma resposta genérica (any[]) para poder mapear os campos manualmente.
    return this.http.get<RespostaApi<any[]>>(`${this.apiUrl}/transicoes-do-workflow/${idWorkflow}`)
      .pipe(
        map(response => {
          const dadosApi = response.dados || [];
          // Mapeia a resposta da API para o formato que a aplicação espera.
          return dadosApi.map(item => ({
            id: item.idTransicao, // <-- Mapeamento principal do ID
            nomeEstadoOrigem: item.nomeEstadoOrigem,
            nomeAcao: item.nomeAcao,
            nomeEstadoDestino: item.nomeEstadoDestino,
            // Preenche outros campos do modelo WorkFlowTransicao com valores padrão ou recebidos
            idWorkFlow: idWorkflow,
            nomeWorFlow: '', // Não vem na resposta simplificada
            idEstadoOrigem: item.idEstadoOrigem,
            idAcao: item.idAcao,
            idEstadoDestino: item.idEstadoDestino,
          } as WorkFlowTransicao));
        }),
        catchError(this.handleError)
      );
  }


  /**
   * Cria uma nova transição de workflow.
   */
  criarTransicao(payload: WorkFlowTransicaoCriacaoDto): Observable<WorkFlowTransicao> {
    return this.http.post<RespostaApi<WorkFlowTransicao>>(this.apiUrl, payload)
      .pipe(
        map(response => response.dados as WorkFlowTransicao),
        catchError(this.handleError)
      );
  }

  /**
   * Remove uma transição de workflow.
   */
  remover(id: number): Observable<boolean> {
    return this.http.delete<RespostaApi<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.sucesso),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Ocorreu um erro no WorkflowTransicaoService:', error);
    const errorMessage = error.error?.mensagem || 'Erro desconhecido.';
    return throwError(() => new Error(errorMessage));
  }
}
