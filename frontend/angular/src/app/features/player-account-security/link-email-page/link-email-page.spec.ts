import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
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
        { provide: PlayerIdentityLinkApiService, useValue: api },
        { provide: Location, useValue: location },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
        },
      ],
    }).compileComponents();
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
});
