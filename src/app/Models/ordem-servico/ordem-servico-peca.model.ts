import { ModelBase } from "../model-base.model";


export interface OrdemServicoPeca extends ModelBase {
  idOrdemServico: number;
  idPeca: number;
  quantidade: number;
  valorUnitario: number;
  valorMaoObra?: number;
  valorTotal: number;
  observacao?: string;

  // campos extras de exibição
  nomePeca?: string;
}

export interface OrdemServicoPecaCriacaoPayload {
  idOrdemServico: number;
  idPeca: number;
  quantidade: number;
  valorUnitario: number;
  valorMaoObra: number;
  valorTotal: number;
  observacao?: string;
}

export interface OrdemServicoPecaAtualizacaoPayload extends OrdemServicoPecaCriacaoPayload {
  id: number;
  dataModificacao: Date;
}
