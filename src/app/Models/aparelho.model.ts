// src/app/models/aparelho.model.ts
export interface Aparelho {
  id?: number;
  imei_1?: string;
  imei_2?: string;
  cor?: string;
  observacoes?: string;
  id_cliente: number;
  id_usuario_criador?: number;
  id_usuario_modificador?: number;
  id_modelo: number;
  id_marca: number;
}
