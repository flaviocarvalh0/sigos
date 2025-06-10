import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TransicaoDisponivel } from '../../Models/workflow/workflow-transicao.model';

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
}
