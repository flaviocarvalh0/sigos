// src/app/Models/workflow/workflow-estado.model.ts

import { ModelBase, ModelBaseCriacaoAtualizacao } from "../model-base.model";

/**
 * Interface completa para a entidade WorkflowEstado.
 */
export interface WorkflowEstado extends ModelBase {
  nome: string;
  descricao: string;
  idWorkFlow: number;
  nomeWorFlow: string;
  isEstadoInicial: boolean;
}

/**
 * Interface que representa a resposta da API para a rota /selecao-por-workflow.
 * Os nomes das propriedades (idEstado, nomeEstado) correspondem exatamente ao JSON da API.
 */
export interface EstadoApiSelecao {
  idEstado: number;
  nomeEstado: string;
  estadoInicial: boolean;
}

/**
 * Interface genérica para uso em dropdowns (pode ser descontinuada se não for usada em outros locais).
 */
export interface EstadoSelecao {
  id: number;
  descricao: string;
}

// Payloads para criação e atualização
export interface WorkflowEstadoCriacaoPayload extends ModelBaseCriacaoAtualizacao {
  idWorkFlow: number;
  nome: string;
  descricao?: string;
  isEstadoInicial?: boolean;
}

export interface WorkflowEstadoAtualizacaoPayload extends WorkflowEstadoCriacaoPayload {
  id: number;
}
