import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

type View = 'welcome' | 'login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">

      <!-- Welcome Screen -->
      @if (view() === 'welcome') {
        <div class="contenedor-bienvenida">
          <div class="card-bienvenida">
            <div class="icono-bienvenida">
              <i class="fas fa-egg"></i>
            </div>
            <h1>¡Bienvenidos a Senavicola!</h1>
            <p>Sistema integral de gestión avícola</p>
            <div class="botones-bienvenida">
              <button class="btn-principal" (click)="showLogin()">
                <i class="fas fa-sign-in-alt"></i>
                Iniciar Sesión
              </button>
              <button class="btn-secundario" (click)="loginAsGuest()">
                <i class="fas fa-eye"></i>
                Continuar como Invitado
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Login Form -->
      @if (view() === 'login') {
        <div class="contenedor-login">
          <button class="btn-volver" (click)="view.set('welcome')">
            <i class="fas fa-arrow-left"></i>
            Volver
          </button>

          <div class="card-login">
            <div class="icono-login">
              <i class="fas fa-egg"></i>
            </div>
            <h2>Iniciar Sesión</h2>
            <p class="subtitulo-login">Ingresa tus credenciales para continuar</p>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label>
                  <i class="fas fa-id-card"></i>
                  Número de Documento
                </label>
                <input
                  type="text"
                  formControlName="numero_documento"
                  placeholder="Ingresa tu número de documento"
                />
                @if (loginForm.get('numero_documento')?.invalid && loginForm.get('numero_documento')?.touched) {
                  <span class="error-msg"><i class="fas fa-exclamation-circle"></i> Campo requerido</span>
                }
              </div>

              <div class="form-group">
                <label>
                  <i class="fas fa-lock"></i>
                  Contraseña
                </label>
                <div class="input-password">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="contrasena"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button type="button" class="btn-toggle-pass" (click)="togglePassword()">
                    <i class="fas {{ showPassword() ? 'fa-eye-slash' : 'fa-eye' }}"></i>
                  </button>
                </div>
                @if (loginForm.get('contrasena')?.invalid && loginForm.get('contrasena')?.touched) {
                  <span class="error-msg"><i class="fas fa-exclamation-circle"></i> Campo requerido</span>
                }
              </div>

              @if (errorMsg()) {
                <div class="alert-error">
                  <i class="fas fa-times-circle"></i>
                  {{ errorMsg() }}
                </div>
              }

              <button type="submit" class="btn-login" [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner-sm"></span>
                  Ingresando...
                } @else {
                  <i class="fas fa-sign-in-alt"></i>
                  Iniciar Sesión
                }
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a3a0a 0%, #2d5a0e 40%, #39A900 100%);
      position: relative;
      font-family: 'Work Sans', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
      }
    }

    .contenedor-bienvenida, .contenedor-login {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 2rem;
    }

    .card-bienvenida, .card-login {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      width: 100%;
      animation: fadeInUp 0.5s ease;
    }

    .card-bienvenida {
      max-width: 480px;
      padding: 5rem 4rem;

      h1 { font-size: 3rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
      p { font-size: 1.6rem; color: #666; margin-bottom: 3.5rem; }
    }

    .card-login {
      max-width: 450px;
      padding: 4rem 3.5rem;
      text-align: left;

      h2 { font-size: 2.6rem; font-weight: 700; color: #333; text-align: center; margin-bottom: 0.5rem; }
    }

    .icono-bienvenida, .icono-login {
      margin: 0 auto 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #39A900, #2d8600);
      color: white;
      box-shadow: 0 8px 24px rgba(57,169,0,0.35);
    }

    .icono-bienvenida { width: 110px; height: 110px; font-size: 5rem; }
    .icono-login { width: 90px; height: 90px; font-size: 4rem; }

    .subtitulo-login {
      font-size: 1.4rem;
      color: #666;
      text-align: center;
      margin-bottom: 3rem;
    }

    .botones-bienvenida {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .btn-principal, .btn-secundario {
      padding: 1.5rem 3rem;
      border-radius: 10px;
      font-size: 1.6rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      transition: all 0.3s ease;
      font-family: 'Work Sans', sans-serif;
      border: none;
    }

    .btn-principal {
      background: linear-gradient(135deg, #39A900, #2d8600);
      color: white;
      box-shadow: 0 4px 12px rgba(57,169,0,0.3);
      &:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(57,169,0,0.4); }
    }

    .btn-secundario {
      background: white;
      color: #39A900;
      border: 2px solid #39A900 !important;
      &:hover { background: #39A900; color: white; }
    }

    .btn-volver {
      position: fixed;
      top: 2rem;
      left: 2rem;
      background: rgba(255,255,255,0.9);
      border: none;
      padding: 1rem 2rem;
      border-radius: 10px;
      font-size: 1.5rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      transition: all 0.3s ease;
      z-index: 10;
      font-family: 'Work Sans', sans-serif;
      &:hover { background: white; transform: translateX(-4px); }
    }

    .form-group {
      margin-bottom: 2rem;

      label {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-size: 1.4rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 0.8rem;
        i { color: #39A900; }
      }

      input {
        width: 100%;
        padding: 1.2rem 1.5rem;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1.5rem;
        font-family: 'Work Sans', sans-serif;
        transition: all 0.3s;
        &:focus { outline: none; border-color: #39A900; box-shadow: 0 0 0 3px rgba(57,169,0,0.1); }
      }
    }

    .input-password {
      position: relative;
      input { padding-right: 5rem; }
    }

    .btn-toggle-pass {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #666;
      font-size: 1.8rem;
      cursor: pointer;
      padding: 0.5rem;
      &:hover { color: #39A900; }
    }

    .btn-login {
      width: 100%;
      padding: 1.5rem;
      background: linear-gradient(135deg, #39A900, #2d8600);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1.6rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      transition: all 0.3s;
      margin-top: 2rem;
      box-shadow: 0 4px 12px rgba(57,169,0,0.3);
      font-family: 'Work Sans', sans-serif;
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(57,169,0,0.4); }
      &:disabled { opacity: 0.65; cursor: not-allowed; }
    }

    .alert-error {
      background: #fff3f3;
      border: 1px solid #f44336;
      border-left: 4px solid #f44336;
      padding: 1.2rem 1.5rem;
      border-radius: 8px;
      font-size: 1.4rem;
      color: #c62828;
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .error-msg {
      color: #f44336;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .spinner-sm {
      width: 1.8rem;
      height: 1.8rem;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  view = signal<View>('welcome');
  showPassword = signal(false);
  loading = signal(false);
  errorMsg = signal('');

  loginForm = this.fb.group({
    numero_documento: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  showLogin(): void {
    this.view.set('login');
    this.errorMsg.set('');
  }

  loginAsGuest(): void {
    this.router.navigate(['/dashboard']);
  }

  togglePassword(): void { this.showPassword.update((v) => !v); }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const credentials = this.loginForm.value as { numero_documento: string; contrasena: string };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.toast.success('¡Bienvenido al Sistema Avícola!');
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.errorMsg.set(err.message || 'Credenciales inválidas');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
