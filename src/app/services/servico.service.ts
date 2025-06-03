// src/app/services/servico.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { RespostaApi } from '../Models/reposta-api.model'; // Ajuste o path se necessário
import { CrudService } from './crud.service';
import { Servico, ServicoAtualizacaoPayload, ServicoCriacaoPayload } from '../Models/servico.mode';
   // Ajuste o path para seu CrudService

@Injectable({
  providedIn: 'root'
})
export class ServicoService extends CrudService<Servico, number> {
  // Definindo as propriedades abstratas da classe base
  protected readonly apiUrlBase = 'https://localhost:7119/api'; // Ajuste a URL/porta da sua API
  protected readonly endpoint = 'servicos'; // Assumindo que o endpoint da API para Servico será "servicos"

  constructor(http: HttpClient) {
    super(http); // Chama o construtor da classe base
    console.log(`[ServicoService] Inicializado para interagir com: ${this.fullApiUrl}`);
  }

  // O método obterPorId(id: number): Observable<Servico | undefined> é herdado.
  // O método obterTodos(queryParams?): Observable<Servico[]> é herdado.
  // O método remover(id: number): Observable<void> é herdado.

  // Sobrescrevendo 'criar' para usar o payload específico ServicoCriacaoPayload.
  // A C# ServicoService.Criar espera uma entidade 'Servico', mas o controller provavelmente
  // mapearia um 'ServicoCriacaoDto' para 'Servico'. Nosso payload Angular corresponde ao DTO.
  override criar(payload: ServicoCriacaoPayload): Observable<Servico> {
    return this.http.post<RespostaApi<Servico>>(`${this.fullApiUrl}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados; // O backend retorna a entidade Servico criada
          }
          console.error("Erro ao criar serviço (resposta API):", response.mensagem, response.erros);
          // A mensagem de erro e os erros de validação (se houver) virão da RespostaApi
          throw new Error(response.mensagem || 'Falha ao criar serviço.');
        }),
        catchError(this.handleError) // Reutiliza o handleError da classe base CrudService
      );
  }

  // Sobrescrevendo 'atualizar' para usar o payload específico ServicoAtualizacaoPayload.
  // Este payload inclui 'dataUltimaModificacao' para controle de concorrência.
  override atualizar(id: number, payload: ServicoAtualizacaoPayload): Observable<Servico> {
    return this.http.put<RespostaApi<Servico>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados; // O backend retorna a entidade Servico atualizada
          }
          // O handleError da classe base CrudService já trata erros HTTP, incluindo 409 (Conflito)
          // se o backend retornar esse status com uma RespostaApi correspondente.
          // A mensagem de erro "Os dados foram modificados por outro usuário..." virá em response.mensagem.
          console.error(`Erro ao atualizar serviço ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao atualizar serviço ${id}.`);
        }),
        catchError(this.handleError) // Reutiliza o handleError da classe base CrudService
      );
  }

  // Se houver métodos específicos para 'Servico' que não são CRUD genéricos,
  // eles podem ser adicionados aqui. Por exemplo, se você tivesse um endpoint
  // para buscar serviços ativos:
  // obterServicosAtivos(): Observable<Servico[]> {
  //   return this.obterTodos({ ativo: true }); // Utiliza o queryParams do CrudService.obterTodos
  // }
}