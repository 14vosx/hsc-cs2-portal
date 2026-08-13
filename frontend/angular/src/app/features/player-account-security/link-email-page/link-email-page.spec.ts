import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerIdentityLinkApiService } from '../../player/data-access/player-identity-link-api.service';
import { LinkEmailPage } from './link-email-page';

describe('LinkEmailPage', () => {
  const api = { confirmEmailLink: vi.fn() };
  const location = { replaceState: vi.fn() };
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  async function create(token: string | null): Promise<ComponentFixture<LinkEmailPage>> {
    await TestBed.configureTestingModule({
      imports: [LinkEmailPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: PlayerIdentityLinkApiService, useValue: api },
        { provide: Location, useValue: location },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
        },
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', LINK_PAGE_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', LINK_PAGE_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const fixture = TestBed.createComponent(LinkEmailPage);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    api.confirmEmailLink.mockReturnValue(of({ ok: true, linked: true, identity: { type: 'email', email: 'player@example.test' } }));
  });

  it('captures, scrubs and confirms a valid token exactly once', async () => {
    const token = 'a'.repeat(64);
    const fixture = await create(token);
    fixture.detectChanges();
    expect(api.confirmEmailLink).toHaveBeenCalledTimes(1);
    expect(api.confirmEmailLink).toHaveBeenCalledWith(token);
    expect(location.replaceState).toHaveBeenCalledWith('/link-email');
    expect(fixture.nativeElement.textContent).toContain('E-mail vinculado com sucesso.');
    expect(fixture.nativeElement.textContent).toContain('Voltar para a Área do Jogador');
    expect(fixture.nativeElement.textContent).not.toContain(token);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it.each([null, 'bad-token', 'A'.repeat(64)])('does not request malformed or missing token %s', async (token) => {
    const fixture = await create(token);
    expect(api.confirmEmailLink).not.toHaveBeenCalled();
    if (token === null) expect(location.replaceState).not.toHaveBeenCalled();
    else expect(location.replaceState).toHaveBeenCalledWith('/link-email');
    expect(fixture.nativeElement.textContent).toContain('inválido ou expirado');
  });

  it.each([
    [400, 'invalid_link_intent', 'inválido ou expirado'],
    [409, 'identity_conflict', 'outra conta HSC'],
    [403, 'player_account_disabled', 'Esta conta está indisponível para acesso.'],
    [501, 'player_email_auth_unavailable', 'temporariamente indisponível'],
    [500, 'email_link_failed', 'Tente novamente mais tarde'],
  ])('maps confirmation failure %s safely', async (status, code, expected) => {
    api.confirmEmailLink.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status, error: { error: code } })),
    );
    const fixture = await create('b'.repeat(64));
    expect(fixture.nativeElement.textContent).toContain(expected);
    expect(fixture.nativeElement.textContent).not.toContain(code);
  });

  it('presents the identity workspace copy', async () => {
    const fixture = await create(null);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('HSC Account Security');
    expect(text).toContain('Vínculo');
    expect(text).toContain('de identidade');
    expect(text).toContain('Link indisponível');
  });

  it('switches locale on the same successful instance without repeating confirmation', async () => {
    const token = 'c'.repeat(64);
    const fixture = await create(token);
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Identity linking');
    expect(text).toContain('Email linked successfully.');
    expect(text).toContain('Back to Player Area');
    expect(text).not.toContain('playerAccount.');
    expect(text).not.toContain(token);
    expect(api.confirmEmailLink).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});

const linkPageDictionary = (english: boolean) => ({ playerAccount: { emailLink: { confirmation: {
  workspace: { eyebrow: 'HSC Account Security', title: english ? 'Identity linking' : 'Vínculo de identidade', lead: english ? 'We are confirming the email.' : 'Estamos confirmando o e-mail que será associado à sua conta HSC.' },
  protocol: { ariaLabel: english ? 'Identity linking protocol' : 'Protocolo de vínculo de identidade', request: { title: english ? 'Request' : 'Solicitação', description: english ? 'Linking was started from the Player Area.' : 'O vínculo foi iniciado pela Área do Jogador.' }, confirm: { title: english ? 'Confirmation' : 'Confirmação', description: english ? 'The link validates the requested email.' : 'O link valida o endereço de e-mail solicitado.' }, identity: { title: english ? 'Identity' : 'Identidade', description: english ? 'The confirmed address becomes part of your account.' : 'O endereço confirmado passa a integrar sua conta HSC.' } },
  loading: { eyebrow: english ? 'Linking in progress' : 'Vínculo em andamento', title: english ? 'Confirming email' : 'Confirmando e-mail', message: english ? 'We are validating the linking request.' : 'Estamos validando a solicitação de vínculo.' },
  success: { eyebrow: english ? 'Linking complete' : 'Vínculo concluído', title: english ? 'Email linked' : 'E-mail vinculado', message: english ? 'Email linked successfully.' : 'E-mail vinculado com sucesso.' },
  states: { invalid: { eyebrow: 'Confirmation link', title: english ? 'Link unavailable' : 'Link indisponível' }, conflict: { eyebrow: english ? 'Identity conflict' : 'Conflito de identidade', title: english ? 'Linking not completed' : 'Vínculo não realizado' }, disabled: { eyebrow: english ? 'HSC Account' : 'Conta HSC', title: english ? 'Operation unavailable' : 'Operação indisponível' }, service: { eyebrow: english ? 'Identity service' : 'Serviço de identidade', title: english ? 'Could not complete' : 'Não foi possível concluir' } },
  errors: { invalid: english ? 'The linking link is invalid or expired.' : 'Link de vínculo inválido ou expirado.', conflict: english ? 'This email is already linked to another HSC account.' : 'Este e-mail já está vinculado a outra conta HSC.', disabled: english ? 'This account is unavailable for access.' : 'Esta conta está indisponível para acesso.', unavailable: english ? 'Email linking is temporarily unavailable.' : 'O vínculo por e-mail está temporariamente indisponível.', generic: english ? 'Could not complete linking right now. Try again later.' : 'Não foi possível concluir o vínculo agora. Tente novamente mais tarde.' },
  back: english ? 'Back to Player Area' : 'Voltar para a Área do Jogador',
} } } });
const LINK_PAGE_TRANSLATIONS = { 'pt-BR': linkPageDictionary(false), 'en-US': linkPageDictionary(true) } as const;
