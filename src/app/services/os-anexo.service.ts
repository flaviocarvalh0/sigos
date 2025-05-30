import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface OsAnexoMetadata {
  id: number;
  id_os: number;
  nome_arquivo: string;
  tipo_anexo: string | undefined; // MIME Type
  tamanho_arquivo: number | undefined;
  data_upload: string;
}

@Injectable({
  providedIn: 'root'
})
export class OsAnexoService {
  // Array para armazenar os metadados dos anexos mockados
  private mockAnexosMetadata: OsAnexoMetadata[] = [];
  // Simula o armazenamento temporário do File no mock para o método getOsAnexoConteudo.
  // Em uma API real, o backend lida com o binário.
  private mockFileStorage: Map<number, File> = new Map();
  private nextId = 1;

  constructor() { }

  /**
   * Busca os METADADOS dos anexos de uma Ordem de Serviço específica.
   */
  getAnexosByOsId(osId: number): Observable<OsAnexoMetadata[]> {
    console.log(`[Mock OsAnexoService] Buscando metadados de anexos para OS ID: ${osId}`);
    const anexos = this.mockAnexosMetadata.filter(a => a.id_os === osId);
    return of(anexos).pipe(delay(300));
  }

  /**
   * Busca os METADADOS de um anexo específico pelo seu ID.
   */
  getOsAnexoMetadataById(anexoId: number): Observable<OsAnexoMetadata | undefined> {
    console.log(`[Mock OsAnexoService] Buscando metadados do anexo ID: ${anexoId}`);
    const anexo = this.mockAnexosMetadata.find(a => a.id === anexoId);
    if (!anexo) {
      return throwError(() => new Error(`Metadados do anexo com ID ${anexoId} não encontrados.`));
    }
    return of(anexo).pipe(delay(300));
  }

  /**
   * Simula a criação de um anexo (upload do binário e salvamento dos metadados).
   * @param id_os ID da Ordem de Serviço à qual o anexo pertence.
   * @param arquivo O objeto File selecionado pelo usuário.
   * @param nome_arquivo_customizado (Opcional) Se o usuário puder definir um nome diferente do original.
   * @returns Observable com os metadados do anexo "salvo".
   */
  //createOsAnexo(osId: number, nomeArquivo: string, arquivo: File)
  createOsAnexo(id_os: number, arquivo: File, nome_arquivo_customizado?: string): Observable<OsAnexoMetadata> {
    if (!id_os) {
      return throwError(() => new Error('id_os é obrigatório para criar OsAnexo'));
    }
    if (!arquivo) {
      return throwError(() => new Error('Arquivo (File) é obrigatório para criar OsAnexo'));
    }

    const anexoId = this.nextId++;
    const dataAtual = new Date().toISOString();
    const nomeFinalArquivo = nome_arquivo_customizado || arquivo.name;

    const novoAnexoMetadados: OsAnexoMetadata = {
      id: anexoId,
      id_os: id_os,
      nome_arquivo: nomeFinalArquivo,
      tipo_anexo: arquivo.type,
      tamanho_arquivo: arquivo.size,
      data_upload: dataAtual,
    };

    this.mockAnexosMetadata.push(novoAnexoMetadados);
    this.mockFileStorage.set(anexoId, arquivo); // Armazena o File para o mock de getOsAnexoConteudo

    console.log(`[Mock OsAnexoService] Anexo ID ${anexoId} ("${nomeFinalArquivo}") criado para OS ID ${id_os}. Metadados:`, novoAnexoMetadados);
    return of(novoAnexoMetadados).pipe(delay(700)); // Simula delay de upload
  }

  /**
   * Simula a obtenção do CONTEÚDO binário de um anexo.
   * Em uma API real, este método solicitaria o binário do backend.
   */
  getOsAnexoConteudo(anexoId: number): Observable<Blob> {
    console.log(`[Mock OsAnexoService] Buscando conteúdo do anexo ID: ${anexoId}`);
    const anexoMetadados = this.mockAnexosMetadata.find(a => a.id === anexoId);
    const storedFile = this.mockFileStorage.get(anexoId);

    if (anexoMetadados && storedFile) {
      // Retorna o próprio File como um Blob, que é o mais próximo que o mock pode chegar do binário real.
      // O frontend então usaria isso para criar um link de download.
      console.log(`[Mock OsAnexoService] Retornando conteúdo mockado (Blob do File) para "${anexoMetadados.nome_arquivo}"`);
      return of(storedFile as Blob).pipe(delay(400));
    } else if (anexoMetadados && !storedFile) {
        // Se temos metadados mas não o arquivo (ex: mock antigo), simula um blob de texto.
        console.warn(`[Mock OsAnexoService] Conteúdo do arquivo para anexo ID ${anexoId} não encontrado no storage mockado. Retornando blob de texto genérico.`);
        const mockContent = `Conteúdo simulado para ${anexoMetadados.nome_arquivo}`;
        const blob = new Blob([mockContent], { type: anexoMetadados.tipo_anexo || 'text/plain' });
        return of(blob).pipe(delay(400));
    }
    return throwError(() => new Error(`Anexo com ID ${anexoId} não encontrado para buscar conteúdo.`));
  }

  /**
   * Simula a deleção de um anexo.
   * No backend real, isso removeria os metadados e o binário do arquivo do banco.
   */
  deleteOsAnexo(anexoId: number): Observable<void> {
    console.log(`[Mock OsAnexoService] Deletando anexo ID: ${anexoId}`);
    const index = this.mockAnexosMetadata.findIndex(a => a.id === anexoId);
    if (index > -1) {
      this.mockAnexosMetadata.splice(index, 1);
      this.mockFileStorage.delete(anexoId); // Remove do storage mockado também
      console.log(`[Mock OsAnexoService] Anexo ID ${anexoId} deletado.`);
      return of(undefined).pipe(delay(500));
    }
    return throwError(() => new Error(`Anexo com ID ${anexoId} não encontrado para deleção.`));
  }

  // A atualização de um anexo que envolve a substituição do arquivo binário
  // geralmente é tratada como uma deleção do antigo e criação de um novo.
  // Se for apenas para atualizar metadados (ex: renomear o arquivo no sistema),
  // um método PATCH poderia ser usado.
  // Este mock não implementa a substituição do arquivo, apenas para simplificar.
}
