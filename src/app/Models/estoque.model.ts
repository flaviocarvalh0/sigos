export interface Estoque {
  id?: number;
  quantidade_atual: number;
  quantidade_minima?: number;
  id_peca: number;
  id_usuario_criador?: number;
  id_usuario_modificador?: number;
  data_criacao?: Date;
  data_modificacao?: Date;
}

