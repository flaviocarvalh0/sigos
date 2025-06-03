// prazo-garantia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { PrazoGarantia } from '../Models/prazo_garantia.model';
import { SelectItem } from '../Models/select-item.model';

@Injectable({
  providedIn: 'root'
})
export class PrazoGarantiaService extends CrudService<PrazoGarantia, number> {
  protected readonly apiUrlBase = 'https://localhost:7119/api';
  protected readonly endpoint = 'prazos-garantia';

  constructor(protected override http: HttpClient) {
    super(http);
  }

  obterParaSelecao(): Observable<SelectItem[]> {
    return this.http.get<SelectItem[]>(`${this.endpoint}/selecao`);
  }
}
