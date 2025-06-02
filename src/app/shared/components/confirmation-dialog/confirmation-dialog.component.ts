// src/app/shared/components/confirmation-dialog/confirmation-dialog.component.ts
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmationService } from '../../../services/confirmation.service'; // Ajuste o path
import { ConfirmationConfig } from '../../../Models/confirmation.model';   // Ajuste o path

// Declare bootstrap para controle manual do modal, se necessário,
// mas o ideal é controlar via *ngIf e o service
declare const bootstrap: any;
import { NgZone, ElementRef, ViewChild, AfterViewInit } from '@angular/core';


@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  config: ConfirmationConfig | null = null;
  private configSubscription!: Subscription;

  @ViewChild('confirmationModal') confirmationModalRef!: ElementRef;
  private modalInstance: any; // bootstrap.Modal

  constructor(
    private confirmationService: ConfirmationService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.configSubscription = this.confirmationService.getConfig().subscribe(config => {
      this.config = config;
      if (config) {
        this.showModal();
      } else {
        this.hideModal();
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
        if (this.confirmationModalRef?.nativeElement) {
            this.modalInstance = new bootstrap.Modal(this.confirmationModalRef.nativeElement, {
                backdrop: 'static', // Não fecha ao clicar fora
                keyboard: false     // Não fecha com ESC
            });
        }
    }
  }

  private showModal(): void {
    if (isPlatformBrowser(this.platformId) && this.modalInstance) {
        this.zone.run(() => { // Garante que está na zona do Angular
            this.modalInstance.show();
        });
    }
  }

  private hideModal(): void {
     if (isPlatformBrowser(this.platformId) && this.modalInstance) {
        this.zone.run(() => {
            this.modalInstance.hide();
        });
    }
  }

  onAccept(): void {
    this.confirmationService.setResult(true);
  }

  onCancel(): void {
    this.confirmationService.setResult(false);
  }

  ngOnDestroy(): void {
    this.configSubscription.unsubscribe();
     if (isPlatformBrowser(this.platformId) && this.modalInstance) {
        this.modalInstance.dispose();
    }
  }
}
