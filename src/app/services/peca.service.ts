import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud.service';

import { Observable, catchError, map } from 'rxjs';
import { SelectItem } from '../Models/select-item.model';
import { RespostaApi } from '../Models/reposta-api.model';
import { Peca } from '../Models/peca.model';

@Injectable({ providedIn: 'root' })
export class PecaService extends CrudService<Peca, number> {
   protected readonly apiUrlBase = 'https://localhost:7119/api';
  protected readonly endpoint = 'pecas';

  constructor(protected override http: HttpClient) {
    super(http);
  }
}
