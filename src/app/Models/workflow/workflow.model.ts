import { ModelBase, ModelBaseCriacaoAtualizacao } from "../model_base.model";

export interface Workflow extends ModelBase{
  id: number;
  nome: string;
  descricao: string;
}

export interface WorkflowCriacaoPayload extends ModelBaseCriacaoAtualizacao {
  nome: string;
  descricao?: string;
}

export interface WorkflowAtualizacaoPayload extends ModelBaseCriacaoAtualizacao {
  id: number;
  nome: string;
  descricao?: string;
}
