import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PlayerAccountSummary } from '../../player/domain/player-account.model';
import type {
  PlayerMembership,
  PlayerMembershipStatus,
} from '../../player/domain/player-membership.model';
import type { PlayerServerAccess } from '../../player/domain/player-server-access.model';
import { PlayerCs2ReadinessPanel } from './player-cs2-readiness-panel';

function account(steamLinked = true, statsAvailable = true): PlayerAccountSummary {
  return {
    status: 'active',
    identities: {
      email: { linked: true, email: 'player@example.test', verified: true },
      steam: { linked: steamLinked, steamId64: steamLinked ? '76561198000000001' : null },
    },
    capabilities: {
      cs2Identity: { ready: steamLinked, reason: steamLinked ? null : 'steam_link_required' },
      personalizedStats: {
        available: statsAvailable,
        reason: statsAvailable ? null : 'steam_link_required',
      },
    },
  };
}

function membership(status: PlayerMembershipStatus): PlayerMembership {
  return {
    status,
    planCode: 'hsc-member',
    startedAt: '2026-08-07T10:00:00.000Z',
    expiresAt: null,
    suspendedAt: null,
    cancelledAt: null,
  };
}

const allowedAccess: PlayerServerAccess = {
  ok: true,
  authorized: true,
  reason: 'membership_active',
};

describe('PlayerCs2ReadinessPanel', () => {
  let fixture: ComponentFixture<PlayerCs2ReadinessPanel>;

  function render(overrides: {
    account?: PlayerAccountSummary;
    membership?: PlayerMembership | null;
    statsState?: 'ready' | 'unavailable' | 'error';
    serverAccess?: PlayerServerAccess | null;
    serverAccessState?: 'ready' | 'unavailable';
  } = {}): void {
    fixture.componentRef.setInput('account', overrides.account ?? account());
    fixture.componentRef.setInput(
      'membership',
      overrides.membership === undefined ? membership('active') : overrides.membership,
    );
    fixture.componentRef.setInput('statsState', overrides.statsState ?? 'ready');
    fixture.componentRef.setInput(
      'serverAccess',
      overrides.serverAccess === undefined ? allowedAccess : overrides.serverAccess,
    );
    fixture.componentRef.setInput(
      'serverAccessState',
      overrides.serverAccessState ?? 'ready',
    );
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerCs2ReadinessPanel],
      providers: [provideTranslateService()],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', READINESS_SERVER_ACCESS_TRANSLATIONS['pt-BR']);
    translate.setTranslation('en-US', READINESS_SERVER_ACCESS_TRANSLATIONS['en-US']);
    await firstValueFrom(translate.use('pt-BR'));
    fixture = TestBed.createComponent(PlayerCs2ReadinessPanel);
  });

  it('renders five independent readiness dimensions without data services', () => {
    render();
    const text = fixture.nativeElement.textContent as string;
    expect(fixture.nativeElement.querySelectorAll('.cs2-readiness__item')).toHaveLength(5);
    expect(text).toContain('Conta HSC');
    expect(text).toContain('Steam');
    expect(text).toContain('Estatísticas');
    expect(text).toContain('Membership');
    expect(text).toContain('Server Access');
  });

  it.each([
    [true, 'Vinculada'],
    [false, 'Não vinculada'],
  ])('renders Steam linked=%s', (linked, expected) => {
    render({ account: account(linked, linked) });
    expect(fixture.nativeElement.textContent).toContain(expected);
  });

  it.each([
    [account(true, true), 'ready', 'Disponíveis'],
    [account(false, false), 'unavailable', 'Steam necessária'],
    [account(true, true), 'error', 'Temporariamente indisponíveis'],
  ] as const)('renders the authoritative stats presentation', (value, state, expected) => {
    render({ account: value, statsState: state });
    expect(fixture.nativeElement.textContent).toContain(expected);
  });

  it.each([
    [null, 'Sem associação'],
    [membership('inactive'), 'Inativo'],
    [membership('active'), 'Ativo'],
    [membership('suspended'), 'Suspenso'],
    [membership('expired'), 'Expirado'],
    [membership('cancelled'), 'Cancelado'],
  ] as const)('renders every membership state', (value, expected) => {
    render({ membership: value });
    expect(fixture.nativeElement.textContent).toContain(expected);
  });

  it('renders Server Access allow, deny and unavailable', () => {
    render({ serverAccess: allowedAccess });
    expect(fixture.nativeElement.textContent).toContain('Acesso liberado');

    render({
      serverAccess: { ok: true, authorized: false, reason: 'membership_required' },
    });
    expect(fixture.nativeElement.textContent).toContain('Associação HSC necessária');
    expect(fixture.nativeElement.textContent).not.toContain('Acesso liberado');

    render({ serverAccess: null, serverAccessState: 'unavailable' });
    expect(fixture.nativeElement.textContent).toContain('Não foi possível verificar agora');
    expect(fixture.nativeElement.textContent).not.toContain('Acesso liberado');
  });

  it('does not infer Server Access from Steam or membership', () => {
    render({
      account: account(true, true),
      membership: membership('active'),
      serverAccess: { ok: true, authorized: false, reason: 'membership_required' },
    });
    expect(fixture.nativeElement.textContent).toContain('Associação HSC necessária');
    expect(fixture.nativeElement.textContent).not.toContain('Acesso liberado');

    render({ account: account(false, false), membership: null, serverAccess: allowedAccess });
    expect(fixture.nativeElement.textContent).toContain('Acesso liberado');
  });

  it('switches only the Server Access mapper status to en-US at runtime', async () => {
    render({ serverAccess: allowedAccess });
    await firstValueFrom(TestBed.inject(TranslateService).use('en-US'));
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Access granted');
    expect(text).toContain('Conta HSC');
    expect(text).not.toContain('playerArea.serverAccess.authorized.status');
  });
});

const READINESS_SERVER_ACCESS_TRANSLATIONS = {
  'pt-BR': { playerArea: { serverAccess: { authorized: { status: 'Acesso liberado' }, reasons: { membershipRequired: { status: 'Associação HSC necessária' } } } } },
  'en-US': { playerArea: { serverAccess: { authorized: { status: 'Access granted' }, reasons: { membershipRequired: { status: 'HSC Membership required' } } } } },
} as const;
