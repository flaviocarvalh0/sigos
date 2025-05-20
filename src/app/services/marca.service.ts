import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Marca } from '../Models/marca.model';

@Injectable({
  providedIn: 'root'
})
export class MarcaService {
  private marcas: Marca[] = [
    { id: 1, nome: 'Samsung', id_usuario_criador: 1, id_usuario_modificador: 1 },
    { id: 2, nome: 'Apple', id_usuario_criador: 1, id_usuario_modificador: 1 },
    { id: 3, nome: 'Motorola', id_usuario_criador: 1, id_usuario_modificador: 1 }
  ];

  private marcasSubject = new BehaviorSubject<Marca[]>(this.marcas);
  private proximoId = 4;

  getMarcas(): Observable<Marca[]> {
    return this.marcasSubject.asObservable();
  }

  getMarcaById(id: number): Observable<Marca | undefined> {
    const marca = this.marcas.find(m => m.id === id);
    return of(marca);
  }

  salvar(marca: Omit<Marca, 'id'>): Observable<Marca> {
    const novaMarca = { ...marca, id: this.proximoId++ };
    this.marcas.push(novaMarca);
    this.marcasSubject.next(this.marcas);
    return of(novaMarca);
  }

  atualizar(marcaAtualizada: Marca): Observable<Marca | undefined> {
    const index = this.marcas.findIndex(m => m.id === marcaAtualizada.id);
    if (index !== -1) {
      this.marcas[index] = { ...marcaAtualizada };
      this.marcasSubject.next(this.marcas);
      return of(this.marcas[index]);
    }
    return of(undefined);
  }

  excluir(id: number): Observable<void> {
    this.marcas = this.marcas.filter(m => m.id !== id);
    this.marcasSubject.next(this.marcas);
    return of(void 0);
  }
}
