import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';


@Component({
    selector: 'app-login', // importante: standalone
    imports: [FormsModule, NgIf],
    templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if(this.auth.login(this.username, this.password)) {
      this.router.navigate(['/']);
    } else {
      this.error = 'Usuário ou senha inválidos';
    }
  }
}
