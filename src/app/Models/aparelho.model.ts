// src/app/Models/aparelho.model.ts

export interface Aparelho {
  id: number;
  imei1: string;
  imei2?: string | null;
  numeroSerie: string;
  cor: string;
  descricaoAuxiliar?: string | null;
  observacoes?: string | null;
  idCliente: number;
  nomeCliente?: string | null; // Fornecido pelo backend em listagens/detalhes
  idMarca: number;
  nomeMarca?: string | null;   // Fornecido pelo backend em listagens/detalhes
  idModelo: number;
  nomeModelo?: string | null;  // Fornecido pelo backend em listagens/detalhes

  // Campos herdados de ModelBase (presentes no AparelhoCelular.cs)
  idCriador?: number | null;
  criadoPor?: string | null;
  idModificador?: number | null;
  modificadoPor?: string | null;
  dataCriacao?: string | Date | null;
  dataModificacao?: string | Date | null; // Essencial para controle de concorrência
}

export interface AparelhoCriacaoPayload {
  imei1: string;
  imei2?: string | null;
  numeroSerie: string;
  cor: string;
  descricaoAuxiliar?: string | null;
  observacoes?: string | null;
  idCliente: number;
  idMarca: number;
  idModelo: number;
}

export interface AparelhoAtualizacaoPayload {
  id: number; // O ID também é enviado no corpo para o DTO de atualização
  imei1: string;
  imei2?: string | null;
  numeroSerie: string;
  cor: string;
  descricaoAuxiliar?: string | null;
  observacoes?: string | null;
  idCliente: number;
  idMarca: number;
  idModelo: number;
  dataUltimaModificacao: string | Date | null; // Chave para controle de concorrência
}
