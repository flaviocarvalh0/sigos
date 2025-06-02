export interface RespostaApi<T> {
  sucesso: boolean;
  mensagem: string;
  dados?: T;
  erros?: { [key: string]: string[] } | any; // Para erros de validação do ModelState
  status: number;
}
