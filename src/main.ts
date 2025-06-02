import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthInterceptor } from './app/services/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(BrowserAnimationsModule),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(), // <--- ADICIONE ISTO PARA HABILITAR A API FETCH PARA SSR
      withInterceptorsFromDi() // Mantém o suporte para interceptors baseados em classe
    ),
    // Permite que interceptors injetáveis de classe sejam usados

    // Registre seu AuthInterceptor (ou outros interceptors) assim:
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
}).catch((err) => console.error(err));
