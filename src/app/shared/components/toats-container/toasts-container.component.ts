// src/app/shared/components/toasts-container/toasts-container.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService } from '../../../services/toast.service'; // Ajuste o path
import { ToastData } from '../../../Models/toast.model';     // Ajuste o path

@Component({
  selector: 'app-toasts-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toasts-container.component.html',
  styleUrls: ['./toasts-container.component.css']
})
export class ToastsContainerComponent implements OnInit, OnDestroy {
  toasts: ToastData[] = [];
  private toastSubscription!: Subscription;

  constructor(public toastService: ToastService) {} // Injeta como public para acesso no template (ou usa getter)

  ngOnInit(): void {
    this.toastSubscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  getToastClass(toast: ToastData): string {
    let baseClass = 'toast align-items-center text-white border-0';
    switch (toast.type) {
      case 'success': return `${baseClass} bg-success`;
      case 'error': return `${baseClass} bg-danger`;
      case 'warning': return `${baseClass} bg-warning text-dark`; // text-dark para melhor contraste
      case 'info': return `${baseClass} bg-info text-dark`;       // text-dark para melhor contraste
      default: return `${baseClass} bg-secondary`;
    }
  }

pauseToast(toast: ToastData) {
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
    toast.timeoutId = undefined;
    const elapsed = Date.now() - (toast.startedAt ?? Date.now());
    toast.remaining = (toast.remaining ?? 0) - elapsed;
  }
}

resumeToast(toast: ToastData) {
  if (!toast.timeoutId && (toast.remaining ?? 0) > 0) {
    toast.startedAt = Date.now();
    toast.timeoutId = setTimeout(() => {
      this.toastService.remove(toast);
    }, toast.remaining);
  }
}

togglePause(toast: ToastData): void {
  if (toast.paused) {
    toast.paused = false;
    toast.startedAt = Date.now();
    toast.timeoutId = setTimeout(() => this.toastService.remove(toast), toast.remaining!);
  } else {
    toast.paused = true;
    const elapsed = Date.now() - toast.startedAt!;
    toast.remaining = (toast.remaining ?? 0) - elapsed;
    clearTimeout(toast.timeoutId);
  }
}






  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
  }
}
