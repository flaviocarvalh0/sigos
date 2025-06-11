import { ModelBase, ModelBaseCriacaoAtualizacao } from "../model-base.model";

export interface WorkflowEstado extends ModelBase {
  nome: string;
  descricao: string;
  idWorkFlow: number;
  nomeWorFlow: string;
  isEstadoInicial: boolean;
}

export interface WorkflowEstadoCriacaoPayload extends ModelBaseCriacaoAtualizacao {
  idWorkFlow: number;
  nome: string;
  descricao?: string;
  isEstadoInicial?: boolean;
}

export interface WorkflowEstadoAtualizacaoPayload extends ModelBaseCriacaoAtualizacao {
  id: number;
  idWorkFlow: number;
  nome: string;
  descricao?: string;
  isEstadoInicial?: boolean;
}


export interface EstadoSelecao {
  id: number;
  descricao: string;
}
