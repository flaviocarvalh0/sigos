import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { OsServico } from '../Models/ordem-servico/os-servico.model'; // Ajuste o path

@Injectable({
  providedIn: 'root'
})
export class OsServicoService {
  private mockOsServicos: OsServico[] = [];
  private nextId = 0;

  constructor() { }

  getServicosByOsId(osId: number): Observable<OsServico[]> {
    const servicos = this.mockOsServicos.filter(s => s.id_os === osId);
    return of(servicos).pipe(delay(500)); // Simula delay da API
  }

  getOsServicoById(id: number): Observable<OsServico | undefined> {
    const servico = this.mockOsServicos.find(s => s.id === id);
    return of(servico).pipe(delay(500));
  }

  createOsServico(osServicoData: OsServico): Observable<OsServico> {
    if (!osServicoData.id_os) {
        return throwError(() => new Error('id_os é obrigatório para criar OsServico'));
    }
    const novoServico: OsServico = {
      ...osServicoData,
      id: this.nextId++,
      valor_total: (osServicoData.quantidade || 0) * (osServicoData.valor_unitario || 0)
    };
    this.mockOsServicos.push(novoServico);
    return of(novoServico).pipe(delay(500));
  }

  updateOsServico(id: number, osServicoData: OsServico): Observable<OsServico> {
    const index = this.mockOsServicos.findIndex(s => s.id === id);
    if (index > -1) {
      this.mockOsServicos[index] = {
        ...this.mockOsServicos[index],
        ...osServicoData,
        valor_total: (osServicoData.quantidade || 0) * (osServicoData.valor_unitario || 0)
      };
      return of(this.mockOsServicos[index]).pipe(delay(500));
    }
    return throwError(() => new Error(`OsServico com id ${id} não encontrado.`));
  }

  deleteOsServico(id: number): Observable<void> {
    const index = this.mockOsServicos.findIndex(s => s.id === id);
    if (index > -1) {
      this.mockOsServicos.splice(index, 1);
      return of(undefined).pipe(delay(500));
    }
    return throwError(() => new Error(`OsServico com id ${id} não encontrado.`));
  }
}
