import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, delay } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { UsuarioLogado, LoginPayload, LoginResponse } from '../../Models/usuario.model'; // Ajuste o path

// Para decodificar JWT (instale com: npm install jwt-decode)
import { jwtDecode, JwtPayload } from "jwt-decode";
import { environment } from '../../environments/environment';

// Estenda JwtPayload se você tiver claims customizados que quer tipar
interface CustomJwtPayload extends JwtPayload {
  id: string; // Ou number, dependendo de como é serializado no token
  login: string;
  nome: string;
  email: string;
  roles?: string[] | string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'sigos_auth_token_real_v1';
  private readonly USER_INFO_KEY = 'sigos_user_info_real_v1';

  private currentUserSubject: BehaviorSubject<UsuarioLogado | null>;
  public currentUser$: Observable<UsuarioLogado | null>;

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const initialUser = this.loadUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<UsuarioLogado | null>(initialUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
    console.log('[AuthService] Inicializado. Usuário do storage:', initialUser);
  }

  private isClient(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  public get currentUserValue(): UsuarioLogado | null {
    if (!this.currentUserSubject.value && this.isClient()) {
        const reloadedUser = this.loadUserFromStorage();
        if (reloadedUser) {
            this.currentUserSubject.next(reloadedUser);
        }
    }
    return this.currentUserSubject.value;
  }

  login(payload: LoginPayload): Observable<boolean> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/authenticate`, payload)
      .pipe(
        tap(response => {
          if (response && response.sucesso && response.dados) { // response.dados é o token
            const token = response.dados;
            this.setToken(token);
            const decodedUserData = this.decodeAndStoreUserFromToken(token);
            if (decodedUserData) {
              this.currentUserSubject.next(decodedUserData);
            } else {
              // Falha na decodificação ou token inválido mesmo com sucesso da API (improvável mas defensivo)
              this.clearAuthDataStorage();
              this.currentUserSubject.next(null);
              throw new Error("Token inválido ou falha ao decodificar.");
            }
          } else {
            // A API indicou falha ou não retornou token
            this.clearAuthDataStorage();
            this.currentUserSubject.next(null);
            throw new Error(response.mensagem || "Token não recebido da API.");
          }
        }),
        map(() => true), // Se chegou aqui sem erro, login foi sucesso
        catchError((error: HttpErrorResponse | Error) => {
          this.clearAuthDataStorage(); // Garante limpeza em caso de erro
          this.currentUserSubject.next(null);
          // Propaga um erro que o componente de login possa usar
          if (error instanceof HttpErrorResponse && error.error && error.error.mensagem) {
            return throwError(() => new Error(error.error.mensagem));
          } else if (error instanceof Error) {
            return throwError(() => error);
          }
          return throwError(() => new Error('Erro desconhecido durante o login.'));
        })
      );
  }

  logout(): void {
    this.clearAuthDataStorage();
    this.currentUserSubject.next(null);
    if (this.isClient()){
      this.router.navigate(['/login']);
    }
  }

  isLoggedIn(): boolean {
    const user = this.currentUserValue;
    if (user && user.exp) {
      const isExpired = Math.floor(Date.now() / 1000) >= user.exp;
      if (isExpired) {
        console.log('[AuthService] Token expirado, efetuando logout automático.');
        this.logout();
        return false;
      }
      return true;
    }
    // Se não há usuário no subject, mas pode haver no storage (ex: após refresh de página)
    const reloadedUser = this.loadUserFromStorage();
    if (reloadedUser) {
        this.currentUserSubject.next(reloadedUser); // Atualiza o subject
        return !this.isTokenExpired(reloadedUser); // Verifica novamente a expiração
    }
    return false;
  }


  private decodeAndStoreUserFromToken(token: string): UsuarioLogado | null {
    try {
      const decoded = jwtDecode<CustomJwtPayload>(token);
      // O claim 'id' no seu JwtTokenService é o NameIdentifier.
      // O claim 'roles' precisa ser adicionado pelo seu backend no token.
      const grupos: string[] = [];
      if (decoded.roles) {
        if (Array.isArray(decoded.roles)) {
          grupos.push(...decoded.roles.map(r => r.toLowerCase()));
        } else if (typeof decoded.roles === 'string') {
          grupos.push(decoded.roles.toLowerCase());
        }
      }

      const userData: UsuarioLogado = {
        id: parseInt(decoded.id || decoded.sub || "0", 10), // Prioriza 'id', depois 'sub'
        login: decoded.login,
        nome: decoded.nome,
        email: decoded.email || '', // Adicione claim 'email' ao token se quiser isso aqui
        gruposNomes: grupos,
        exp: decoded.exp!
      };
      this.storeUserInfo(userData); // Armazena os dados decodificados
      return userData;
    } catch (error) {
      console.error('Erro ao decodificar token JWT:', error);
      return null;
    }
  }

  getToken(): string | null {
    return this.isClient() ? localStorage.getItem(this.TOKEN_KEY) : null;
  }

  private setToken(token: string): void {
    if (this.isClient()) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private storeUserInfo(userData: UsuarioLogado): void {
    if (this.isClient()) {
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userData));
    }
  }

  private clearAuthDataStorage(): void {
    if (this.isClient()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_INFO_KEY);
    }
  }

  private loadUserFromStorage(): UsuarioLogado | null {
    if (this.isClient()) {
      const userInfo = localStorage.getItem(this.USER_INFO_KEY);
      if (userInfo) {
        try {
          const parsedUser = JSON.parse(userInfo) as UsuarioLogado;
          if (!this.isTokenExpired(parsedUser)) {
            return parsedUser;
          } else {
            this.clearAuthDataStorage(); // Limpa dados expirados
          }
        } catch (e) {
          this.clearAuthDataStorage();
        }
      }
    }
    return null;
  }

  private isTokenExpired(tokenData: UsuarioLogado | null): boolean {
    if (!tokenData || !tokenData.exp) {
      return true; // Se não tem info de expiração, considera expirado
    }
    return Math.floor(Date.now() / 1000) >= tokenData.exp;
  }

  hasRole(roleName: string): boolean {
    const user = this.currentUserValue;
    return !!user && !!user.gruposNomes && user.gruposNomes.includes(roleName.toLowerCase());
  }

  getCurrentUserLogin(): string | undefined {
    return this.currentUserValue?.login;
  }
}
