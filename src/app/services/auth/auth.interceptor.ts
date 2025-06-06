import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Seu AuthService
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // Defina a URL base da sua API aqui também para o interceptor
  private readonly API_BASE_URL = 'https://localhost:7119/api'; // <<--- AJUSTE CONFORME SUA API

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Só adiciona o token se for no browser e a requisição for para sua API
    if (isPlatformBrowser(this.platformId) && req.url.startsWith(this.API_BASE_URL)) {
      const token = this.authService.getToken();
      if (token) {
        // Não adiciona o token para o endpoint de login em si
        if (req.url.includes('/login/authenticate')) {
            return next.handle(req);
        }

        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        
        return next.handle(cloned);
      }
    }
    return next.handle(req);
  }
}
