import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {} // Renomeado para authService

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (this.authService.isLoggedIn()) { // authService agora
      return true;
    }
    // Redireciona para login, guardando a URL de retorno para redirecionamento após login
    return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
}
