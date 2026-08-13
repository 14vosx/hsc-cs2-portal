import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerEmailAuthApiService } from '../../player/data-access/player-email-auth-api.service';
import { ResetPasswordPage } from './reset-password-page';

describe('ResetPasswordPage', () => {
  let fixture: ComponentFixture<ResetPasswordPage>;
  const api = { confirmPasswordReset: vi.fn() };
  const location = { replaceState: vi.fn() };
  let token: string | null;

  beforeEach(() => {
    vi.clearAllMocks();
    token = 'b'.repeat(64);
    api.confirmPasswordReset.mockReturnValue(of({ ok: true, passwordReset: true, authenticated: false }));
  });

  it('shows invalid-link state without submitting a missing token', async () => {
    token = null;
    await create();
    expect(api.confirmPasswordReset).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('O link de redefinição é inválido, expirou ou já foi utilizado.');
  });

  it('does not automatically submit a valid token', async () => {
    await create();
    expect(api.confirmPasswordReset).not.toHaveBeenCalled();
    expect(location.replaceState).toHaveBeenCalledWith('/reset-password');
  });

  it('submits matching Unicode-valid passwords and remains unauthenticated on success', async () => {
    await create();
    setInput('reset-password', '😀'.repeat(10));
    setInput('reset-password-confirmation', '😀'.repeat(10));
    submit();
    expect(api.confirmPasswordReset).toHaveBeenCalledWith({
      token: 'b'.repeat(64),
      password: '😀'.repeat(10),
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sua senha HSC foi atualizada com sucesso.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('As sessões anteriores foram encerradas.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Entrar na Área do Jogador');
  });

  it('rejects code-point bounds and mismatched confirmation locally', async () => {
    await create();
    setInput('reset-password', '😀'.repeat(9));
    setInput('reset-password-confirmation', '😀'.repeat(9));
    submit();
    expect(api.confirmPasswordReset).not.toHaveBeenCalled();
    setInput('reset-password', 'abcdefghij');
    setInput('reset-password-confirmation', 'abcdefghik');
    submit();
    expect(api.confirmPasswordReset).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('confirmação deve ser igual');
  });

  it('prevents duplicate confirmation while pending', async () => {
    api.confirmPasswordReset.mockReturnValue(new Subject());
    await create();
    setInput('reset-password', 'abcdefghij');
    setInput('reset-password-confirmation', 'abcdefghij');
    submit();
    submit();
    expect(api.confirmPasswordReset).toHaveBeenCalledTimes(1);
  });

  it.each([
    [400, 'invalid_or_expired_password_reset', 'O link de redefinição é inválido, expirou ou já foi utilizado.'],
    [400, 'invalid_password', 'A senha deve ter entre 10 e 128 caracteres.'],
    [503, 'db_not_ready', 'Não foi possível concluir a operação agora.'],
  ])('maps reset errors without exposing raw codes', async (status, code, message) => {
    api.confirmPasswordReset.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status, error: { error: code } })),
    );
    await create();
    setInput('reset-password', 'abcdefghij');
    setInput('reset-password-confirmation', 'abcdefghij');
    submit();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(message);
    expect(text).not.toContain(code);
  });

  it('switches locale on the same form without changing values, state, or submissions', async () => {
    await create();
    setInput('reset-password', 'Exact-Password😀');
    setInput('reset-password-confirmation', 'Exact-Password😀');
    const host = fixture.nativeElement as HTMLElement;
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    expect(host.textContent).toContain('New credential');
    expect(host.textContent).not.toContain('playerAuth.');
    expect(host.querySelector<HTMLInputElement>('#reset-password')?.value).toBe('Exact-Password😀');
    expect(host.querySelector<HTMLInputElement>('#reset-password-confirmation')?.value).toBe('Exact-Password😀');
    expect(api.confirmPasswordReset).not.toHaveBeenCalled();
    expect(location.replaceState).toHaveBeenCalledTimes(1);
  });

  it('translates a mapped form error on the same component instance', async () => {
    api.confirmPasswordReset.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 503, error: { error: 'db_not_ready' } })),
    );
    await create();
    setInput('reset-password', 'abcdefghij');
    setInput('reset-password-confirmation', 'abcdefghij');
    submit();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Não foi possível concluir a operação agora.');
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Could not complete the operation right now.');
    expect(host.querySelector<HTMLInputElement>('#reset-password')?.value).toBe('abcdefghij');
    expect(host.querySelector<HTMLInputElement>('#reset-password-confirmation')?.value).toBe('abcdefghij');
    expect(api.confirmPasswordReset).toHaveBeenCalledTimes(1);
  });

  async function create(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: PlayerEmailAuthApiService, useValue: api },
        { provide: Location, useValue: location },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ token }) } },
        },
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', RESET_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', RESET_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
    fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

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
});

const resetDictionary = (english: boolean) => ({ playerAuth: {
  hints: { passwordLength: english ? 'Use 10 to 128 characters.' : 'Use de 10 a 128 caracteres.' },
  validation: { passwordLength: english ? 'The password must be between 10 and 128 characters.' : 'A senha deve ter entre 10 e 128 caracteres.', passwordMismatch: english ? 'The confirmation must match.' : 'A confirmação deve ser igual.' },
  errors: { generic: english ? 'Could not complete the operation right now.' : 'Não foi possível concluir a operação agora.', invalidPassword: english ? 'The password must be between 10 and 128 characters.' : 'A senha deve ter entre 10 e 128 caracteres.' },
  resetPassword: {
    workspace: { eyebrow: 'HSC Account Security', title: english ? 'Access recovery' : 'Recuperação de acesso', lead: english ? 'Set a new password.' : 'Defina uma nova senha.' },
    protocol: { ariaLabel: english ? 'Access recovery process' : 'Processo de recuperação', request: { title: english ? 'Request' : 'Solicitação', description: english ? 'Use the email link.' : 'Use o link do e-mail.' }, newPassword: { title: english ? 'New password' : 'Nova senha', description: english ? 'Set a credential.' : 'Defina uma credencial.' }, newLogin: { title: english ? 'New sign-in' : 'Novo login', description: english ? 'Sign in again.' : 'Entre novamente.' } },
    invalid: { eyebrow: english ? 'Recovery link' : 'Link de recuperação', title: english ? 'Link unavailable' : 'Link indisponível' },
    success: { eyebrow: english ? 'Change complete' : 'Alteração concluída', title: english ? 'Password reset' : 'Senha redefinida', message: english ? 'Your HSC password was updated successfully.' : 'Sua senha HSC foi atualizada com sucesso.', securityNotice: english ? 'Previous sessions were ended.' : 'As sessões anteriores foram encerradas.' },
    form: { eyebrow: english ? 'HSC Account' : 'Conta HSC', title: english ? 'New credential' : 'Nova credencial', passwordLabel: english ? 'New password' : 'Nova senha', confirmationLabel: english ? 'Confirm new password' : 'Confirmar nova senha' },
    security: { title: english ? 'Security' : 'Segurança', formNotice: english ? 'Active sessions will be ended.' : 'Sessões ativas serão encerradas.' },
    errors: { invalidLink: english ? 'The password reset link is invalid.' : 'O link de redefinição é inválido, expirou ou já foi utilizado.' },
    actions: { backToLogin: english ? 'Back to sign in' : 'Voltar para entrar', enterPlayerArea: english ? 'Enter the Player Area' : 'Entrar na Área do Jogador', pending: english ? 'Resetting...' : 'Redefinindo...', submit: english ? 'Reset password' : 'Redefinir senha' },
  },
} });
const RESET_TRANSLATIONS = { 'pt-BR': resetDictionary(false), 'en-US': resetDictionary(true) } as const;
