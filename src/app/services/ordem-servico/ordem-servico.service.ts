
// src/app/services/service-order.service.ts
import { Injectable } from '@angular/core';
import { of, Observable, delay } from 'rxjs';
import { CrudService } from '../crud.service';
import { OrdemServico } from '../../Models/ordem-servico/ordem-servico.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrdemServicoService extends CrudService<OrdemServico, number> {
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'ordens-servico';

  constructor(http: HttpClient) {
    super(http);
  }
}
