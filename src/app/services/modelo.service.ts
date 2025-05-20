import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Modelo } from '../Models/modelo.model';

@Injectable({
  providedIn: 'root'
})
export class ModeloService {
  private modelos: Modelo[] = [
    { id: 1, nome: 'Galaxy S21', id_marca: 1, id_usuario_criador: 1, id_usuario_modificador: 1 },
    { id: 2, nome: 'iPhone 13', id_marca: 2, id_usuario_criador: 1, id_usuario_modificador: 1 },
    { id: 3, nome: 'Moto G10', id_marca: 3, id_usuario_criador: 1, id_usuario_modificador: 1 }
  ];

  private modelosSubject = new BehaviorSubject<Modelo[]>(this.modelos);
  private proximoId = 4;

  getModelos(): Observable<Modelo[]> {
    return of(this.modelos);
  }

  getModeloById(id: number): Observable<Modelo | undefined> {
    const modelo = this.modelos.find(m => m.id === id);
    return of(modelo);
  }

  criar(modelo: Modelo): Observable<Modelo> {
    const novoModelo: Modelo = {
      ...modelo,
      id: this.proximoId++,
      id_usuario_criador: 1,
      id_usuario_modificador: 1
    };
    this.modelos.push(novoModelo);
    this.modelosSubject.next(this.modelos);
    return of(novoModelo);
  }

atualizar(id: number, modeloAtualizado: Omit<Modelo, 'id'>): Observable<Modelo | undefined> {
  const index = this.modelos.findIndex(m => m.id === id);
  if (index !== -1) {
    this.modelos[index] = {
      id,
      ...modeloAtualizado,
      id_usuario_modificador: 1
    };
    this.modelosSubject.next(this.modelos);
    return of(this.modelos[index]);
  }
  return of(undefined);
}

excluir(id: number): Observable<void> {
    this.modelos = this.modelos.filter(m => m.id !== id);
    this.modelosSubject.next(this.modelos);
    return of(void 0);
  }
}
