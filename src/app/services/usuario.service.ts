import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';// Importe o CrudService e RespostaApi
import { Usuario, Grupo, UsuarioCriacaoPayload, UsuarioAtualizacaoPayload } from '../Models/usuario.model';
import { CrudService } from './crud.service';
import { RespostaApi } from '../Models/reposta-api.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService extends CrudService<Usuario, number> {

  // apiUrlBase é herdado ou pode ser definido aqui se diferente do CrudService padrão
  // (se CrudService não tiver um apiUrlBase default, defina-o aqui ou no construtor)
  protected override readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'usuarios'; // Endpoint específico para usuários


  constructor(http: HttpClient) {
    super(http); 
  }


  // Sobrescrevendo criar para usar UsuarioCriacaoPayload
  criarUsuario(usuarioData: UsuarioCriacaoPayload): Observable<Usuario> {

    return super.criar(usuarioData as Omit<Usuario, 'id'>);
  }

  atualizarUsuario(id: number, usuarioData: UsuarioAtualizacaoPayload): Observable<Usuario> {
    return this.http.put<RespostaApi<Usuario>>(`${this.fullApiUrl}/${id}`, usuarioData, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          throw new Error(response.mensagem || `Falha ao atualizar usuário ${id}.`);
        }),
        catchError(this.handleError) // handleError é herdado
      );
  }
}
