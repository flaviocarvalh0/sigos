// src/app/models/toast.model.ts (ou em uma pasta de modelos compartilhados)
export interface ToastData {
  id?: number; // Opcional, para rastreamento
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  classname?: string; // Para classes CSS customizadas
  delay?: number;     // Tempo para auto-fechar
  timestamp?: Date;
}
