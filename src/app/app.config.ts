import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthInterceptor } from './services/auth/auth.interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),

    // Configure HttpClient aqui:
     provideHttpClient(
      withFetch(), // <--- ADICIONE ISTO PARA HABILITAR A API FETCH PARA SSR
      withInterceptorsFromDi() // Mantém o suporte para interceptors baseados em classe
    ),
// Permite que interceptors injetáveis de classe sejam usados

    // Registre seu AuthInterceptor (ou outros interceptors) assim:
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'pt-BR' },

    importProvidersFrom(BrowserAnimationsModule)
    // Outros providers globais podem vir aqui
  ]
};
