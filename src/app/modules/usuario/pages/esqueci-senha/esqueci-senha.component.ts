import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';// Ajuste o path se necessário
import { AuthService } from '../../../../services/auth/auth.service';

// Declare bootstrap para Toast, se estiver usando o Toast global do Bootstrap
// declare const bootstrap: any;
// import { NgZone } from '@angular/core';


@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './esqueci-senha.component.html',
  styleUrls: ['./esqueci-senha.component.css'] // Crie se precisar de estilos específicos
})
export class EsqueciSenhaComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    // private zone: NgZone // Se for usar Toast do Bootstrap
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.showMessage('Por favor, insira um email válido.', 'error');
      return;
    }

    this.isLoading = true;
    this.message = '';
    const email = this.forgotPasswordForm.value.email;

    // Chama o método mockado no AuthService
    // this.authService.requestPasswordReset(email).subscribe({
    //   next: (response) => {
    //     this.isLoading = false;
    //     this.showMessage(response.message, 'success');
    //     // Não redireciona, apenas mostra a mensagem
    //   },
    //   error: (err) => {
    //     this.isLoading = false;
    //     this.showMessage(err.message || 'Erro ao processar a solicitação.', 'error');
    //     console.error('Erro na solicitação de reset de senha:', err);
    //   }
    // });
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    // Se estiver usando um toast global do Bootstrap, chame-o aqui
    // Exemplo (requer elemento toast no HTML do EsqueciSenhaComponent ou App):
    // if (isPlatformBrowser(this.platformId)) {
    //   this.zone.run(() => {
    //     const toastEl = document.getElementById('esqueciSenhaToast'); // ID Único
    //     if (toastEl) {
    //       const toastBody = toastEl.querySelector('.toast-body');
    //       if (toastBody) toastBody.textContent = this.message;
    //       toastEl.className = `toast align-items-center text-white border-0 ${this.messageType === 'success' ? 'bg-success' : 'bg-danger'}`;
    //       const toast = new bootstrap.Toast(toastEl);
    //       toast.show();
    //     }
    //   });
    // }
  }

  isInvalidControl(controlName: string): boolean {
    const control = this.forgotPasswordForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
