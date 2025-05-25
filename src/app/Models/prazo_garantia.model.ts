export interface PrazoGarantia {
  id?: number;
  quantidade_de_dias: number;
  ativo: boolean; 
  descricao: string;
  id_usuario_criador?: number;
  id_usuario_modificador?: number;
  data_criacao?: Date;
  data_modificacao?: Date;
}
