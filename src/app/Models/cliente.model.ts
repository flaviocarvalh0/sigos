export interface Cliente {
  id?: number;
  nome_completo: string;
  apelido?: string;
  cep?: string;
  telefone: string;
  tipo_de_pessoa?: string;
  id_usuario_criador?: number;
  id_usuario_modificador: number;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  pais?: string;
  uf?: string;
  complemento?: string;
  celular?: string;
  email?: string;
  ativo?: boolean;
  cpf?: string;
  cidade?: string;
}
