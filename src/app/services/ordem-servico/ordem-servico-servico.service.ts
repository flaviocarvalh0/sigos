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

  obterItemPorId(idOrdemServico: number, idServico: number) {
    return this.http.get<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/servicos/${idServico}`);
  }

  criarServico(idOrdemServico: number, payload: OrdemServicoServicoCriacaoPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/servicos`, payload);
  }

  atualizarServico(idOrdemServico: number, id: number, payload: OrdemServicoServicoAtualizacaoPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/servicos/${id}`, payload);
  }

  removerServico(idOrdemServico: number, id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/servicos/${id}`);
  }
}
