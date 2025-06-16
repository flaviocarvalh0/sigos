// src/app/Models/auditoria.model.ts

export interface AuditoriaData {
  criadoPor?: string;
  dataCriacao?: Date | string | null;
  modificadoPor?: string;
  dataModificacao?: Date | string | null;
}
