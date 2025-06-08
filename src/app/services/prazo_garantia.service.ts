// prazo-garantia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { PrazoGarantia } from '../Models/prazo-garantia.model';
import { SelectItem } from '../Models/select-item.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrazoGarantiaService extends CrudService<PrazoGarantia, number> {
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'prazos-garantia';

  constructor(protected override http: HttpClient) {
    super(http);
  }
}
