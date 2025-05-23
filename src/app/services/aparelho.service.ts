import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Aparelho } from '../Models/aparelho.model';


@Injectable({
  providedIn: 'root'
})
export class AparelhoService {
  private aparelhos: Aparelho[] = [
    {
      id: 1, imei_1: '123456789012345', imei_2: '987654321098765', cor: 'Preto', id_modelo: 1, id_marca: 1,
      id_cliente: 1
    },
    {
      id: 2, imei_1: '111111111111111', imei_2: '222222222222222', cor: 'Branco', id_modelo: 2, id_marca: 2,
      id_cliente: 2
    }
  ];

  private proximoId = 3;

  listar(): Observable<Aparelho[]> {
    // Simula atraso de 500ms
    return of(this.aparelhos).pipe(delay(500));
  }

buscarPorCliente(clienteId: number): Observable<Aparelho[]> {
  const aparelhosDoCliente = this.aparelhos.filter(a => a.id_cliente === clienteId);
  return of(aparelhosDoCliente).pipe(delay(300));
}

buscarPorId(id: number): Observable<Aparelho | undefined> {
  const aparelho = this.aparelhos.find(a => a.id === id);
  return of(aparelho).pipe(delay(300));
}

  criar(aparelho: Aparelho): Observable<Aparelho> {
    aparelho.id = this.proximoId++;
    this.aparelhos.push(aparelho);
    return of(aparelho).pipe(delay(300));
  }

  atualizar(id: number, aparelhoAtualizado: Aparelho): Observable<Aparelho> {
    const index = this.aparelhos.findIndex(a => a.id === id);
    if (index === -1) {
      return throwError(() => new Error('Aparelho não encontrado'));
    }
    this.aparelhos[index] = { ...aparelhoAtualizado, id };
    return of(this.aparelhos[index]).pipe(delay(300));
  }

  excluir(id: number): Observable<void> {
    const index = this.aparelhos.findIndex(a => a.id === id);
    if (index === -1) {
      return throwError(() => new Error('Aparelho não encontrado'));
    }
    this.aparelhos.splice(index, 1);
    return of(undefined).pipe(delay(300));
  }
}
