import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
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

  async function create(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideRouter([]),
        { provide: PlayerEmailAuthApiService, useValue: api },
        { provide: Location, useValue: location },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ token }) } },
        },
      ],
    }).compileComponents();
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
