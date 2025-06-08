import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { OsPeca } from '../../Models/ordem-servico/os-peca.model'; // Ajuste o path

@Injectable({
  providedIn: 'root'
})
export class OsPecaService {
  private mockOsPecas: OsPeca[] = [];
  private nextId = 0;

  constructor() { }

  getPecasByOsId(osId: number): Observable<OsPeca[]> {
    const pecas = this.mockOsPecas.filter(p => p.id_os === osId);
    return of(pecas).pipe(delay(500));
  }

  getOsPecaById(id: number): Observable<OsPeca | undefined> {
    const peca = this.mockOsPecas.find(p => p.id === id);
    return of(peca).pipe(delay(500));
  }

  createOsPeca(osPecaData: OsPeca): Observable<OsPeca> {
    if (!osPecaData.id_os) {
        return throwError(() => new Error('id_os é obrigatório para criar OsPeca'));
    }
    const novaPeca: OsPeca = {
      ...osPecaData,
      id: this.nextId++,
      valor_total: (osPecaData.quantidade || 0) * (osPecaData.valor_unitario || 0)
    };
    this.mockOsPecas.push(novaPeca);
    return of(novaPeca).pipe(delay(500));
  }

  updateOsPeca(id: number, osPecaData: OsPeca): Observable<OsPeca> {
    const index = this.mockOsPecas.findIndex(p => p.id === id);
    if (index > -1) {
      this.mockOsPecas[index] = {
        ...this.mockOsPecas[index],
        ...osPecaData,
        valor_total: (osPecaData.quantidade || 0) * (osPecaData.valor_unitario || 0)
      };
      return of(this.mockOsPecas[index]).pipe(delay(500));
    }
    return throwError(() => new Error(`OsPeca com id ${id} não encontrada.`));
  }

  deleteOsPeca(id: number): Observable<void> {
    const index = this.mockOsPecas.findIndex(p => p.id === id);
    if (index > -1) {
      this.mockOsPecas.splice(index, 1);
      return of(undefined).pipe(delay(500));
    }
    return throwError(() => new Error(`OsPeca com id ${id} não encontrada.`));
  }
}
