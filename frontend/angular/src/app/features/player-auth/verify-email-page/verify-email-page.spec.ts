import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
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

  it('switches locale on the same pending verification without changing semantics', async () => {
    api.verify.mockReturnValue(new Subject());
    await create();
    const translate = TestBed.inject(TranslateService);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Confirmando e-mail');
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Confirming email');
    expect(text).not.toContain('playerAuth.');
    expect(text).not.toContain(token);
    expect(api.verify).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).not.toHaveBeenCalled();
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
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    const englishText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(englishText).toContain('This account is unavailable for access.');
    expect(englishText).not.toContain('Try again');
    expect(api.verify).toHaveBeenCalledTimes(1);
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
    translate.setTranslation('pt-BR', VERIFY_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', VERIFY_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(VerifyEmailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

const verifyDictionary = (english: boolean) => ({ playerAuth: {
  errors: {
    generic: english ? 'Could not complete the operation right now.' : 'Não foi possível concluir a operação agora.',
    accountDisabled: english ? 'This account is unavailable for access.' : 'Esta conta está indisponível para acesso.',
  },
  verifyEmail: {
    workspace: { eyebrow: 'HSC Account Security', title: english ? 'Identity verification' : 'Verificação de identidade', lead: english ? 'Confirming your email.' : 'Confirmando seu e-mail.' },
    protocol: { ariaLabel: english ? 'Identity verification protocol' : 'Protocolo de verificação', secureLink: { title: english ? 'Secure link' : 'Link seguro', description: english ? 'Use the sent link.' : 'Use o link enviado.' }, verification: { title: english ? 'Verification' : 'Verificação', description: english ? 'HSC validates it.' : 'A HSC valida.' }, access: { title: english ? 'Access' : 'Acesso', description: english ? 'Continue to Player Area.' : 'Continue para a Área do Jogador.' } },
    loading: { eyebrow: english ? 'Verification in progress' : 'Verificação em andamento', title: english ? 'Confirming email' : 'Confirmando e-mail', message: english ? 'Validating your email.' : 'Estamos validando seu endereço de e-mail.' },
    success: { eyebrow: english ? 'Identity confirmed' : 'Identidade confirmada', title: english ? 'Email verified' : 'E-mail verificado', message: english ? 'Address confirmed.' : 'Endereço confirmado.', navigationPending: english ? 'Entering Player Area...' : 'Entrando na Área do Jogador...' },
    invalid: { eyebrow: english ? 'Verification link' : 'Link de verificação', title: english ? 'Link unavailable' : 'Link indisponível' },
    error: { eyebrow: english ? 'Verification interrupted' : 'Verificação interrompida', title: english ? 'Could not confirm' : 'Não foi possível confirmar' },
    errors: { invalidLink: english ? 'The verification link is invalid or expired.' : 'Link de verificação inválido ou expirado.' },
    actions: { backToLogin: english ? 'Back to sign in' : 'Voltar para entrar', retry: english ? 'Try again' : 'Tentar novamente' },
  },
} });
const VERIFY_TRANSLATIONS = { 'pt-BR': verifyDictionary(false), 'en-US': verifyDictionary(true) } as const;
