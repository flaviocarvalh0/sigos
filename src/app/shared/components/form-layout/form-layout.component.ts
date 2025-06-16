// src/app/shared/components/form-layout/form-layout.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuditoriaData } from '../../../Models/AuditoriaData.model';

@Component({
  selector: 'app-form-layout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule
  ],
  templateUrl: './form-layout.component.html',
  styleUrls: ['./form-layout.component.css']
})
export class FormLayoutComponent {
  @Input() titulo: string = 'Formulário';
  @Input() icone: string = 'bi bi-pencil-square';
  @Input() isLoading: boolean = false;
  @Input() isFormInvalid: boolean = false;
  @Input() isFormPristine: boolean = true;
  @Input() isEditMode: boolean = false;
  @Input() auditoriaData: AuditoriaData | null = null;

  @Input() form!: FormGroup; // ✅ Corrigido: Agora o Angular sabe que o componente espera um FormGroup

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  formatarData(data: Date | string | null | undefined): string {
    if (!data || new Date(data).getFullYear() <= 1) return 'N/A';
    return new Date(data).toLocaleString('pt-BR');
  }
  onSaveClick(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();  // Isso força o Angular a exibir os erros dos campos
  }
  this.save.emit();
}

}
