import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PlayerEmailAuthApiService,
  PlayerEmailAuthContractError,
} from '../../player/data-access/player-email-auth-api.service';
import { VerifyEmailPage } from './verify-email-page';

describe('VerifyEmailPage', () => {
  let fixture: ComponentFixture<VerifyEmailPage>;
  const api = { verify: vi.fn() };
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  const location = { replaceState: vi.fn() };
  let token: string | null;

  beforeEach(() => {
    vi.clearAllMocks();
    token = 'a'.repeat(64);
  });

  it('does not request verification for a missing or malformed token', async () => {
    token = null;
    await create();
    expect(api.verify).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('inválido ou expirado');
  });

  it('captures a valid token, removes it from the URL, and verifies exactly once', async () => {
    const response = new Subject<never>();
    api.verify.mockReturnValue(response);
    await create();
    expect(api.verify).toHaveBeenCalledTimes(1);
    expect(api.verify).toHaveBeenCalledWith({ token: 'a'.repeat(64) });
    expect(location.replaceState).toHaveBeenCalledWith('/verify-email');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Confirmando e-mail');
    expect(text).toContain('Estamos validando seu endereço de e-mail.');
    expect(text).not.toContain(token);
  });

  it('navigates to the authoritative Player Area flow after success', async () => {
    api.verify.mockReturnValue({ subscribe: (observer: { next(): void }) => observer.next() });
    await create();
    expect(navigateByUrl).toHaveBeenCalledWith('/area-do-jogador');
  });

  it.each([
    [400, 'invalid_or_expired_verification', 'Link de verificação inválido ou expirado.'],
    [403, 'player_account_disabled', 'Esta conta está indisponível para acesso.'],
  ])('maps verification HTTP errors without exposing raw values', async (status, code, message) => {
    api.verify.mockReturnValue(throwError(() => new HttpErrorResponse({ status, error: { error: code } })));
    await create();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(message);
    expect(text).not.toContain(code);
  });

  it('does not offer retry when the account is disabled', async () => {
    api.verify.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 403,
      error: { error: 'player_account_disabled' },
    })));
    await create();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Não foi possível confirmar');
    expect(text).not.toContain('Tentar novamente');
  });

  it('handles malformed success generically and permits retry', async () => {
    api.verify.mockReturnValue(throwError(() => new PlayerEmailAuthContractError('details')));
    await create();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tentar novamente');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('details');
  });

  it('handles a temporary failure generically and permits retry', async () => {
    api.verify.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 503, error: { error: 'db_not_ready' } })),
    );
    await create();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Não foi possível concluir a operação agora.');
    expect(text).toContain('Tentar novamente');
    expect(text).not.toContain('db_not_ready');
  });

  async function create(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [VerifyEmailPage],
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
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(VerifyEmailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});
