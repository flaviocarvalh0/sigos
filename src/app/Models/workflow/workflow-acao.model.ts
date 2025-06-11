// src/app/Models/workflow/workflow-acao.model.ts

import { ModelBase } from "../model-base.model";

/**
 * Interface completa para a entidade WorkFlowAcao.
 */
export interface WorkFlowAcao extends ModelBase {
  nome: string;
  descricao: string;
  idWorkFlow: number;
  nomeWorFlow: string;
}

/**
 * Payload para a criação de uma nova Ação de workflow.
 */
export interface WorkFlowAcaoCriacaoPayload {
  idWorkFlow: number;
  nome: string;
  descricao?: string;
}

/**
 * Payload para a atualização de uma Ação de workflow existente.
 */
export interface WorkFlowAcaoAtualizacaoPayload extends WorkFlowAcaoCriacaoPayload {
  id: number;
}

export interface AcaoSelecao {
  id: number;
  descricao: string;
}
