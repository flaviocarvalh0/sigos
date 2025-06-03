// src/app/models/categoria.model.ts

export interface Categoria {
  id: number;
  nome: string;
  criadoPor?: string;
  modificadoPor?: string;
  dataCriacao?: Date;
  dataModificacao?: Date;
}

export interface CategoriaCriacaoPayload {
  nome: string;
}

export interface CategoriaAtualizacaoPayload {
  id: number;
  nome: string;
  dataUltimaModificacao?: Date;
}
