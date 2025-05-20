export interface Empresa {
  id?: number;
  razao_social: string;
  nome_fantasia: string;
  email?: string;
  celular?: string;
  ativo?: boolean;
  logotipo?: string;
  cnpj: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  logradouro?: string;
  complemento?: string;
  numero?: string;
  bairro?: string;
  pais?: string;
}
