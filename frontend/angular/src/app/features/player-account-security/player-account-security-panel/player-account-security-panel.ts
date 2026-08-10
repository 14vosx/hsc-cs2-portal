import { Component, inject, input, signal } from '@angular/core';
import { disabled, form, FormField, required, submit, validateTree } from '@angular/forms/signals';

import type { PlayerAccountSummary } from '../../player/domain/player-account.model';
import { PlayerIdentityLinkApiService } from '../../player/data-access/player-identity-link-api.service';
import { mapEmailLinkRequestError } from '../player-account-security-error';

interface EmailLinkFormModel {
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-player-account-security-panel',
  standalone: true,
  imports: [FormField],
  templateUrl: './player-account-security-panel.html',
  styleUrl: './player-account-security-panel.css',
})
export class PlayerAccountSecurityPanel {
  private readonly identityLinkApi = inject(PlayerIdentityLinkApiService);

  readonly account = input.required<PlayerAccountSummary>();
  readonly steamLinkUrl = input.required<string>();
  readonly steamNotice = input<string | null>(null);

  protected readonly formVisible = signal(false);
  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly emailLinkModel = signal<EmailLinkFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  protected readonly emailLinkForm = form(this.emailLinkModel, (f) => {
    disabled(f.email, { when: () => this.pending() });
    disabled(f.password, { when: () => this.pending() });
    disabled(f.confirmPassword, { when: () => this.pending() });
    required(f.email, { message: 'Informe seu e-mail.' });
    required(f.password, { message: 'Informe uma senha.' });
    required(f.confirmPassword, { message: 'Confirme a senha.' });
    validateTree(f, (ctx) => {
      const email = ctx.valueOf(f.email).trim();
      const password = ctx.valueOf(f.password);
      const confirmPassword = ctx.valueOf(f.confirmPassword);
      const passwordLength = Array.from(password).length;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
          fieldTree: ctx.fieldTreeOf(f.email),
          kind: 'invalid_email',
          message: 'Informe um endereço de e-mail válido.',
        };
      }
      if (password && (passwordLength < 10 || passwordLength > 128)) {
        return {
          fieldTree: ctx.fieldTreeOf(f.password),
          kind: 'password_length',
          message: 'A senha deve ter entre 10 e 128 caracteres.',
        };
      }
      if (confirmPassword && password !== confirmPassword) {
        return {
          fieldTree: ctx.fieldTreeOf(f.confirmPassword),
          kind: 'password_mismatch',
          message: 'As senhas não coincidem.',
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
            this.success.set(
              'Solicitação recebida. Se este endereço puder ser vinculado, enviaremos uma confirmação por e-mail.',
            );
          },
          error: (error: unknown) => {
            this.pending.set(false);
            this.serverError.set(mapEmailLinkRequestError(error));
          },
        });
    });
  }
}
