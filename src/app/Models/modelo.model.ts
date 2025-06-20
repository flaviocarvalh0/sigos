export interface Modelo {
  id: number;
  nome: string;
  idMarca: number;
  nomeMarca?: string;
  dataCriacao?: string;
  dataModificacao?: Date;
  criadoPor?: string;
  modificadoPor?: string;
}

export interface ModeloCriacaoPayload {
  nome: string;
  idMarca: number;
}

export interface ModeloAtualizacaoPayload {
  id: number;
  nome: string;
  idMarca: number;
  dataUltimaModificacao: Date;
}
