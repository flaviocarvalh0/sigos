import { ModelBase } from "../model-base.model";

export interface OrdemServicoServico extends ModelBase {
  id: number;
  idOrdemServico: number;
  idServico: number;
  nomeServico: string;
  precoPraticado: number;
  tempoEstimadoMinutos: number;
  observacao: string | null;

}

export interface OrdemServicoServicoCriacaoPayload {
  idOrdemServico: number;
  idServico: number;
  precoPraticado: number;
  tempoEstimadoMinutos: number;
  observacao: string | null;
}

export interface OrdemServicoServicoAtualizacaoPayload extends OrdemServicoServicoCriacaoPayload {
  id: number;
  dataUltimaModificacao: Date;
}
