import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { CrudService } from '../crud.service';
import { OrdemServicoPeca } from '../../Models/ordem-servico/ordem-servico-peca.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdemServicoPecaService extends CrudService<OrdemServicoPeca, number> {
  protected override readonly apiUrlBase = 'https://localhost:7119/api'
  protected override readonly endpoint = ''; // Definido dinamicamente

  constructor(protected override http: HttpClient) {
    super(http);
  }

    obterPorOrdemServico(idOrdemServico: number) {
    return this.http.get<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/pecas`);
  }

  obterItemPorId(idOrdemServico: number, idPeca: number) {
    return this.http.get<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/pecas/${idPeca}`);
  }

  criarPeca(idOrdemServico: number, payload: any) {
    const sanitizedPayload = {
    ...payload,
    valorMaoDeObra: payload.valorMaoObra ?? 0
  };
    return this.http.post<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/pecas`, sanitizedPayload);
  }

  atualizarPeca(idOrdemServico: number, id: number, payload: any) {
    return this.http.put<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/pecas/${id}`, payload);
  }

  removerPeca(idOrdemServico: number, id: number) {
    return this.http.delete<any>(`${this.apiUrlBase}/${this.endpoint}ordens-servico/${idOrdemServico}/pecas/${id}`);
  }
}
