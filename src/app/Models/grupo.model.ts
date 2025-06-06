// src/app/Models/grupo.model.ts
export interface Grupo {
  id: number;
  nome: string;
  ativo: boolean;
  idCriador?: number;
  criadoPor?: string;
  dataCriacao?: Date | string; // API pode retornar string, bom tratar
  idModificador?: number;
  modificadoPor?: string;
  dataModificacao?: Date | string; // API pode retornar string
}

export interface GrupoCriacaoPayload {
  nome: string;
  ativo: boolean;
}

export interface GrupoAtualizacaoPayload {
  id: number;
  nome: string;
  ativo: boolean;
  dataUltimaModificacao: Date | string; // Nome do DTO da API é DataUltimaModificacao
}

// Para o endpoint ObterParaSelecao() que retorna SelectItemDto
export interface GrupoSelecao { // Equivalente ao SelectItemDto da API
  id: number;
  descricao: string;
}
