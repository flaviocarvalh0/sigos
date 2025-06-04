// src/app/Models/movimentacao_estoque.model.ts

export interface MovimentacaoEstoque {
  id: number;
  idPeca: number;
  nomePeca?: string | null;
  tipoMovimentacao: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  observacao?: string | null;
  dataMovimentacao?: string | Date | null;

  // Campos de auditoria
  idCriador?: number | null;
  criadoPor?: string | null;
  idModificador?: number | null;
  modificadoPor?: string | null;
  dataCriacao?: string | Date | null;
  dataModificacao?: string | Date | null;
}

export interface MovimentacaoEstoqueCriacaoPayload {
  idPeca: number;
  tipoMovimentacao: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  observacao?: string | null;
  dataMovimentacao?: string | Date | null;
}

export interface MovimentacaoEstoqueAtualizacaoPayload {
  id: number;
  idPeca: number;
  tipoMovimentacao: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  observacao?: string | null;
  dataMovimentacao?: string | Date | null;
  dataUltimaModificacao: string | Date | null;
}
