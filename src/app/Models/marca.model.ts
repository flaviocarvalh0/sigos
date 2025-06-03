// src/app/Models/marca.model.ts

export interface Marca {
  id: number;
  nome: string;

  // Campos herdados de ModelBase (conforme Marca.cs e MarcaRepository.cs)
  idCriador?: number | null;
  criadoPor?: string | null;
  idModificador?: number | null;
  modificadoPor?: string | null;
  dataCriacao?: string | Date | null;
  dataModificacao?: string | Date | null; // Essencial para controle de concorrência
}

export interface MarcaCriacaoPayload {
  nome: string;
}

export interface MarcaAtualizacaoPayload {
  id: number; // O ID também é necessário no payload para o DTO de atualização C#
  nome: string;
  dataUltimaModificacao: string | Date | null; // Chave para controle de concorrência
}