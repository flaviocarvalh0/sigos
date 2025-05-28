// src/app/models/peca.model.ts
export interface Peca {
  id?: number;
  nome: string;
  preco_custo: number;
  preco_venda: number;
  localizacao_fisica?: string;
  quantidade_minima_estoque?: number;
  quantidade_atual_estoque?: number;
  id_marca?: number;
  id_modelo?: number;
  id_fornecedor?: number;
  id_usuario_criador?: number;
  id_usuario_modificador?: number;
  data_criacao?: Date;
  data_modificacao?: Date;
}