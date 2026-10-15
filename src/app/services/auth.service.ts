import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UsuarioResponse, LoginRequest } from '../models/usuario.model';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = '/api/auth';

  usuario = signal<UsuarioResponse | null>(null);

  login(req: LoginRequest): Observable<UsuarioResponse> {
    return this.http
      .post<UsuarioResponse>(`${this.baseUrl}/login`, req)
      .pipe(tap((u) => this.usuario.set(u)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/logout`, {})
      .pipe(tap(() => this.usuario.set(null)));
  }

  me(): Observable<UsuarioResponse> {
    return this.http
      .get<UsuarioResponse>(`${this.baseUrl}/me`)
      .pipe(tap((u) => this.usuario.set(u)));
  }
}