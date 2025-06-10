export interface Anexo {
  id: number;
  entidadeTipo: string;
  entidadeId: number;
  nomeArquivo: string;
  tipoArquivo: string;
  titulo?: string;
  legenda?: string;
  observacoes?: string;
  dataCriacao: Date;
  dataModificacao?: Date;
  idCriador?: number;
  idModificador?: number;
}

export interface AnexoCriacaoPayload {
  entidadeTipo: string;
  entidadeId: number;
  nomeArquivo: string;
  tipoArquivo: string;
  arquivoStream: string; // Conteúdo do arquivo em Base64
  titulo?: string;
  legenda?: string;
  observacoes?: string;
}

export interface AnexoAtualizacaoPayload {
  id: number;
  titulo?: string;
  legenda?: string;
  observacoes?: string;
  // A API precisa da data para controle de concorrência
  dataUltimaModificacao: Date;
}

export interface AnexoEdicaoSimplesPayload {
  id: number;
  dataUltimaModificacao: Date;
  titulo?: string;
  legenda?: string;
  observacoes?: string;
}
