import { ModelBase } from "../model_base.model";

export interface OrdemServico extends ModelBase {
  codigo: string;
  valorTotal: number;
  dataRetirada: Date | null;
  dataExecucao: Date | null;
  dataConclusao: Date | null;
  descricaoProblema: string;
  diagnosticoTecnico: string;
  observacoes: string;
  dataInicioGarantia: Date | null;
  dataFimGarantia: Date | null;
  idPrazoGarantia: number;
  descricaoPrazoGarantia: string;
  idCliente: number;
  nomeCliente: string;
  idAparelho: number;
  descricaoAparelho: string;
  idEmpresa: number;
  nomeEmpresa: string;
  pagamentoRealizado: boolean;
  formaPagamento: string;
  valorServicos: number;
  valorPecas: number;
  idEstado: number;
  nomeEstado: string;
  idAtendente: number;
  nomeAtendente: string;
  idTecnico: number;
  nomeTecnico: string;
  idWorkflow: number;
}

export class OrdemServicoCriacaoPayload {
  descricaoProblema!: string;
  observacoes?: string;
  idCliente!: number;
  idAparelho!: number;
  idPrazoGarantia!: number;
  idEstado!: number;
  idAtendente!: number;
  idTecnico!: number;
  // Adicione outros campos que são enviados na criação, se houver.
}

export class OrdemServicoAtualizacaoPayload extends OrdemServicoCriacaoPayload {
  id!: number;
  dataUltimaModificacao!: Date;
  // Campos que podem ser atualizados e não estão na criação
  diagnosticoTecnico?: string;
  pagamentoRealizado?: boolean;
  formaPagamento?: string;
  valorServicos?: number;
  valorPecas?: number;
}
