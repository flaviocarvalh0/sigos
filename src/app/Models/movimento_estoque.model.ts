export interface MovimentacaoEstoque {
  id?: number;
  quantidade: number;
  data: Date;
  tipo_de_movimentacao: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  id_peca: number;
  id_usuario_criador?: number;
  id_usuario_modificador?: number;
  data_criacao?: Date;
  data_modificacao?: Date;
}

