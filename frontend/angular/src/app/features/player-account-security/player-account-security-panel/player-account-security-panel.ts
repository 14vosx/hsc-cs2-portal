import { Component, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { disabled, form, FormField, required, submit, validateTree } from '@angular/forms/signals';

import type { PlayerAccountSummary } from '../../player/domain/player-account.model';
import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { PlayerIdentityLinkApiService } from '../../player/data-access/player-identity-link-api.service';
import { mapPlayerEmailAuthError } from '../../player-auth/player-email-auth-error';
import { mapEmailLinkRequestError } from '../player-account-security-error';

interface EmailLinkFormModel {
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-player-account-security-panel',
  standalone: true,
  imports: [FormField, TranslatePipe],
  templateUrl: './player-account-security-panel.html',
  styleUrl: './player-account-security-panel.css',
})
export class PlayerAccountSecurityPanel {
  private readonly identityLinkApi = inject(PlayerIdentityLinkApiService);
  private readonly emailAuthApi = inject(PlayerEmailAuthApiService);

  readonly account = input.required<PlayerAccountSummary>();
  readonly steamLinkUrl = input.required<string>();
  readonly steamNotice = input<string | null>(null);
  readonly steamNoticeKind = input<'success' | 'error' | null>(null);

  protected readonly formVisible = signal(false);
  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly passwordResetPending = signal(false);
  protected readonly passwordResetSuccess = signal<string | null>(null);
  protected readonly passwordResetError = signal<string | null>(null);
  protected readonly emailLinkModel = signal<EmailLinkFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  protected readonly emailLinkForm = form(this.emailLinkModel, (f) => {
    disabled(f.email, { when: () => this.pending() });
    disabled(f.password, { when: () => this.pending() });
    disabled(f.confirmPassword, { when: () => this.pending() });
    required(f.email, { message: 'playerAccount.validation.emailRequired' });
    required(f.password, { message: 'playerAccount.validation.passwordRequired' });
    required(f.confirmPassword, { message: 'playerAccount.validation.confirmPasswordRequired' });
    validateTree(f, (ctx) => {
      const email = ctx.valueOf(f.email).trim();
      const password = ctx.valueOf(f.password);
      const confirmPassword = ctx.valueOf(f.confirmPassword);
      const passwordLength = Array.from(password).length;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
          fieldTree: ctx.fieldTreeOf(f.email),
          kind: 'invalid_email',
          message: 'playerAccount.validation.invalidEmail',
        };
      }
      if (password && (passwordLength < 10 || passwordLength > 128)) {
        return {
          fieldTree: ctx.fieldTreeOf(f.password),
          kind: 'password_length',
          message: 'playerAccount.validation.passwordLength',
        };
      }
      if (confirmPassword && password !== confirmPassword) {
        return {
          fieldTree: ctx.fieldTreeOf(f.confirmPassword),
          kind: 'password_mismatch',
          message: 'playerAccount.validation.passwordMismatch',
        };
      }
      return null;
    });
  });

  protected showEmailLinkForm(): void {
    this.formVisible.set(true);
    this.serverError.set(null);
    this.success.set(null);
  }

  protected cancelEmailLink(): void {
    if (this.pending()) return;
    this.formVisible.set(false);
    this.serverError.set(null);
    this.emailLinkModel.set({ email: '', password: '', confirmPassword: '' });
  }

  protected onMeaningfulEdit(): void {
    if (this.serverError()) this.serverError.set(null);
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.pending()) return;
    await submit(this.emailLinkForm, async (field) => {
      if (this.pending()) return;
      const value = field().value();
      this.pending.set(true);
      this.serverError.set(null);
      this.identityLinkApi
        .requestEmailLink({ email: value.email.trim(), password: value.password })
        .subscribe({
          next: () => {
            this.pending.set(false);
            this.formVisible.set(false);
            this.emailLinkModel.set({ email: '', password: '', confirmPassword: '' });
            this.success.set('playerAccount.emailLink.request.success');
          },
          error: (error: unknown) => {
            this.pending.set(false);
            this.serverError.set(mapEmailLinkRequestError(error));
          },
        });
    });
  }

  protected canRequestPasswordReset(): boolean {
    const emailIdentity = this.account().identities.email;
    return emailIdentity.linked && emailIdentity.verified && Boolean(emailIdentity.email?.trim());
  }

  protected requestPasswordReset(): void {
    if (this.passwordResetPending() || !this.canRequestPasswordReset()) return;
    const email = this.account().identities.email.email;
    if (!email) return;

    this.passwordResetPending.set(true);
    this.passwordResetSuccess.set(null);
    this.passwordResetError.set(null);
    this.emailAuthApi.requestPasswordReset({ email }).subscribe({
      next: () => {
        this.passwordResetPending.set(false);
        this.passwordResetSuccess.set('playerAccount.passwordReset.success');
      },
      error: (error: unknown) => {
        this.passwordResetPending.set(false);
        this.passwordResetError.set(mapPlayerEmailAuthError(error, 'reset-request'));
      },
    });
  }
}
