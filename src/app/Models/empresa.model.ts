export interface Empresa {
  id: number;
  razaoSocial: string; // API DTO usa RazaoSocial
  nomeFantasia: string; // API DTO usa NomeFantasia
  email?: string | null;
  celular?: string | null;
  ativo: boolean;
  logotipo?: string | null;
  cnpj: string;
  cep?: string | null;
  cidade?: string | null;
  logradouro?: string | null;
  complemento?: string | null;
  numero?: string | null;
  bairro?: string | null;
  pais?: string | null;

  // Campos de auditoria (se retornados e necessários no frontend)
  idCriador?: number | null;
  criadoPor?: string | null;
  idModificador?: number | null;
  modificadoPor?: string | null;
  dataCriacao?: string | Date | null; // API retorna como string, converter para Date se necessário
  dataModificacao?: Date ; // API retorna como string (DataUltimaModificacao)
}

// Payload para criar uma empresa (espelha EmpresaCriacaoDto)
export interface EmpresaCriacaoPayload {
  razaoSocial: string;
  nomeFantasia: string;
  email?: string | null;
  celular?: string | null;
  ativo: boolean;
  logotipo?: string | null;
  cnpj: string;
  cep?: string | null;
  cidade?: string | null;
  logradouro?: string | null;
  complemento?: string | null;
  numero?: string | null;
  bairro?: string | null;
  pais?: string | null;
}

// Payload para atualizar uma empresa (espelha EmpresaAtualizacaoDto)
export interface EmpresaAtualizacaoPayload {
  id: number; // Obrigatório no DTO da API
  razaoSocial: string;
  nomeFantasia: string;
  email?: string | null;
  celular?: string | null;
  ativo: boolean;
  logotipo?: string | null;
  cnpj: string;
  cep?: string | null;
  cidade?: string | null;
  logradouro?: string | null;
  complemento?: string | null;
  numero?: string | null;
  bairro?: string | null;
  pais?: string | null;
  dataUltimaModificacao?: Date; // Obrigatório no DTO da API para concorrência
}
