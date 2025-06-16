// src/app/services/os-concurrency.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OsConcurrencyService {
  private dataUltimaModificacaoMap = new Map<number, Date>();

  // Define ou atualiza a data para a OS
  atualizarData(osId: number, data: Date): void {
    if (osId && data) {
      this.dataUltimaModificacaoMap.set(osId, new Date(data));
    }
  }

  // Retorna a última data conhecida para a OS
  obterData(osId: number): Date | undefined {
    return this.dataUltimaModificacaoMap.get(osId);
  }

  // Remove uma OS do controle (ex: ao cancelar/fechar form)
  limpar(osId: number): void {
    this.dataUltimaModificacaoMap.delete(osId);
  }

  limparTodas(): void {
    this.dataUltimaModificacaoMap.clear();
  }
}
