import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Cliente } from '../Models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private clientes: Cliente[] = [
    {
      id: 1,
      nome_completo: 'João da Silva',
      telefone: '11999999999',
      id_usuario_modificador: 1,
      cidade: 'São Paulo',
      ativo: true
    },
    {
      id: 2,
      nome_completo: 'Maria Oliveira',
      telefone: '21988888888',
      id_usuario_modificador: 1,
      cidade: 'Rio de Janeiro',
      ativo: true
    }
  ];


  private clientesSubject = new BehaviorSubject<Cliente[]>(this.clientes);

  getClientes(): Observable<Cliente[]> {
    return this.clientesSubject.asObservable();
  }

  getClienteById(id: number): Observable<Cliente | undefined> {
    const cliente = this.clientes.find(c => c.id === id);
    return of(cliente);
  }

  addCliente(cliente: Omit<Cliente, 'id'>): Observable<Cliente> {
    const ids = this.clientes
  .map(c => c.id)
  .filter((id): id is number => id !== undefined);

  const id = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    const novoCliente = { id, ...cliente };
    this.clientes.push(novoCliente);
    this.clientesSubject.next(this.clientes);
    return of(novoCliente);
  }

  updateCliente(id: number, clienteAtualizado: Omit<Cliente, 'id'>): Observable<Cliente | undefined> {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clientes[index] = { id, ...clienteAtualizado };
      this.clientesSubject.next(this.clientes);
      return of(this.clientes[index]);
    }
    return of(undefined);
  }

  deleteCliente(id: number): Observable<void> {
    this.clientes = this.clientes.filter(c => c.id !== id);
    this.clientesSubject.next(this.clientes);
    return of(void 0);  // Observable<void> para simular async
  }
}
