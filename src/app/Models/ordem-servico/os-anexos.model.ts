export interface OsAnexo {
  id?: number;
  id_os?: number;
  nome_arquivo: string;
  stream_anexo: File | null; // Usado pelo formulário para capturar o arquivo do usuário
  data_upload?: string;
}
