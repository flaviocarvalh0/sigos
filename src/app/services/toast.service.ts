// src/app/services/toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastData } from '../Models/toast.model'; // Ajuste o path

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastData[]>([]);
  public toasts$: Observable<ToastData[]> = this.toastsSubject.asObservable();
  private nextId = 0;

  constructor() { }

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', delay: number = 5000): void {
    const toast: ToastData = {
      id: this.nextId++,
      message,
      type,
      delay,
      timestamp: new Date()
    };

    // Adiciona o novo toast à lista
    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    // Auto-remove o toast após o delay (se houver)
    if (delay > 0) {
      setTimeout(() => this.remove(toast), delay);
    }
  }

  remove(toastToRemove: ToastData): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== toastToRemove.id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }

  // Métodos de conveniência
  success(message: string, delay?: number): void { this.show(message, 'success', delay); }
  error(message: string, delay?: number): void { this.show(message, 'error', delay); }
  warning(message: string, delay?: number): void { this.show(message, 'warning', delay); }
  info(message: string, delay?: number): void { this.show(message, 'info', delay); }
}
