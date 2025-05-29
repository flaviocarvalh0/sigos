// src/app/models/service-order.model.ts
export interface OrdemServico {
  id: number;
  codigo: string;
  status: string;
  valor_total: number;
  data_retirada: Date | null;
  data_execucao: Date | null;
  data_conclusao: Date | null;
  relato_do_problema: string;
  relato_tecnico: string | null;
  observacoes: string | null;
  data_expiracao_garantia: Date | null;
  data_criacao: Date;
  id_prazo_garantia: number | null;
  id_cliente: number;
  id_aparelho: number;
  id_empresa: number;
  id_usuario_criador: number;
  id_usuario_modificador: number;
  data_modificacao: Date;

  // Campos adicionais para exibição (não estão no banco)
  cliente_nome?: string;
  aparelho_descricao?: string;
  empresa_nome?: string;
}