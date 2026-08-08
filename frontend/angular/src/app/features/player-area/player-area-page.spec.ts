import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BunkerApiService } from '../bunker/data-access/bunker-api.service';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import { PlayerSelfApiService } from '../player/data-access/player-self-api.service';
import { PlayerAreaPage } from './player-area-page';

describe('PlayerAreaPage', () => {
  let fixture: ComponentFixture<PlayerAreaPage>;

  const identityApi = {
    getCurrentIdentity: vi.fn(),
  };

  const selfApi = {
    getAccount: vi.fn(),
    getProfile: vi.fn(),
    getMembership: vi.fn(),
  };

  const bunkerApi = {
    getSummary: vi.fn(),
  };

  const authApi = {
    steamLoginUrl: '/player/auth/steam/start',
    steamLinkUrl: '/player/auth/steam/link/start',
    logout: vi.fn(() => of(undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    identityApi.getCurrentIdentity.mockReturnValue(
      of({
        displayName: 'Steam Player',
        steamId64: '76561198000000001',
        avatarMedium: null,
        steamProfileUrl: null,
      }),
    );

    selfApi.getAccount.mockReturnValue(
      of({
        status: 'active',
        identities: {
          email: {
            linked: true,
            email: 'player@example.test',
            verified: true,
          },
          steam: {
            linked: true,
            steamId64: '76561198000000001',
          },
        },
        capabilities: {
          cs2Identity: {
            ready: true,
            reason: null,
          },
          personalizedStats: {
            available: true,
            reason: null,
          },
        },
      }),
    );

    selfApi.getProfile.mockReturnValue(
      of({
        displayName: 'Player HSC',
        slug: 'player-hsc',
        bio: 'Perfil de teste.',
        avatarUrl: null,
        bannerUrl: null,
        discordHandle: 'player.hsc',
        preferredRole: 'rifler',
        preferredMap: 'de_mirage',
        visibility: 'public',
        joinedAt: '2026-08-07T10:00:00.000Z',
        createdAt: '2026-08-07T10:00:00.000Z',
        updatedAt: '2026-08-07T10:00:00.000Z',
      }),
    );

    selfApi.getMembership.mockReturnValue(
      of({
        status: 'active',
        planCode: 'hsc-member',
        startedAt: '2026-08-07T10:00:00.000Z',
        expiresAt: null,
        suspendedAt: null,
        cancelledAt: null,
      }),
    );

    bunkerApi.getSummary.mockReturnValue(
      of({
        status: 'ready',
        seasonFirst: true,
        statsAvailable: true,
        currentSeason: {
          slug: 's2-2026',
          name: 'Season 02',
          status: 'active',
          scope: null,
        },
        seasonPlayer: null,
        competitiveProfile: {
          generatedAt: null,
          steamId64: '76561198000000001',
          name: 'Player HSC',
          avatarMedium: null,
          steamProfileUrl: null,
          lifetime: {
            mapsPlayed: 12,
            matchesPlayed: 12,
            wins: 7,
            losses: 5,
            winRate: 0.583,
            kdRatio: 1.12,
            adr: 78.4,
            impactRating: 1.04,
            kills: 140,
            deaths: 125,
            assists: 41,
            roundsPlayed: 250,
            headshotPct: 0.42,
            accuracy: 0.21,
            utilityDmgPerRound: 12.3,
            killsPerRound: 0.56,
            assistsPerRound: 0.16,
            deathsPerRound: 0.5,
            entryWinRate: 0.51,
            v1Count: 0,
            v1Wins: 0,
            v1WinRate: 0,
            v2Count: 0,
            v2Wins: 0,
            v2WinRate: 0,
            enemy2ks: 0,
            enemy3ks: 0,
            enemy4ks: 0,
            enemy5ks: 0,
            sampleWeight: 1,
            score: 50,
          },
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [PlayerAreaPage],
      providers: [
        provideRouter([]),
        { provide: PlayerIdentityApiService, useValue: identityApi },
        { provide: PlayerSelfApiService, useValue: selfApi },
        { provide: BunkerApiService, useValue: bunkerApi },
        { provide: PlayerAuthApiService, useValue: authApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerAreaPage);
  });

  it('renderiza Account, Profile, Membership e stats reais', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Área do Jogador');
    expect(text).toContain('Player HSC');
    expect(text).toContain('Conta e segurança');
    expect(text).toContain('Visível para membros HSC');
    expect(text).toContain('Associação ativa');
    expect(text).toContain('Estatísticas personalizadas');
    expect(text).toContain('Season 02');
    expect(text).toContain('1,12');
  });

  it('conta HSC autenticada sem Steam continua autenticada e oferece vínculo Steam', async () => {
    identityApi.getCurrentIdentity.mockReturnValue(
      of({
        displayName: 'Email Player',
        steamId64: null,
        avatarMedium: null,
        steamProfileUrl: null,
      }),
    );

    selfApi.getAccount.mockReturnValue(
      of({
        status: 'active',
        identities: {
          email: {
            linked: true,
            email: 'email-only@example.test',
            verified: true,
          },
          steam: {
            linked: false,
            steamId64: null,
          },
        },
        capabilities: {
          cs2Identity: {
            ready: false,
            reason: 'steam_link_required',
          },
          personalizedStats: {
            available: false,
            reason: 'steam_link_required',
          },
        },
      }),
    );

    selfApi.getMembership.mockReturnValue(of(null));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Área do Jogador');
    expect(text).toContain('Conta ativa sem identidade Steam vinculada');
    expect(text).toContain('Vincular Steam');
    expect(text).toContain('Sem associação HSC');
    expect(bunkerApi.getSummary).not.toHaveBeenCalled();
  });

  it('sessão ausente não consulta dados privados adicionais', async () => {
    identityApi.getCurrentIdentity.mockReturnValue(of(null));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Entre para acessar sua área');
    expect(selfApi.getAccount).not.toHaveBeenCalled();
    expect(selfApi.getProfile).not.toHaveBeenCalled();
    expect(selfApi.getMembership).not.toHaveBeenCalled();
    expect(bunkerApi.getSummary).not.toHaveBeenCalled();
  });

  it('falha das stats não derruba conta, perfil e membership', async () => {
    bunkerApi.getSummary.mockReturnValue(
      throwError(() => new Error('stats unavailable')),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Área do Jogador');
    expect(text).toContain('Player HSC');
    expect(text).toContain('Conta e segurança');
    expect(text).toContain('Associação ativa');
    expect(text).toContain('resumo competitivo está');
    expect(text).toContain('indisponível agora');
  });
});
