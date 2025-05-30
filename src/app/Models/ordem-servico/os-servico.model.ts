export interface OsServico {
  id?: number; // ID do registro na tabela associativa OsServico
  id_os?: number; // FK para OrdemServico (geralmente não precisa no form item, já que está dentro da OS)
  id_servico: number;
  quantidade: number;
  valor_unitario: number;
  valor_total?: number;
}
