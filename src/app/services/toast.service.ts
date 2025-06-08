// src/app/services/toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastData } from '../Models/toast.model'; // Ajuste o path

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastData[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private nextId = 0;
  private toasts: ToastData[] = [];

show(message: string, type: ToastData['type'] = 'info', delay: number = 5000): void {
  const id = this.nextId++;
  const toast: ToastData = {
    id,
    message,
    type,
    delay,
    timestamp: new Date(),
    remaining: delay,
    startedAt: Date.now(),
    progress: 0,
    paused: false
  };

  this.toasts.push(toast);
  this.toastsSubject.next([...this.toasts]);

  this.startTimeout(toast);
  this.startProgress(toast);
}


  private startTimeout(toast: ToastData) {
    toast.startedAt = Date.now();
    toast.timeoutId = setTimeout(() => this.remove(toast), toast.remaining!);
  }

 private startProgress(toast: ToastData) {
  toast.intervalId = setInterval(() => {
    if (toast.paused) return;

    const elapsed = Date.now() - toast.startedAt!;
    const percent = (elapsed / toast.delay!) * 100;
    toast.progress = Math.min(percent, 100);

    this.toastsSubject.next([...this.toasts]);

    if (toast.progress >= 100) {
      this.remove(toast);
    }
  }, 100);
}



  remove(toast: ToastData): void {
    clearTimeout(toast.timeoutId);
    clearInterval(toast.intervalId);
    this.toasts = this.toasts.filter(t => t.id !== toast.id);
    this.toastsSubject.next([...this.toasts]);
  }

  success(msg: string, delay?: number) { this.show(msg, 'success', delay); }
  error(msg: string, delay?: number) { this.show(msg, 'error', delay); }
  warning(msg: string, delay?: number) { this.show(msg, 'warning', delay); }
  info(msg: string, delay?: number) { this.show(msg, 'info', delay); }
}

