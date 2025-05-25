import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { PrazoGarantia } from '../Models/prazo_garantia.model';

@Injectable({
  providedIn: 'root'
})
export class PrazoGarantiaService {
  private prazosGarantia: PrazoGarantia[] = [
    {
      id: 1,
      quantidade_de_dias: 90,
      ativo: true,
      descricao: 'Garantia padrão de 90 dias',
      id_usuario_criador: 1,
      id_usuario_modificador: 1
    },
    {
      id: 2,
      quantidade_de_dias: 180,
      ativo: true,
      descricao: 'Garantia estendida de 6 meses',
      id_usuario_criador: 1,
      id_usuario_modificador: 1
    }
  ];

  private prazosSubject = new BehaviorSubject<PrazoGarantia[]>(this.prazosGarantia);
  private proximoId = 3;

  constructor() { }

  listar(): Observable<PrazoGarantia[]> {
    return this.prazosSubject.asObservable();
  }

  buscarPorId(id: number): Observable<PrazoGarantia | undefined> {
    const prazo = this.prazosGarantia.find(p => p.id === id);
    return of(prazo);
  }

  criar(prazo: Omit<PrazoGarantia, 'id'>): Observable<PrazoGarantia> {
    const novoPrazo: PrazoGarantia = {
      ...prazo,
      id: this.proximoId++,
      data_criacao: new Date()
    };
    this.prazosGarantia.push(novoPrazo);
    this.prazosSubject.next(this.prazosGarantia);
    return of(novoPrazo);
  }

  atualizar(id: number, prazoAtualizado: Omit<PrazoGarantia, 'id'>): Observable<PrazoGarantia | undefined> {
    const index = this.prazosGarantia.findIndex(p => p.id === id);
    if (index !== -1) {
      this.prazosGarantia[index] = {
        ...this.prazosGarantia[index],
        ...prazoAtualizado,
        data_modificacao: new Date()
      };
      this.prazosSubject.next(this.prazosGarantia);
      return of(this.prazosGarantia[index]);
    }
    return of(undefined);
  }

  excluir(id: number): Observable<boolean> {
    const index = this.prazosGarantia.findIndex(p => p.id === id);
    if (index !== -1) {
      this.prazosGarantia.splice(index, 1);
      this.prazosSubject.next(this.prazosGarantia);
      return of(true);
    }
    return of(false);
  }

  ativarDesativar(id: number, ativo: boolean): Observable<boolean> {
    const index = this.prazosGarantia.findIndex(p => p.id === id);
    if (index !== -1) {
      this.prazosGarantia[index].ativo = ativo;
      this.prazosGarantia[index].data_modificacao = new Date();
      this.prazosSubject.next(this.prazosGarantia);
      return of(true);
    }
    return of(false);
  }
}
