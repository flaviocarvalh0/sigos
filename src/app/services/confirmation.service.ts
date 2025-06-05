// src/app/services/confirmation.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ConfirmationConfig } from '../Models/confirmation.model'; // Ajuste o path

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private Sconfig = new Subject<ConfirmationConfig | null>(); // Para enviar config para o dialog
  private Sresult = new Subject<boolean>();               // Para receber o resultado do dialog

  constructor() { }

  getConfig(): Observable<ConfirmationConfig | null> {
    return this.Sconfig.asObservable();
  }

  confirm(config: ConfirmationConfig): Observable<boolean> {
    this.Sconfig.next(config); // Envia a configuração para o componente do dialog
    return this.Sresult.asObservable(); // Retorna um observable que emitirá o resultado (true/false)
  }

  // Chamado pelo componente do dialog
  setResult(result: boolean): void {
    this.Sconfig.next(null); // Limpa a configuração (esconde o dialog)
    this.Sresult.next(result);
  }
}
