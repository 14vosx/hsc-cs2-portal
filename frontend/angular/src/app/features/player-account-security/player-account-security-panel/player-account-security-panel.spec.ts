import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { PlayerIdentityLinkApiService } from '../../player/data-access/player-identity-link-api.service';
import type { PlayerAccountSummary } from '../../player/domain/player-account.model';
import { PlayerAccountSecurityPanel } from './player-account-security-panel';

const account = (
  emailLinked: boolean,
  steamLinked: boolean,
  emailVerified = emailLinked,
  email: string | null = emailLinked ? 'player@example.test' : null,
): PlayerAccountSummary => ({
  status: 'active',
  identities: {
    email: { linked: emailLinked, email, verified: emailVerified },
    steam: { linked: steamLinked, steamId64: steamLinked ? '76561198000000001' : null },
  },
  capabilities: {
    cs2Identity: { ready: steamLinked, reason: steamLinked ? null : 'steam_link_required' },
    personalizedStats: { available: steamLinked, reason: steamLinked ? null : 'steam_link_required' },
  },
});

describe('PlayerAccountSecurityPanel', () => {
  let fixture: ComponentFixture<PlayerAccountSecurityPanel>;
  const api = { requestEmailLink: vi.fn() };
  const emailAuthApi = { requestPasswordReset: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    api.requestEmailLink.mockReturnValue(of({ ok: true, verificationRequired: true }));
    emailAuthApi.requestPasswordReset.mockReturnValue(of({ ok: true, message: 'generic' }));
    await TestBed.configureTestingModule({
      imports: [PlayerAccountSecurityPanel],
      providers: [
        { provide: PlayerIdentityLinkApiService, useValue: api },
        { provide: PlayerEmailAuthApiService, useValue: emailAuthApi },
        provideTranslateService(),
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', PANEL_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', PANEL_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
    fixture = TestBed.createComponent(PlayerAccountSecurityPanel);
    fixture.componentRef.setInput('account', account(false, false));
    fixture.componentRef.setInput('steamLinkUrl', '/player/auth/steam/link/start');
    fixture.detectChanges();
  });

  it('renders linked identity details and no linking actions', () => {
    fixture.componentRef.setInput('account', account(true, true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('player@example.test');
    expect(fixture.nativeElement.textContent).toContain('76561198000000001');
    expect(fixture.nativeElement.textContent).not.toContain('Vincular e-mail');
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('renders password reset for a linked and verified email', () => {
    fixture.componentRef.setInput('account', account(true, false));
    fixture.detectChanges();
    expect(resetPasswordButton()).not.toBeUndefined();
  });

  it('does not render password reset for an unlinked email', () => {
    expect(resetPasswordButton()).toBeUndefined();
  });

  it('does not render password reset for an unverified linked email or a null email value', () => {
    fixture.componentRef.setInput('account', account(true, false, false));
    fixture.detectChanges();
    expect(resetPasswordButton()).toBeUndefined();

    fixture.componentRef.setInput('account', account(true, false, true, null));
    fixture.detectChanges();
    expect(resetPasswordButton()).toBeUndefined();
  });

  it('requests password reset with the exact linked email', () => {
    fixture.componentRef.setInput('account', account(true, false, true, 'Player+CS2@example.test'));
    fixture.detectChanges();
    resetPasswordButton()!.click();
    expect(emailAuthApi.requestPasswordReset).toHaveBeenCalledWith({
      email: 'Player+CS2@example.test',
    });
  });

  it('prevents duplicate password reset requests while pending', () => {
    emailAuthApi.requestPasswordReset.mockReturnValue(new Subject());
    fixture.componentRef.setInput('account', account(true, false));
    fixture.detectChanges();
    const button = resetPasswordButton()!;
    button.click();
    button.click();
    expect(emailAuthApi.requestPasswordReset).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    expect(button.textContent).toContain('Enviando...');
  });

  it('shows generic safe copy after a password reset request succeeds', () => {
    fixture.componentRef.setInput('account', account(true, false));
    fixture.detectChanges();
    resetPasswordButton()!.click();
    fixture.detectChanges();
    const status = fixture.debugElement.query(By.css('[role="status"]'));
    expect(status.nativeElement.textContent).toContain(
      'Solicitação recebida. Se a conta estiver elegível, enviaremos instruções para o e-mail vinculado.',
    );
  });

  it('maps password reset request failures to safe presentation copy', () => {
    emailAuthApi.requestPasswordReset.mockReturnValue(throwError(() => new Error('internal')));
    fixture.componentRef.setInput('account', account(true, false));
    fixture.detectChanges();
    resetPasswordButton()!.click();
    fixture.detectChanges();
    const alert = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(alert.nativeElement.textContent).toContain(
      'Não foi possível concluir a operação agora. Tente novamente.',
    );
    expect(alert.nativeElement.textContent).not.toContain('internal');
  });

  it('translates a reset-request mapped error without changing linked identities or calls', async () => {
    emailAuthApi.requestPasswordReset.mockReturnValue(throwError(() => new Error('internal')));
    fixture.componentRef.setInput('account', account(true, true, true, 'Player+CS2@example.test'));
    fixture.detectChanges();
    resetPasswordButton()!.click();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Não foi possível concluir a operação agora. Tente novamente.');
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    expect(host.textContent).toContain('Could not complete the operation right now. Try again.');
    expect(host.textContent).toContain('Player+CS2@example.test');
    expect(host.textContent).toContain('76561198000000001');
    expect(emailAuthApi.requestPasswordReset).toHaveBeenCalledTimes(1);
    expect(emailAuthApi.requestPasswordReset).toHaveBeenCalledWith({ email: 'Player+CS2@example.test' });
  });

  it('renders the email form and existing Steam URL when unlinked', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/player/auth/steam/link/start');
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const button = Array.from(buttons).find((item) => item.textContent.includes('Vincular e-mail'));
    button!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('validates password length using Unicode code-point boundaries', () => {
    openEmailLinkForm();

    setEmailInput('#email-link-email', 'p@example.test');
    setEmailInput('#email-link-password', '😀'.repeat(9));
    setEmailInput('#email-link-confirm-password', '😀'.repeat(9));
    submitEmailForm();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('A senha deve ter entre 10 e 128 caracteres.');
    expect(api.requestEmailLink).not.toHaveBeenCalled();

    setEmailInput('#email-link-password', '😀'.repeat(10));
    setEmailInput('#email-link-confirm-password', '😀'.repeat(10));
    submitEmailForm();

    expect(host.textContent).not.toContain('A senha deve ter entre 10 e 128 caracteres.');
    expect(api.requestEmailLink).toHaveBeenCalledWith({
      email: 'p@example.test',
      password: '😀'.repeat(10),
    });
  });

  it('validates confirmation mismatch when the primary password is valid', () => {
    openEmailLinkForm();

    setEmailInput('#email-link-email', 'p@example.test');
    setEmailInput('#email-link-password', 'valid-password');
    setEmailInput('#email-link-confirm-password', 'different-password');
    submitEmailForm();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('As senhas não coincidem.');
    expect(api.requestEmailLink).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions and shows generic success', () => {
    const response = new Subject<{ ok: true; verificationRequired: true }>();
    api.requestEmailLink.mockReturnValue(response);

    openEmailLinkForm();
    setEmailInput('#email-link-email', 'p@example.test');
    setEmailInput('#email-link-password', 'long-password');
    setEmailInput('#email-link-confirm-password', 'long-password');

    submitEmailForm();
    submitEmailForm();

    expect(api.requestEmailLink).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Enviando...');

    response.next({ ok: true, verificationRequired: true });
    response.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Solicitação recebida');
    expect(fixture.nativeElement.textContent).not.toContain('p@example.test');
  });

  it('maps request failures to safe presentation copy', () => {
    api.requestEmailLink.mockReturnValue(throwError(() => new Error('internal')));

    openEmailLinkForm();
    setEmailInput('#email-link-email', 'p@example.test');
    setEmailInput('#email-link-password', 'long-password');
    setEmailInput('#email-link-confirm-password', 'long-password');
    submitEmailForm();

    expect(fixture.debugElement.query(By.css('[role="alert"]')).nativeElement.textContent).not.toContain('internal');
  });

  it('uses semantic Steam notice kind for role across locale changes', async () => {
    fixture.componentRef.setInput('steamNotice', 'Steam vinculada com sucesso.');
    fixture.componentRef.setInput('steamNoticeKind', 'success');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.account-security__notice')?.getAttribute('role')).toBe('status');
    fixture.componentRef.setInput('steamNotice', 'Steam linked successfully.');
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.account-security__notice')?.getAttribute('role')).toBe('status');
    fixture.componentRef.setInput('steamNoticeKind', 'error');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.account-security__notice')?.getAttribute('role')).toBe('alert');
  });

  it('switches locale without changing identity, URL, form values, or request payload', async () => {
    openEmailLinkForm();
    setEmailInput('#email-link-email', ' Player+CS2@example.test ');
    setEmailInput('#email-link-password', 'canonical-password');
    setEmailInput('#email-link-confirm-password', 'canonical-password');

    const host = fixture.nativeElement as HTMLElement;
    const emailBeforeLocaleSwitch = (host.querySelector('#email-link-email') as HTMLInputElement).value;
    const passwordBeforeLocaleSwitch = (host.querySelector('#email-link-password') as HTMLInputElement).value;
    const confirmationBeforeLocaleSwitch = (host.querySelector('#email-link-confirm-password') as HTMLInputElement).value;
    const steamHrefBeforeLocaleSwitch = (host.querySelector('a') as HTMLAnchorElement).getAttribute('href');

    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();

    expect(host.textContent).toContain('Account and security');
    expect((host.querySelector('#email-link-email') as HTMLInputElement).value).toBe(emailBeforeLocaleSwitch);
    expect((host.querySelector('#email-link-password') as HTMLInputElement).value).toBe(passwordBeforeLocaleSwitch);
    expect((host.querySelector('#email-link-confirm-password') as HTMLInputElement).value).toBe(confirmationBeforeLocaleSwitch);
    expect((host.querySelector('a') as HTMLAnchorElement).getAttribute('href')).toBe(steamHrefBeforeLocaleSwitch);

    submitEmailForm();
    expect(api.requestEmailLink).toHaveBeenCalledWith({ email: 'Player+CS2@example.test', password: 'canonical-password' });
  });

  function resetPasswordButton(): HTMLButtonElement | undefined {
    return Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent.includes('Redefinir senha'));
  }

  function openEmailLinkForm(): void {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    const linkBtn = buttons.find((b) => b.textContent.includes('Vincular e-mail'));
    linkBtn?.click();
    fixture.detectChanges();
  }

  function setEmailInput(selector: string, value: string): void {
    const inputEl = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    inputEl.value = value;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function submitEmailForm(): void {
    const formEl = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    fixture.detectChanges();
  }
});

const panelDictionary = (english: boolean) => ({ playerAccount: {
  security: { eyebrow: english ? 'Account and security' : 'Conta e segurança', title: english ? 'Access identities' : 'Identidades de acesso', active: english ? 'Active account' : 'Conta ativa' },
  email: { label: english ? 'Email' : 'E-mail', verified: english ? 'Linked and verified' : 'Vinculado e verificado', pendingVerification: english ? 'Linked · verification pending' : 'Vinculado · verificação pendente', notLinked: english ? 'No email linked.' : 'Nenhum e-mail vinculado.', link: english ? 'Link email' : 'Vincular e-mail' },
  passwordReset: { action: english ? 'Reset password' : 'Redefinir senha', pending: english ? 'Sending...' : 'Enviando...', success: english ? 'Request received.' : 'Solicitação recebida. Se a conta estiver elegível, enviaremos instruções para o e-mail vinculado.' },
  steam: { linked: english ? 'Linked' : 'Vinculada', notLinked: english ? 'No Steam account linked.' : 'Nenhuma conta Steam vinculada.', link: english ? 'Link Steam' : 'Vincular Steam' },
  validation: { emailRequired: 'Informe seu e-mail.', passwordRequired: 'Informe uma senha.', confirmPasswordRequired: 'Confirme a senha.', invalidEmail: 'Informe um endereço de e-mail válido.', passwordLength: 'A senha deve ter entre 10 e 128 caracteres.', passwordMismatch: 'As senhas não coincidem.' },
  emailLink: { request: { password: english ? 'Password' : 'Senha', confirmPassword: english ? 'Confirm password' : 'Confirmar senha', passwordHint: 'Use de 10 a 128 caracteres.', pending: 'Enviando solicitação...', sending: 'Enviando...', cancel: english ? 'Cancel' : 'Cancelar', submit: english ? 'Send confirmation' : 'Enviar confirmação', success: 'Solicitação recebida. Se este endereço puder ser vinculado, enviaremos uma confirmação por e-mail.', errors: { generic: 'Não foi possível solicitar o vínculo agora. Tente novamente.', invalidSession: '', accountDisabled: '', tooManyRequests: '', unavailable: '' } } },
} });
const PANEL_TRANSLATIONS = {
  'pt-BR': { ...panelDictionary(false), playerAuth: { errors: { generic: 'Não foi possível concluir a operação agora. Tente novamente.' } } },
  'en-US': { ...panelDictionary(true), playerAuth: { errors: { generic: 'Could not complete the operation right now. Try again.' } } },
} as const;
