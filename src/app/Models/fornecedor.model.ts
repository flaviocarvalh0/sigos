export interface Fornecedor {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null; // No seu DTO .NET é 'Estado', manter consistência ou garantir mapeamento
  cep?: string | null;
  pais?: string | null;
  ativo: boolean;

  // Campos de auditoria (se retornados e necessários no frontend)
  idCriador?: number | null;
  criadoPor?: string | null;
  idModificador?: number | null;
  modificadoPor?: string | null;
  dataCriacao?: string | Date | null;
  dataModificacao?:  Date; // No DTO .NET de atualização é DataUltimaModificacao
}

// Payload para criar um fornecedor (espelha FornecedorCriacaoDto)
export interface FornecedorCriacaoPayload {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  pais?: string | null;
  ativo: boolean;
}

// Payload para atualizar um fornecedor (espelha FornecedorAtualizacaoDto)
export interface FornecedorAtualizacaoPayload {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  pais?: string | null;
  ativo: boolean;
  dataUltimaModificacao?:  Date; // Conforme FornecedorAtualizacaoDto
}