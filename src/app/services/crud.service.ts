import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RespostaApi } from '../Models/reposta-api.model';


export abstract class CrudService<T extends { id?: ID }, ID> { // Adicionado T extends { id?: ID } para uso no criar
  protected abstract readonly apiUrlBase: string;
  protected abstract readonly endpoint: string;

  constructor(protected http: HttpClient) {}

  protected get fullApiUrl(): string {
    return `${this.apiUrlBase}/${this.endpoint}`;
  }

  protected getHttpOptions(params?: HttpParams): { headers?: HttpHeaders, params?: HttpParams } {
    return {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      params
    };
  }

  // O payload de criação não deve ter 'id'.
  // O tipo T precisa ser ajustado para Omit<T, 'id'> ou algo que não exija 'id'.
  // Ou o backend ignora o 'id' no payload de criação.
  // Seu UsuarioCriacaoPayload já omite 'id'.
  criar(item: Omit<T, 'id'>): Observable<T> {
    return this.http.post<RespostaApi<T>>(`${this.fullApiUrl}`, item, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error("Erro ao criar item (resposta API):", response.mensagem, response.erros);
          throw new Error(response.mensagem || 'Falha ao criar item.');
        }),
        catchError(this.handleError)
      );
  }

  obterPorId(id: ID): Observable<T | undefined> {
    return this.http.get<RespostaApi<T>>(`${this.fullApiUrl}/${id}`, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          if (response.status === 404) return undefined;
          console.error(`Erro ao obter item ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao obter item ${id}.`);
        }),
        catchError(this.handleError)
      );
  }

  obterTodos(queryParams?: Record<string, string | number | boolean>): Observable<T[]> {
    let params = new HttpParams();
    if (queryParams) {
      for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key)) {
          params = params.set(key, queryParams[key]);
        }
      }
    }
    return this.http.get<RespostaApi<T[]>>(`${this.fullApiUrl}`, this.getHttpOptions(params))
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error("Erro ao obter lista (resposta API):", response.mensagem, response.erros);
          throw new Error(response.mensagem || 'Falha ao obter lista de itens.');
        }),
        catchError(this.handleError)
      );
  }

  // Seu UsuarioAtualizacaoPayload inclui o ID no corpo, o que é comum.
  // O tipo `item: Partial<T>` pode ser muito genérico se o backend espera um DTO específico.
  // Para o caso de Usuario, o método atualizar foi sobrescrito no UsuarioService.
  // Este método base pode ser usado para outros CRUDs mais simples.
  atualizar(id: ID, item: Partial<T> | T): Observable<T> {
    return this.http.put<RespostaApi<T>>(`${this.fullApiUrl}/${id}`, item, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error(`Erro ao atualizar item ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao atualizar item ${id}.`);
        }),
        catchError(this.handleError)
      );
  }

  remover(id: ID): Observable<void> {
    return this.http.delete<RespostaApi<boolean>>(`${this.fullApiUrl}/${id}`, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso) {
            return;
          }
          console.error(`Erro ao remover item ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao remover item ${id}.`);
        }),
        catchError(this.handleError)
      );
  }

  protected handleError(error: HttpErrorResponse): Observable<never> {
    // ... (seu método handleError como definido antes) ...
    let errorMessage = 'Ocorreu um erro desconhecido no serviço!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'Não foi possível conectar à API. Verifique sua rede ou o servidor.';
      } else if (error.error && typeof error.error.mensagem === 'string') {
        errorMessage = error.error.mensagem;
      } else if (error.error && error.error.title && typeof error.error.title === 'string') {
        errorMessage = `${error.error.title}`;
        if (error.error.errors) {
            const validationErrors = [];
            for (const key in error.error.errors) {
                if (error.error.errors.hasOwnProperty(key)) {
                    validationErrors.push(`${key}: ${error.error.errors[key].join(', ')}`);
                }
            }
            if (validationErrors.length > 0) {
              errorMessage += ` Detalhes: ${validationErrors.join('; ')}`;
            }
        }
      } else if (typeof error.message === 'string') {
        errorMessage = `HTTP ${error.status}: ${error.message}`;
      } else {
        errorMessage = `Erro do servidor: ${error.status} ${error.statusText || 'Erro desconhecido'}`;
      }
    }
    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
