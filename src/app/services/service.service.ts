import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Servico } from '../Models/servico.mode';

@Injectable({
  providedIn: 'root'
})
export class ServicoService {
  private servicos: Servico[] = [];
  private idCounter = 1;

  constructor() {}

  listar(): Observable<Servico[]> {
    return of(this.servicos);
  }

  buscarPorId(id: number): Observable<Servico | undefined> {
    const servico = this.servicos.find(s => s.id === id);
    return of(servico);
  }

  criar(servico: Servico): Observable<Servico> {
    const novoServico = { ...servico, id: this.idCounter++ };
    this.servicos.push(novoServico);
    return of(novoServico);
  }

  atualizar(id: number, servico: Servico): Observable<Servico> {
    const index = this.servicos.findIndex(s => s.id === id);
    if (index !== -1) {
      this.servicos[index] = { ...servico, id };
    }
    return of(this.servicos[index]);
  }

  excluir(id: number): Observable<void> {
    this.servicos = this.servicos.filter(s => s.id !== id);
    return of();
  }
}
