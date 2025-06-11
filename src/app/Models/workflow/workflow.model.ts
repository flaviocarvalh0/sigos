import { ModelBase, ModelBaseCriacaoAtualizacao } from "../model-base.model";

export interface Workflow extends ModelBase{
  id: number;
  nome: string;
  descricao: string;
  nomeTabela: string;
  isPadrao?: boolean
}

export interface WorkflowCriacaoPayload extends ModelBaseCriacaoAtualizacao {
  nome: string;
  descricao: string;
  nomeTabela: string;
  isPadrao?: boolean
}

export interface WorkflowAtualizacaoPayload extends ModelBaseCriacaoAtualizacao {
  id: number;
  nome: string;
  descricao?: string;
  nomeTabela: string;
  isPadrao?: boolean
}
