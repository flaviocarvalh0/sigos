import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Empresa, EmpresaCriacaoPayload, EmpresaAtualizacaoPayload } from '../Models/empresa.model';
import { CrudService } from './crud.service';
import { RespostaApi } from '../Models/reposta-api.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService extends CrudService<Empresa, number> {
  // Defina a URL base da sua API.
  protected readonly apiUrlBase = environment.apiUrl;
  protected readonly endpoint = 'empresas';

  constructor(http: HttpClient) {
    super(http);
    console.log(`[EmpresaService] Inicializado para interagir com: ${this.fullApiUrl}`);
  }

  // obterTodos() é herdado e usa GET /api/empresas
  // obterPorId(id: number) é herdado e usa GET /api/empresas/{id}
  // remover(id: number) é herdado e usa DELETE /api/empresas/{id}

  // O método 'criar' da classe base CrudService<Empresa, number> espera Omit<Empresa, 'id'>.
  // EmpresaCriacaoPayload já não tem 'id', então pode ser compatível.
  // A API POST /api/empresas espera um EmpresaCriacaoDto.
  // Se EmpresaCriacaoPayload for idêntico ao DTO, podemos usar super.criar.
  // Caso contrário, sobrescrevemos para garantir o payload correto.
  criarEmpresa(payload: EmpresaCriacaoPayload): Observable<Empresa> {
    // O tipo EmpresaCriacaoPayload já está alinhado com o DTO da API.
    // O CrudService.criar espera Omit<Empresa, 'id'>. Como EmpresaCriacaoPayload não tem id,
    // e os outros campos devem corresponder (após serialização JSON para camelCase),
    // podemos tentar usar o método da classe base com um type assertion.
    return super.criar(payload as Omit<Empresa, 'id'>);
    // Ou, para maior clareza e controle, fazer a chamada HTTP diretamente:
    /*
    return this.http.post<RespostaApi<Empresa>>(`${this.fullApiUrl}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error("Erro ao criar empresa (resposta API):", response.mensagem, response.erros);
          throw new Error(response.mensagem || 'Falha ao criar empresa.');
        }),
        catchError(this.handleError) // handleError é herdado
      );
    */
  }

  // O método 'atualizar' da classe base CrudService<Empresa, number> espera (id, Partial<Empresa> | Empresa).
  // Seu DTO de atualização (EmpresaAtualizacaoPayload) é específico e inclui 'id' e 'dataUltimaModificacao'.
  // É melhor sobrescrever para garantir que o payload correto seja enviado.
  atualizarEmpresa(id: number, payload: EmpresaAtualizacaoPayload): Observable<Empresa> {
    // A API PUT /api/empresas/{id} espera EmpresaAtualizacaoDto no corpo.
    // O 'id' no payload deve corresponder ao 'id' na URL (sua API já valida isso).
    return this.http.put<RespostaApi<Empresa>>(`${this.fullApiUrl}/${id}`, payload, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.sucesso && response.dados) {
            return response.dados;
          }
          console.error(`Erro ao atualizar empresa ${id} (resposta API):`, response.mensagem, response.erros);
          throw new Error(response.mensagem || `Falha ao atualizar empresa ${id}.`);
        }),
        catchError(this.handleError) // handleError é herdado
      );
  }

  // Se você tinha métodos específicos como 'getEmpresas()' no seu serviço mockado original,
  // eles agora são substituídos por 'obterTodos()'.
  // Se precisar de métodos adicionais específicos para Empresa, adicione-os aqui.
  // Ex: obterEmpresaAtiva(): Observable<Empresa | undefined> { ... }
}
