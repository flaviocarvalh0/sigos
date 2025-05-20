import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Fornecedor } from '../Models/fornecedor.model';
// ajuste o caminho conforme seu projeto

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {

  private fornecedores: Fornecedor[] = [
    {
      id: 1,
      nome: 'Fornecedor Exemplo',
      cep: '12345-678',
      celular: '(11) 99999-9999',
      id_usuario_criador: 1,
      id_usuario_modificador: 1,
      telefone: '(11) 3333-4444',
      email: 'exemplo@fornecedor.com',
      logradouro: 'Rua Exemplo',
      bairro: 'Bairro Exemplo',
      cidade: 'Cidade Exemplo',
      numero: '100',
      pais: 'Brasil',
      complemento: 'Complemento exemplo'
    }
  ];

  constructor() { }

  listar(): Observable<Fornecedor[]> {
    return of(this.fornecedores);
  }

  getById(id: number): Observable<Fornecedor> {
    const fornecedor = this.fornecedores.find(f => f.id === id);
    if (fornecedor) {
      return of(fornecedor);
    } else {
      return throwError(() => new Error('Fornecedor não encontrado'));
    }
  }

  adicionar(fornecedor: Fornecedor): Observable<Fornecedor> {
    const novoId = this.fornecedores.length > 0 ? Math.max(...this.fornecedores.map(f => f.id!)) + 1 : 1;
    fornecedor.id = novoId;
    this.fornecedores.push(fornecedor);
    return of(fornecedor);
  }

  atualizar(id: number, fornecedorAtualizado: Fornecedor): Observable<Fornecedor> {
    const index = this.fornecedores.findIndex(f => f.id === id);
    if (index !== -1) {
      this.fornecedores[index] = { ...fornecedorAtualizado, id };
      return of(this.fornecedores[index]);
    } else {
      return throwError(() => new Error('Fornecedor não encontrado para atualizar'));
    }
  }

  deletar(id: number): Observable<void> {
    const index = this.fornecedores.findIndex(f => f.id === id);
    if (index !== -1) {
      this.fornecedores.splice(index, 1);
      return of(void 0);
    } else {
      return throwError(() => new Error('Fornecedor não encontrado para deletar'));
    }
  }
}
