// src/app/services/movimentacao_estoque.service.ts

import { Injectable } from '@angular/core';

import { CrudService } from './crud.service';

import { HttpClient } from '@angular/common/http';
import { MovimentacaoEstoque } from '../Models/movimento_estoque.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovimentacaoEstoqueService extends CrudService<MovimentacaoEstoque, number> {
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'movimentacoes-estoque';

  constructor(http: HttpClient) {
    super(http);
  }
}
