import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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

  getModelos(): Observable<Modelo[]> {
    return of(this.modelos);
  }

  getModeloById(id: number): Observable<Modelo | undefined> {
    const modelo = this.modelos.find(m => m.id === id);
    return of(modelo);
  }
}
