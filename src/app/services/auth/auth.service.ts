import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';

  constructor(private router: Router) {}

  login(username: string, password: string): boolean {
    // Fake login: aceita "admin" e "1234" só para exemplo
    if(username === 'admin' && password === '1234') {
      localStorage.setItem(this.TOKEN_KEY, 'meu-token-fake');
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  }
}
