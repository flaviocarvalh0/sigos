// src/app/Models/servico.model.ts

export interface Servico {
  id: number;
  nome: string;
  descricao?: string | null;
  precoPadrao?: number | null; // Corresponde a decimal? no C#
  tempoEstimadoMinutos?: number | null;
  ativo: boolean;

  // Campos herdados de ModelBase (conforme Servico.cs e ServicoRepository.cs)
  idCriador?: number | null;
  criadoPor?: string | null;
  idModificador?: number | null;
  modificadoPor?: string | null;
  dataCriacao?: string | Date | null;
  dataModificacao?: Date | null; // Essencial para controle de concorrência
}

export interface ServicoCriacaoPayload {
  nome: string;
  descricao?: string | null;
  precoPadrao?: number | null;
  tempoEstimadoMinutos?: number | null;
  ativo?: boolean; // No DTO C#, default é true
}

export interface ServicoAtualizacaoPayload {
  id: number; // O ID também é necessário no payload para o DTO de atualização C#
  nome: string;
  descricao?: string | null;
  precoPadrao?: number | null;
  tempoEstimadoMinutos?: number | null;
  ativo: boolean;
  dataUltimaModificacao?: Date | null; // Chave para controle de concorrência
}
