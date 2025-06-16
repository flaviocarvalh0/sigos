import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud.service';

import { Observable, catchError, map } from 'rxjs';
import { SelectItem } from '../Models/select-item.model';
import { RespostaApi } from '../Models/reposta-api.model';
import { Peca, PecaCriacaoPayload } from '../Models/peca.model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class PecaService extends CrudService<Peca, number> {
   protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'pecas';

  constructor(protected override http: HttpClient) {
    super(http);
  }

  // No PecaService
override criar(payload: PecaCriacaoPayload): Observable<Peca> {
  return this.http.post<RespostaApi<Peca>>(`${this.fullApiUrl}`, payload, this.getHttpOptions())
    .pipe(
      map(response => {
        if (response.sucesso && response.dados) {
          return response.dados;
        }
        console.error('Erro ao criar peça (resposta API):', response.mensagem, response.erros);
        throw new Error(response.mensagem || 'Falha ao criar peça.');
      }),
      catchError(this.handleError)
    );
}

}
