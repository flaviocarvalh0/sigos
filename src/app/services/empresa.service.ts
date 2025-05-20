import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { delay, map } from 'rxjs/operators';
import { Empresa } from '../Models/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private empresasSubject = new BehaviorSubject<Empresa[]>([
    {
      id: 1,
      razao_social: 'Empresa Exemplo Ltda',
      cnpj: '12.345.678/0001-90',
      cep: '12345-678',
      cidade: 'São Paulo',
      logradouro: 'Rua Exemplo',
      numero: '100',
      complemento: '',
      bairro: 'Centro',
      uf: 'SP',
      pais: 'Brasil',
      celular: '(11) 99999-9999',
      email: 'contato@exemplo.com',
      ativo: true,
      nome_fantasia: ''
    }
  ]);

  private nextId = 2;

  constructor() {}

  getEmpresas(): Observable<Empresa[]> {
    // Simula delay de requisição
    return this.empresasSubject.asObservable().pipe(delay(500));
  }

  getEmpresaById(id: number): Observable<Empresa | undefined> {
    return this.getEmpresas().pipe(
      map(empresas => empresas.find(e => e.id === id))
    );
  }

  addEmpresa(empresa: Empresa): Observable<Empresa> {
    const empresas = this.empresasSubject.getValue();
    const novaEmpresa = { ...empresa, id: this.nextId++ };
    this.empresasSubject.next([...empresas, novaEmpresa]);
    return of(novaEmpresa).pipe(delay(500));
  }

  updateEmpresa(id: number, empresaAtualizada: Empresa): Observable<Empresa | undefined> {
    let empresas = this.empresasSubject.getValue();
    empresas = empresas.map(e => e.id === id ? { ...empresaAtualizada, id } : e);
    this.empresasSubject.next(empresas);
    return of(empresaAtualizada).pipe(delay(500));
  }

  deleteEmpresa(id: number): Observable<void> {
    let empresas = this.empresasSubject.getValue();
    empresas = empresas.filter(e => e.id !== id);
    this.empresasSubject.next(empresas);
    return of(void 0).pipe(delay(500));
  }
}
