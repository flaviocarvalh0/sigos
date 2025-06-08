import { ModelBase } from "../model-base.model";

export interface OrdemServico extends ModelBase {
  codigo?: string;
  valorTotal?: number;
  dataRetirada?: Date | null;
  dataExecucao?: Date | null;
  dataConclusao?: Date | null;
  descricaoProblema: string;
  diagnosticoTecnico?: string;
  observacoes?: string;
  dataInicioGarantia?: Date | null;
  dataFimGarantia?: Date | null;
  idPrazoGarantia?: number;
  idCliente: number;
  idAparelho: number;
  idEmpresa?: number;
  idEstado? : number;
  idWorkflow? : number;
  pagamentoRealizado?: boolean;
  formaPagamento?: string;
  valorServicos?: number;
  valorPecas?: number;
  idAtendente: number;
  idTecnico: number;

  // Campos extras de exibição
  nomeCliente?: string;
  descricaoAparelho?: string;
  nomeEmpresa?: string;
  nomeEstado?: string;
  nomeAtendente?: string;
  nomeTecnico?: string;
  descricaoPrazoGarantia?: string;
}

export interface OrdemServicoCriacaoPayload {
  codigo?: string;
  valorTotal?: number;
  dataRetirada?: Date | null;
  dataExecucao?: Date | null;
  dataConclusao?: Date | null;
  descricaoProblema: string;
  diagnosticoTecnico?: string;
  observacoes?: string;
  dataInicioGarantia?: Date | null;
  dataFimGarantia?: Date | null;
  idPrazoGarantia?: number;
  idCliente: number;
  idAparelho: number;
  idEmpresa?: number;
  pagamentoRealizado?: boolean;
  formaPagamento?: string;
  valorServicos?: number;
  valorPecas?: number;
  idAtendente: number;
  idTecnico: number;
}

export interface OrdemServicoAtualizacaoPayload extends OrdemServicoCriacaoPayload {
  id: number;
  dataUltimaModificacao: Date;
  idEstado?: number;
  idWorkflow? : number;
}
