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

  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
  }
}
