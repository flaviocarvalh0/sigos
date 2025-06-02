import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';


@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const expectedRoles = route.data['expectedRoles'] as Array<string>;
    const currentUser = this.authService.currentUserValue;

    if (!this.authService.isLoggedIn() || !currentUser) {
      // Se não estiver logado, o AuthGuard já deve ter redirecionado, mas é uma dupla checagem.
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    if (!expectedRoles || expectedRoles.length === 0) {
      return true; // Nenhum papel específico esperado, permite acesso
    }

    const hasRequiredRole = expectedRoles.some(role =>
      currentUser.gruposNomes.includes(role.toLowerCase())
    );

    if (hasRequiredRole) {
      return true;
    } else {
      console.warn(`Acesso negado para a rota ${state.url}. Papéis requeridos: ${expectedRoles}. Usuário tem: ${currentUser.gruposNomes}`);
      // Redirecionar para uma página de acesso negado ou para a home page
      return this.router.createUrlTree(['/']); // Ou uma página '/acesso-negado'
    }
  }
}
