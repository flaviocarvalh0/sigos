import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';// Importe o CrudService e RespostaApi
import { Usuario, Grupo, UsuarioCriacaoPayload, UsuarioAtualizacaoPayload } from '../Models/usuario.model';
import { CrudService } from './crud.service';
import { RespostaApi } from '../Models/reposta-api.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService extends CrudService<Usuario, number> {

  // apiUrlBase é herdado ou pode ser definido aqui se diferente do CrudService padrão
  // (se CrudService não tiver um apiUrlBase default, defina-o aqui ou no construtor)
  protected override readonly apiUrlBase = 'https://localhost:7119/api'; // Se diferente do default no CrudService
  protected readonly endpoint = 'usuarios'; // Endpoint específico para usuários


  constructor(http: HttpClient) {
    super(http); // Chama o construtor da classe base CrudService
    // Se apiUrlBase não for definido na classe CrudService ou aqui,
    // você pode precisar passá-lo para o super() ou definir de outra forma.
    // Assumindo que CrudService espera que apiUrlBase seja definido na classe derivada ou tenha um default.
    // Para este exemplo, vou assumir que você definirá apiUrlBase em CrudService ou aqui.
    // Se CrudService não define apiUrlBase, você pode adicionar:
    // this.apiUrlBase = 'http://localhost:7119/api'; // Defina aqui se necessário
  }

  // Os métodos getUsuarios (agora obterTodos), getUsuarioById (agora obterPorId),
  // deleteUsuario (agora remover) são herdados do CrudService.

  // createUsuario e updateUsuario precisam de atenção especial devido aos DTOs.
  // O CrudService.criar espera Omit<Usuario, 'id'>.
  // O CrudService.atualizar espera Partial<Usuario>.
  // Seus DTOs (UsuarioCriacaoPayload, UsuarioAtualizacaoPayload) são um pouco diferentes.
  // Podemos sobrescrever os métodos ou ajustar os payloads antes de chamar super.

  // Sobrescrevendo criar para usar UsuarioCriacaoPayload
  criarUsuario(usuarioData: UsuarioCriacaoPayload): Observable<Usuario> {
    // O endpoint POST da sua API /api/usuarios espera UsuarioCriacaoDto
    // A classe base CrudService.criar já faz POST para this.fullApiUrl
    // Se UsuarioCriacaoPayload for compatível com o que o backend espera (sem 'id'),
    // podemos chamar o método da classe base.
    // Se precisar de mapeamento específico, faça aqui.
    // Assumindo que UsuarioCriacaoPayload é o que a API espera no corpo.
    return super.criar(usuarioData as Omit<Usuario, 'id'>); // Faz cast se necessário ou mapeia
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
