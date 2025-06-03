export interface Cliente {
  id: number;
  nomeCompleto: string; // No .NET é NomeCompleto
  apelido?: string | null; // No .NET é Apelido (string, não string?)
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  tipoPessoa: string; // No .NET é TipoPessoa
  cpf?: string | null;
  cnpj?: string | null;
  pais?: string | null;
  uf?: string | null; // No .NET é UF
  cidade?: string | null;
  cep?: string | null;
  bairro?: string | null;
  complemento?: string | null;
  logradouro?: string | null;
  numero?: string | null;

  // Campos de auditoria (se retornados pela API e você quiser usar)
  idCriador?: number | null;
  criadoPor?: string | null;
  idModificador?: number | null;
  modificadoPor?: string | null;
  dataCriacao?: string | Date | null;
  dataModificacao?:  Date; // No DTO de atualização .NET é DataUltimaModificacao
}

// Payload para criar um cliente (espelha PessoaViewModel da API)
// PessoaViewModel tem algumas validações que não são diretamente transpostas para cá,
// mas os nomes dos campos devem corresponder.
export interface ClienteCriacaoPayload {
  nomeCompleto: string;
  apelido?: string | null;
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  tipoPessoa: string; // 'Física' ou 'Jurídica'
  cpf?: string | null; // Enviar apenas se tipoPessoa for 'Física'
  cnpj?: string | null; // Enviar apenas se tipoPessoa for 'Jurídica'
  pais?: string | null;
  uf?: string | null;
  cidade?: string | null;
  cep?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  // O seu DTO PessoaViewModel não tem 'ativo'. O Cliente.cs não tem 'ativo'.
  // Mas o FormClienteComponent.ts tem 'ativo'. Se for necessário, adicione ao DTO/Modelo backend.
  // ativo?: boolean; // Se for necessário
}

// Payload para atualizar um cliente (espelha ClienteAtualizacaoDto da API)
export interface ClienteAtualizacaoPayload {
  id: number;
  nomeCompleto: string;
  apelido?: string | null; // No DTO C# Apelido é string, não string?
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  tipoPessoa: string;
  cpf?: string | null;
  cnpj?: string | null;
  pais?: string | null;
  uf?: string | null;
  cidade?: string | null;
  cep?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  // O DTO ClienteAtualizacaoDto não tem 'ativo'. Se for necessário, adicione.
  // ativo?: boolean;
  dataUltimaModificacao?:  Date; // Conforme ClienteAtualizacaoDto
}