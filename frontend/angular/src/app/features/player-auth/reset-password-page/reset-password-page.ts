import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { mapPlayerEmailAuthError } from '../player-email-auth-error';
import { isValidPlayerEmailToken, isValidPlayerPassword } from '../player-email-auth-validation';

type ResetPasswordState = 'form' | 'invalid' | 'success';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.css',
})
export class ResetPasswordPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly emailAuthApi = inject(PlayerEmailAuthApiService);

  protected readonly state = signal<ResetPasswordState>('form');
  protected readonly password = signal('');
  protected readonly confirmation = signal('');
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  private token: string | null = null;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? null;
    if (!isValidPlayerEmailToken(token)) {
      this.state.set('invalid');
      return;
    }
    this.token = token;
    this.location.replaceState('/reset-password');
  }

  protected updatePassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
    this.clearError();
  }

  protected updateConfirmation(event: Event): void {
    this.confirmation.set((event.target as HTMLInputElement).value);
    this.clearError();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.pending() || !this.token) return;

    if (!isValidPlayerPassword(this.password())) {
      this.error.set('playerAuth.validation.passwordLength');
      return;
    }
    if (this.password() !== this.confirmation()) {
      this.error.set('playerAuth.validation.passwordMismatch');
      return;
    }

    this.pending.set(true);
    this.error.set(null);
    this.emailAuthApi.confirmPasswordReset({ token: this.token, password: this.password() }).subscribe({
      next: () => {
        this.pending.set(false);
        this.password.set('');
        this.confirmation.set('');
        this.state.set('success');
      },
      error: (error: unknown) => {
        this.pending.set(false);
        const presentation = mapPlayerEmailAuthError(error, 'reset-confirm');
        if (presentation.kind === 'invalid-password-reset-link') this.state.set('invalid');
        else this.error.set(presentation.messageKey);
      },
    });
  }

  private clearError(): void {
    if (this.error()) this.error.set(null);
  }
}
