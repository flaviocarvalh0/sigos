import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { RespostaApi } from '../Models/reposta-api.model';
import { GrupoUsuario } from '../Models/grupo_usuario.model';

@Injectable({
  providedIn: 'root'
})
export class GrupoUsuarioService {
  private api = 'https://localhost:7119/api/grupos-usuarios';

  constructor(private http: HttpClient) {}

  obterTodos(): Observable<RespostaApi<GrupoUsuario[]>> {
    return this.http.get<RespostaApi<GrupoUsuario[]>>(this.api);
  }

  criarVinculo(vinculo: { idGrupo: number; idUsuario: number }): Observable<RespostaApi<any>> {
    return this.http.post<RespostaApi<any>>(this.api, vinculo);
  }

  criarMultiplos(vinculos: { idGrupo: number; idUsuario: number }[]): Observable<RespostaApi<any>> {
    return this.http.post<RespostaApi<any>>(`${this.api}/multiplos`, vinculos);
  }

  removerVinculos(vinculos: { idGrupo: number; idUsuario: number }[]): Observable<RespostaApi<any>> {
    return this.http.post<RespostaApi<any>>(`${this.api}/remover-varios`, vinculos);
  }
}
