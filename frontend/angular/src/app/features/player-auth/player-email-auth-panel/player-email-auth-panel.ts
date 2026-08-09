import { Component, inject, input, output, signal } from '@angular/core';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { mapPlayerEmailAuthError } from '../player-email-auth-error';
import { isValidPlayerPassword } from '../player-email-auth-validation';

type AuthPanelMode = 'login' | 'registration' | 'reset-request';

@Component({
  selector: 'app-player-email-auth-panel',
  standalone: true,
  templateUrl: './player-email-auth-panel.html',
  styleUrl: './player-email-auth-panel.css',
})
export class PlayerEmailAuthPanel {
  private readonly emailAuthApi = inject(PlayerEmailAuthApiService);

  readonly steamLoginUrl = input.required<string>();
  readonly authenticated = output<void>();

  protected readonly mode = signal<AuthPanelMode>('login');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly displayName = signal('');
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected setMode(mode: AuthPanelMode): void {
    if (this.pending()) return;
    this.mode.set(mode);
    this.password.set('');
    this.displayName.set('');
    this.error.set(null);
    this.success.set(null);
  }

  protected updateEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
    this.clearError();
  }

  protected updatePassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
    this.clearError();
  }

  protected updateDisplayName(event: Event): void {
    this.displayName.set((event.target as HTMLInputElement).value);
    this.clearError();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.pending()) return;

    const email = this.email().trim();
    if (!email) {
      this.error.set('Informe seu e-mail.');
      return;
    }

    if (this.mode() === 'reset-request') {
      this.submitResetRequest(email);
      return;
    }

    const password = this.password();
    if (!password) {
      this.error.set('Informe sua senha.');
      return;
    }
    if (this.mode() === 'registration' && !isValidPlayerPassword(password)) {
      this.error.set('A senha deve ter entre 10 e 128 caracteres.');
      return;
    }

    this.pending.set(true);
    this.error.set(null);
    if (this.mode() === 'login') {
      this.emailAuthApi.login({ email, password }).subscribe({
        next: () => {
          this.pending.set(false);
          this.authenticated.emit();
        },
        error: (error: unknown) => this.finishWithError(error, 'login'),
      });
      return;
    }

    const displayName = this.displayName().trim();
    this.emailAuthApi
      .register({ email, password, ...(displayName ? { displayName } : {}) })
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.success.set(
            'Cadastro recebido. Se este endereço puder ser utilizado, enviaremos as instruções de verificação por e-mail.',
          );
        },
        error: (error: unknown) => this.finishWithError(error, 'registration'),
      });
  }

  private submitResetRequest(email: string): void {
    this.pending.set(true);
    this.error.set(null);
    this.emailAuthApi.requestPasswordReset({ email }).subscribe({
      next: () => {
        this.pending.set(false);
        this.success.set('Se a conta estiver apta, enviaremos instruções para redefinir a senha.');
      },
      error: (error: unknown) => this.finishWithError(error, 'reset-request'),
    });
  }

  private finishWithError(error: unknown, operation: 'login' | 'registration' | 'reset-request'): void {
    this.pending.set(false);
    this.error.set(mapPlayerEmailAuthError(error, operation));
  }

  private clearError(): void {
    if (this.error()) this.error.set(null);
  }
}
