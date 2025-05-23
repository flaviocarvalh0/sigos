export interface Servico {
  id?: number;
  nome: string;
  descricao: string;
  duracao: number;
  valor: number;
  id_usuario_criador?: number;
  id_usuario_modificador?: number;
}
