import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Cliente, ClienteCriacaoPayload, ClienteAtualizacaoPayload } from '../Models/cliente.model';

import { Aparelho } from '../Models/aparelho.model'; // Se o buscarPorCliente do AparelhoService for movido para cá ou referenciado
import { CrudService } from './crud.service';
import { RespostaApi } from '../Models/reposta-api.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService extends CrudService<Cliente, number> {
  protected readonly apiUrlBase = 'https://localhost:7119/api'; // <<--- AJUSTE SE NECESSÁRIO
  protected readonly endpoint = 'clientes'; // Conforme seu ClienteController

  constructor(http: HttpClient) {
    super(http);
    console.log(`[ClienteService] Inicializado para interagir com: ${this.fullApiUrl}`);
  }

  // obterTodos() é herdado (era getClientes/listar) -> GET /api/clientes
  // obterPorId(id: number) é herdado (era getClienteById) -> GET /api/clientes/{id}
  // remover(id: number) é herdado (era deleteCliente) -> DELETE /api/clientes/{id}

  // Sobrescrevendo criar para usar ClienteCriacaoPayload (que mapeia para PessoaViewModel da API).
  criarCliente(payload: ClienteCriacaoPayload): Observable<Cliente> {
    // A API POST /api/clientes espera PessoaViewModel.
    // O CrudService.criar espera Omit<Cliente, 'id'>.
    // Se ClienteCriacaoPayload for compatível com o que a API espera no corpo,
    // e o retorno for um Cliente, podemos usar super.criar com um cast ou mapeamento.
    // Como PessoaViewModel é o DTO de entrada e Cliente é o modelo de retorno,
    // uma chamada http direta aqui é mais clara.
    return this.http.post<RespostaApi<Cliente>>(`${this.fullApiUrl}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados; // A API retorna o Cliente criado
          }
          console.error("Erro ao criar cliente (resposta API):", response.mensagem, response.erros);
          // Tentar extrair erros de validação do ModelState se existirem
          let errorMsg = response.mensagem || 'Falha ao criar cliente.';
          if (response.erros && typeof response.erros === 'object') {
            const validationErrors = [];
            for (const key in response.erros) {
              if (response.erros.hasOwnProperty(key) && Array.isArray(response.erros[key])) {
                validationErrors.push(`${key}: ${response.erros[key].join(', ')}`);
              }
            }
            if (validationErrors.length > 0) errorMsg = validationErrors.join('; ');
          }
          throw new Error(errorMsg);
        }),
        catchError(this.handleError) // handleError é herdado
      );
  }

  // Sobrescrevendo atualizar para usar ClienteAtualizacaoPayload.
  atualizarCliente(id: number, payload: ClienteAtualizacaoPayload): Observable<Cliente> {
    // A API PUT /api/clientes/{id} espera ClienteAtualizacaoDto.
    return this.http.put<RespostaApi<Cliente>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error(`Erro ao atualizar cliente ${id} (resposta API):`, response.mensagem, response.erros);
           let errorMsg = response.mensagem || `Falha ao atualizar cliente ${id}.`;
          if (response.erros && typeof response.erros === 'object') {
            const validationErrors = [];
            for (const key in response.erros) {
              if (response.erros.hasOwnProperty(key) && Array.isArray(response.erros[key])) {
                validationErrors.push(`${key}: ${response.erros[key].join(', ')}`);
              }
            }
            if (validationErrors.length > 0) errorMsg = validationErrors.join('; ');
          }
          throw new Error(errorMsg);
        }),
        catchError(this.handleError)
      );
  }

  // Manter o método buscarPorCliente se o AparelhoService depender dele ou se for usado em outro lugar.
  // Se AparelhoService tem seu próprio buscarPorCliente, este pode ser removido.
  // No entanto, este método não existe no seu ClienteService.cs (API).
  // A busca de aparelhos por cliente deve ser feita pelo AparelhoService.
  // public buscarPorCliente(clienteId: number): Observable<Aparelho[]> {
  //   // Este endpoint precisaria existir na API, ex: GET /api/clientes/{clienteId}/aparelhos
  //   // Ou o AparelhoService tem um GET /api/aparelhos?clienteId={clienteId}
  //   console.warn('Método buscarPorCliente no ClienteService não implementado para API real.');
  //   return of([]); // Placeholder
  // }
}