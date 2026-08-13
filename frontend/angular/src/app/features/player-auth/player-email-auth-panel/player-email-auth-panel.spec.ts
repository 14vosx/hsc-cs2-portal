import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { PlayerEmailAuthPanel } from './player-email-auth-panel';

describe('PlayerEmailAuthPanel', () => {
  let fixture: ComponentFixture<PlayerEmailAuthPanel>;
  const api = {
    login: vi.fn(),
    register: vi.fn(),
    requestPasswordReset: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    api.login.mockReturnValue(of({ ok: true, authenticated: true, session: { issued: true } }));
    api.register.mockReturnValue(of({ ok: true, verificationRequired: true }));
    api.requestPasswordReset.mockReturnValue(of({ ok: true, message: 'generic' }));
    await TestBed.configureTestingModule({
      imports: [PlayerEmailAuthPanel],
      providers: [provideTranslateService(), { provide: PlayerEmailAuthApiService, useValue: api }],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', AUTH_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', AUTH_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
    fixture = TestBed.createComponent(PlayerEmailAuthPanel);
    fixture.componentRef.setInput('steamLoginUrl', '/player/auth/steam/start');
    fixture.detectChanges();
  });

  it('renders login and keeps Steam available', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Entre para acessar sua área');
    expect(element.querySelector<HTMLAnchorElement>('a')?.href).toContain('/player/auth/steam/start');
    expect(element.querySelector('label[for="player-auth-email"]')).toBeTruthy();
    expect(element.querySelector('label[for="player-auth-password"]')).toBeTruthy();
    expect(element.querySelector<HTMLInputElement>('#player-auth-email')?.autocomplete).toBe('email');
    expect(element.querySelector<HTMLInputElement>('#player-auth-password')?.autocomplete).toBe('current-password');
  });

  it('submits normalized login credentials and emits authentication', () => {
    const emitted = vi.fn();
    fixture.componentInstance.authenticated.subscribe(emitted);
    setInput('player-auth-email', ' player@example.test ');
    setInput('player-auth-password', 'password-10');
    submit();
    expect(api.login).toHaveBeenCalledWith({ email: 'player@example.test', password: 'password-10' });
    expect(emitted).toHaveBeenCalledOnce();
  });

  it('prevents a duplicate pending login', () => {
    api.login.mockReturnValue(new Subject());
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'password-10');
    submit();
    submit();
    expect(api.login).toHaveBeenCalledTimes(1);
  });

  it('maps invalid credentials without exposing the backend code', () => {
    api.login.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 401,
      error: { error: 'invalid_credentials' },
    })));
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'wrong-password');
    submit();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('E-mail ou senha inválidos.');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('invalid_credentials');
  });

  it('explains when email verification is still required', () => {
    api.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { error: 'email_not_verified' },
          }),
      ),
    );
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'password-10');
    submit();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'e-mail ainda precisa ser verificado',
    );
  });

  it('registers without an empty optional display name and shows privacy-safe copy', () => {
    clickButton('Criar conta');
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', '😀'.repeat(10));
    submit();
    expect(api.register).toHaveBeenCalledWith({ email: 'player@example.test', password: '😀'.repeat(10) });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Se este endereço puder ser utilizado');
  });

  it('maps registration field errors in the presentation layer', () => {
    api.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { error: 'invalid_display_name' },
          }),
      ),
    );
    clickButton('Criar conta');
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'password-10');
    setInput('player-auth-display-name', 'Invalid');
    submit();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Informe um nome de exibição válido.',
    );
  });

  it('requests reset instructions with generic success and can return to login', () => {
    clickButton('Esqueci minha senha');
    setInput('player-auth-email', 'unknown@example.test');
    submit();
    expect(api.requestPasswordReset).toHaveBeenCalledWith({ email: 'unknown@example.test' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Se a conta estiver apta');
    clickButton('Voltar para entrar');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Entre para acessar sua área');
  });

  it('switches locale at runtime without changing form values or making an API request', async () => {
    clickButton('Criar conta');
    setInput('player-auth-email', 'player@example.test');
    setInput('player-auth-password', 'password-10');
    setInput('player-auth-display-name', 'Player CS2');
    const element = fixture.nativeElement as HTMLElement;
    const steamHref = element.querySelector<HTMLAnchorElement>('a')?.getAttribute('href');
    const translate = TestBed.inject(TranslateService);
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    expect(element.textContent).toContain('Create your account');
    expect(element.querySelector<HTMLInputElement>('#player-auth-email')?.value).toBe('player@example.test');
    expect(element.querySelector<HTMLInputElement>('#player-auth-password')?.value).toBe('password-10');
    expect(element.querySelector<HTMLInputElement>('#player-auth-display-name')?.value).toBe('Player CS2');
    expect(element.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toBe(steamHref);
    expect(api.login).not.toHaveBeenCalled();
    expect(api.register).not.toHaveBeenCalled();
  });

  it('translates a mapped error across locale changes without changing auth state', async () => {
    api.login.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 401,
      error: { error: 'invalid_credentials' },
    })));
    setInput('player-auth-email', 'Player@example.test');
    setInput('player-auth-password', 'exact-password');
    submit();
    const host = fixture.nativeElement as HTMLElement;
    const steamHref = host.querySelector<HTMLAnchorElement>('a')!.getAttribute('href');
    expect(host.textContent).toContain('E-mail ou senha inválidos.');
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    expect(host.textContent).toContain('Invalid email or password.');
    expect(host.querySelector<HTMLInputElement>('#player-auth-email')?.value).toBe('Player@example.test');
    expect(host.querySelector<HTMLInputElement>('#player-auth-password')?.value).toBe('exact-password');
    expect(host.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toBe(steamHref);
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(api.login).toHaveBeenCalledWith({ email: 'Player@example.test', password: 'exact-password' });
  });

  function setInput(id: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));
    fixture.detectChanges();
  }

  function clickButton(text: string): void {
    const button = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((candidate) => candidate.textContent?.trim() === text)!;
    button.click();
    fixture.detectChanges();
  }
});

const AUTH_TRANSLATIONS = {
  'pt-BR': { playerAuth: { eyebrow: 'Conta HSC', headings: { registration: 'Crie sua conta', resetRequest: 'Redefina sua senha', login: 'Entre para acessar sua área' }, notices: { received: 'Solicitação recebida' }, fields: { email: 'E-mail', password: 'Senha', displayName: 'Nome de exibição', optional: '(opcional)' }, hints: { passwordLength: 'Use de 10 a 128 caracteres.' }, validation: { emailRequired: 'Informe seu e-mail.', passwordRequired: 'Informe sua senha.', passwordLength: 'A senha deve ter entre 10 e 128 caracteres.' }, errors: { invalidCredentials: 'E-mail ou senha inválidos.', emailNotVerified: 'Seu e-mail ainda precisa ser verificado antes do acesso.', invalidDisplayName: 'Informe um nome de exibição válido.' }, registration: { success: 'Cadastro recebido. Se este endereço puder ser utilizado, enviaremos as instruções de verificação por e-mail.' }, resetRequest: { success: 'Se a conta estiver apta, enviaremos instruções para redefinir a senha.' }, alternative: 'ou', actions: { pending: 'Aguarde...', createAccount: 'Criar conta', sendInstructions: 'Enviar instruções', login: 'Entrar', forgotPassword: 'Esqueci minha senha', backToLogin: 'Voltar para entrar', loginWithSteam: 'Entrar com Steam' } } },
  'en-US': { playerAuth: { eyebrow: 'HSC Account', headings: { registration: 'Create your account', resetRequest: 'Reset your password', login: 'Sign in to access your area' }, notices: { received: 'Request received' }, fields: { email: 'Email', password: 'Password', displayName: 'Display name', optional: '(optional)' }, hints: { passwordLength: 'Use 10 to 128 characters.' }, validation: { emailRequired: 'Enter your email.', passwordRequired: 'Enter your password.', passwordLength: 'The password must be between 10 and 128 characters.' }, errors: { invalidCredentials: 'Invalid email or password.', emailNotVerified: 'Your email still needs verification.', invalidDisplayName: 'Enter a valid display name.' }, registration: { success: 'Registration received.' }, resetRequest: { success: 'Reset instructions sent.' }, alternative: 'or', actions: { pending: 'Please wait...', createAccount: 'Create account', sendInstructions: 'Send instructions', login: 'Sign in', forgotPassword: 'Forgot my password', backToLogin: 'Back to sign in', loginWithSteam: 'Sign in with Steam' } } },
} as const;
