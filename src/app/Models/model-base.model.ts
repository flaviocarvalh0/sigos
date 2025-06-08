export class ModelBase {
  id: number | undefined; // Adicionando o ID que é comum a todas as entidades
  criadoPor?: string;
  modificadoPor?: string;
  dataCriacao?: Date;
  dataModificacao?: Date;
}

export class ModelBaseCriacaoAtualizacao {
  dataModificacao?: Date;
}
