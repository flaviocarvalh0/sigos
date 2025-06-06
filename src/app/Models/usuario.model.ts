// O modelo Grupo permanece o mesmo que você definiu para o banco
export interface Grupo {
  dataModificacao: string | Date | undefined;
  ativo: any;
  id: number;
  nome: string;
}

// Este é o modelo Usuario como ele provavelmente virá da API (sem a senha)
// e como será usado no FormUsuarioComponent.
// Baseado no seu ApiSigosBase.Models.Usuario e UsuarioRepository.Mapear
export interface Usuario {
  id: number;
  nome: string;
  login: string;
  email: string;
  ativo: boolean;
  senha?: string; // Apenas para envio na criação/atualização, não será retornado pela API list/get
  idEmpresa?: number | null; // No seu .NET é IdEmpresa
  nomeEmpresa?: string | null; // Retornado pelo seu Repository
  // Para grupos, a API de usuário provavelmente não aninhará os grupos diretamente.
  // A atribuição/leitura de grupos pode ser um endpoint separado ou gerenciada no backend
  // ao criar/atualizar usuário. Por ora, vamos omitir `grupos?: Grupo[]` aqui
  // e lidar com isso quando formos implementar a atribuição de grupos no FormUsuarioComponent.
  // Se a API retornar os grupos do usuário em um endpoint separado, precisaremos de um método para buscá-los.

  // Campos de auditoria (se você quiser exibi-los)
  idCriador?: number;
  criadoPor?: string;
  idModificador?: number;
  modificadoPor?: string;
  dataCriacao?: Date;
  dataModificacao?: Date; // No seu .NET, o DTO de atualização usa DataUltimaModificacao
}

// Dados do usuário logado, extraídos do token JWT
export interface UsuarioLogado {
  id: number;       // Geralmente do claim "id" ou "nameidentifier"
  login: string;    // Do claim "login"
  nome: string;     // Do claim "nome"
  email: string; // O token que você gera não inclui email diretamente, mas podemos adicioná-lo
  gruposNomes: string[]; // Precisaremos que a API adicione um claim "roles" ou "grupos" ao token
  exp: number;      // Timestamp de expiração (padrão JWT)
  iat?: number;     // Timestamp de emissão (padrão JWT)
}

// Payload para o endpoint de login da API
export interface LoginPayload {
  login: string; // Corresponde ao LoginDto.Login da API
  senha: string; // Corresponde ao LoginDto.Senha da API
}

// Resposta esperada do endpoint de login da API
// Baseado no seu UsuarioService.Login no .NET que retorna RespostaApi<string> (o token)
export interface LoginResponse {
  sucesso: boolean;
  mensagem: string;
  dados?: string; // O token JWT estará aqui se sucesso for true
  erros?: any;    // Para erros de validação ou outros
  status?: number;
}

// Para os DTOs de criação e atualização de usuário no frontend,
// que serão enviados para a API.
export interface UsuarioCriacaoPayload {
  nome: string;
  email: string;
  login: string;
  senha?: string; // Senha é obrigatória na criação
  ativo: boolean;
  idEmpresa?: number | null;
  // Adicionar `gruposIds: number[]` se a API de criação aceitar IDs de grupos
}

export interface UsuarioAtualizacaoPayload {
  id: number; // Geralmente o ID vai na URL, mas seu DTO de atualização tem
  nome: string;
  email: string;
  login: string;
  senha?: string; // Opcional na atualização
  ativo: boolean;
  idEmpresa?: number | null;
  dataUltimaModificacao?: Date;
}
