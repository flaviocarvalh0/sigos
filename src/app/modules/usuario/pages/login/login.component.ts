import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Para *ngIfmporte LoginPayload
import { AuthService } from '../../../../services/auth/auth.service';
import { LoginPayload } from '../../../../Models/usuario.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  // styleUrls: ['./login.component.css']
})
export class LoginComponent {

  username = '';
  password = '';
  error = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  onSubmit() {
    if (!this.username || !this.password) {
      this.error = 'Usuário (login ou email) e senha são obrigatórios.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    const payload: LoginPayload = {
      login: this.username, // Seu DTO no backend espera 'Login'
      senha: this.password   // Seu DTO no backend espera 'Senha'
    };

    this.authService.login(payload).subscribe({
      next: (isLoggedIn) => {
        // isLoading será false no complete ou error
        if (isLoggedIn) {
          console.log('Login bem-sucedido pela API, navegando para /');
          // Tenta navegar para a URL de retorno ou para a raiz
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        }
        // Não deve chegar aqui se o serviço lança erro em falha
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erro no login via API:', err);
        this.error = err.message || 'Falha no login. Verifique suas credenciais.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
