// src/app/models/confirmation.model.ts
export interface ConfirmationConfig {
  title: string;
  message: string;
  acceptButtonText?: string;
  cancelButtonText?: string;
  acceptButtonClass?: string;
  cancelButtonClass?: string;
}
