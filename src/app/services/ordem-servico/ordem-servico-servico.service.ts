import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaApi } from '../../Models/reposta-api.model';
import { OrdemServicoServico, OrdemServicoServicoAtualizacaoPayload, OrdemServicoServicoCriacaoPayload } from '../../Models/ordem-servico/ordem-servico-servico';
import { CrudService } from '../crud.service';

@Injectable({
  providedIn: 'root'
})
export class OrdemServicoServicoService extends CrudService<OrdemServicoServico, number>{
  protected override readonly apiUrlBase = environment.apiUrl;
  protected override readonly endpoint = '';

  constructor(protected override http: HttpClient) {
    super(http);
  }

  obterPorOrdemServico(ordemServicoId: number): Observable<RespostaApi<OrdemServicoServico[]>> {
    return this.http.get<RespostaApi<OrdemServicoServico[]>>(`${this.apiUrlBase}/ordens-servico/${ordemServicoId}/servicos`);
  }

  criarServico(ordemServicoId: number, payload: OrdemServicoServicoCriacaoPayload): Observable<RespostaApi<any>> {
    return this.http.post<RespostaApi<any>>(`${this.apiUrlBase}/ordens-servico/${ordemServicoId}/servicos`, payload);
  }

  atualizarServico(id: number, payload: OrdemServicoServicoAtualizacaoPayload): Observable<RespostaApi<any>> {
    return this.http.put<RespostaApi<any>>(`${this.apiUrlBase}/ordens-servico/${payload.idOrdemServico}/servicos/${id}`, payload);
  }

  removerServico(ordemServicoId: number, id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrlBase}/ordens-servico/${ordemServicoId}/servicos/${id}`);
  }
}
