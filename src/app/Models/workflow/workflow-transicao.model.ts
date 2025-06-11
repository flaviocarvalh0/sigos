import { ModelBase } from "../model-base.model";

export interface TransicaoDisponivel {
  idAcao: number;
  nomeAcao: string;
  idEstadoDestino: number;
  nomeEstadoDestino: string;
}

export interface WorkFlowTransicao extends ModelBase {
  idWorkFlow: number;
  nomeWorFlow: string;
  idEstadoOrigem: number;
  nomeEstadoOrigem: string;
  idAcao: number;
  nomeAcao: string;
  idEstadoDestino: number;
  nomeEstadoDestino: string;
}

/**
 * Payload para a criação de uma nova Transição de workflow.
 */
export interface WorkFlowTransicaoCriacaoDto {
  idWorkFlow: number;
  idEstadoOrigem: number;
  idAcao: number;
  idEstadoDestino: number;
}
