// prazo-garantia.model.ts

export interface PrazoGarantia {
  id: number;
  prazoEmDias: number;
  descricao: string;
  ativo: boolean;
  dataCriacao?: Date;
  dataModificacao?: Date;
  criadoPor?: string;
  modificadoPor?: string;
}

export interface PrazoGarantiaCriacao {
  prazoEmDias: number;
  descricao: string;
  ativo: boolean;
}

export interface PrazoGarantiaAtualizacao {
  id: number;
  prazoEmDias: number;
  descricao: string;
  ativo: boolean;
  dataUltimaModificacao: Date;
}

export interface SelectItemDto {
  id: number;
  descricao: string;
}
