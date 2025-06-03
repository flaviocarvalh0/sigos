export interface Peca {
  id: number;
  nome: string;
  localizacaoFisica: string;
  idCategoria: number;
  idMarca: number;
  idModelo: number;
  quantidadeMinimaEstoque: number;
  quantidadeEstoque: number;
  precoCusto: number;
  precoVenda: number;
  idFornecedor: number;
  nomeCategoria?: string;
  nomeMarca?: string;
  nomeModelo?: string;
  criadoPor?: string;
  modificadoPor?: string;
  dataCriacao?: Date;
  dataModificacao?: Date;
}

export interface PecaCriacaoPayload {
  nome: string;
  localizacaoFisica?: string;
  idCategoria: number;
  idMarca: number;
  idModelo: number;
  quantidadeMinimaEstoque: number;
  precoCusto: number;
  precoVenda: number;
  idFornecedor: number;
}

export interface PecaAtualizacaoPayload extends PecaCriacaoPayload {
  id: number;
  dataUltimaModificacao?: Date;
}
