import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Anexo, AnexoCriacaoPayload, AnexoAtualizacaoPayload, AnexoEdicaoSimplesPayload } from '../../Models/ordem-servico/os-anexos.model';
import { environment } from '../../environments/environment';

// Função para converter uma string Base64 para um objeto Blob
function b64toBlob(b64Data: string, contentType = '', sliceSize = 512): Blob {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

@Injectable({
  providedIn: 'root'
})
export class AnexoService {
  private apiUrl = `${environment.apiUrl}/anexos`;

  constructor(private http: HttpClient) { }

  // Retorna os metadados dos anexos
  obterAnexosPorEntidade(entidadeTipo: string, entidadeId: number): Observable<Anexo[]> {
    return this.http.get<{ dados: Anexo[] }>(`${this.apiUrl}/entidade/${entidadeTipo}/${entidadeId}`)
      .pipe(map(response => response.dados || []));
  }

  // Retorna o conteúdo do arquivo (Base64) como um Blob para download
  downloadAnexo(anexoId: number, tipoArquivo: string): Observable<Blob> {
    return this.http.get<{ dados: string }>(`${this.apiUrl}/${anexoId}/conteudo`).pipe(
      map(response => {
        if (!response.dados) throw new Error('Conteúdo do arquivo não recebido.');
        return b64toBlob(response.dados, tipoArquivo);
      })
    );
  }

   atualizarDadosSimplesAnexo(payload: AnexoEdicaoSimplesPayload): Observable<Anexo> {
    // Usando http.patch e enviando para a sub-rota 'dados-simples'
    return this.http.patch<{ dados: Anexo }>(`${this.apiUrl}/dados-simples`, payload)
      .pipe(map(response => response.dados));
  }
  // Cria um novo anexo
  criarAnexo(payload: AnexoCriacaoPayload): Observable<Anexo> {
    return this.http.post<{ dados: Anexo }>(this.apiUrl, payload)
      .pipe(map(response => response.dados));
  }

  // Atualiza metadados de um anexo existente
  atualizarAnexo(id: number, payload: AnexoAtualizacaoPayload): Observable<Anexo> {
    return this.http.put<{ dados: Anexo }>(`${this.apiUrl}/${id}`, payload)
      .pipe(map(response => response.dados));
  }

  // Remove um anexo
  removerAnexo(anexoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${anexoId}`);
  }
}
