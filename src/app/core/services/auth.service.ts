import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, AuthProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'senavicola_token';
  private readonly USER_KEY = 'senavicola_user';
  private readonly apiUrl = environment.apiUrl;

  currentUser = signal<AuthProfile | null>(this.getUserFromStorage());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(this.TOKEN_KEY, response.access_token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this.currentUser.set(response.user as unknown as AuthProfile);
      }),
      catchError((error) => {
        const msg = error.error?.message || 'Credenciales inválidas';
        return throwError(() => new Error(msg));
      })
    );
  }

  getProfile(): Observable<AuthProfile> {
    return this.http.get<AuthProfile>(`${this.apiUrl}/auth/profile`).pipe(
      tap((profile) => {
        this.currentUser.set(profile);
        localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
      })
    );
  }

  checkAuth(): Observable<{ valid: boolean }> {
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/auth/check`);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private getUserFromStorage(): AuthProfile | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
}
