import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import type { PlayerIdentity } from '../player/domain/player-identity.model';
import { BunkerApiService } from './data-access/bunker-api.service';
import type { BunkerSummary } from './domain/bunker.model';
import { BunkerPage } from './bunker-page';
import { BunkerPlayerHeader } from './components/bunker-player-header/bunker-player-header';

function createPlayerIdentity(overrides: Partial<PlayerIdentity> = {}): PlayerIdentity {
  return {
    displayName: 'Test Player',
    steamId64: '76561198000000000',
    avatarMedium: 'https://example.com/avatar.jpg',
    steamProfileUrl: 'https://steamcommunity.com/id/test',
    ...overrides,
  };
}

function createBunkerSummary(overrides: Partial<BunkerSummary> = {}): BunkerSummary {
  return {
    status: 'active',
    seasonFirst: false,
    statsAvailable: true,
    currentSeason: {
      slug: 's5',
      name: 'Season 5',
      status: 'active',
      scope: { startAt: '2026-08-01', endAt: '2026-12-31' },
    },
    seasonPlayer: {
      name: 'Test Player',
      steamId64: '76561198000000000',
      generatedAt: '2026-08-04',
      summary: {
        mapsPlayed: 10,
        matchesPlayed: 10,
        wins: 6,
        losses: 4,
        winRate: 60,
        kdRatio: 1.2,
        adr: 85,
        impactRating: 1.1,
        kills: 180,
        deaths: 150,
        assists: 40,
        roundsPlayed: 240,
        headshotPct: 45,
        accuracy: 20,
        utilityDmgPerRound: 15,
        killsPerRound: 0.75,
        assistsPerRound: 0.16,
        deathsPerRound: 0.62,
        entryWinRate: 55,
        v1Count: 5,
        v1Wins: 3,
        v1WinRate: 60,
        v2Count: 2,
        v2Wins: 1,
        v2WinRate: 50,
        enemy2ks: 10,
        enemy3ks: 4,
        enemy4ks: 1,
        enemy5ks: 0,
        sampleWeight: 1,
        score: 80,
      },
      byMap: [
        {
          mapName: 'de_inferno',
          mapsPlayed: 5,
          matchesPlayed: 5,
          wins: 3,
          losses: 2,
          winRate: 60,
          kdRatio: 1.1,
          adr: 80,
          impactRating: 1.0,
          roundsPlayed: 120,
          kills: 90,
          deaths: 80,
          assists: 20,
          headshotPct: 50,
          accuracy: 22,
          utilityDmgPerRound: 10,
          entryWinRate: 50,
          enemy2ks: 5,
          enemy3ks: 2,
          enemy4ks: 0,
          enemy5ks: 0,
        },
      ],
      recentMaps: [
        {
          mapName: 'de_mirage',
          startedAt: '2026-08-01T12:00:00Z',
          matchId: 'm1',
          mapNumber: 1,
          result: '13-11',
          outcome: 'win',
          score: '13-11',
          team: 'Team A',
          winner: 'Team A',
          isWin: true,
          team1Score: 13,
          team2Score: 11,
          rounds: 24,
          damage: 2000,
          utilityDamage: 300,
          headShotKills: 10,
          entryCount: 4,
          entryWins: 3,
          v1Count: 1,
          v1Wins: 1,
          v2Count: 0,
          v2Wins: 0,
          enemy2ks: 3,
          enemy3ks: 1,
          enemy4ks: 0,
          enemy5ks: 0,
          shotsFiredTotal: 500,
          shotsOnTargetTotal: 110,
          kills: 20,
          deaths: 15,
          assists: 5,
          kdRatio: 1.33,
          adr: 83.3,
          impactRating: 1.2,
        },
      ],
      timeline: [
        {
          at: '2026-08-01T12:00:00Z',
          event: 'match_completed',
          mapName: 'de_mirage',
          matchId: 'm1',
          mapNumber: 1,
          result: 'win',
          score: '13-11',
          kills: 20,
          deaths: 15,
          assists: 5,
          kdRatio: 1.33,
          adr: 83.3,
          impactRating: 1.2,
        },
      ],
    },
    competitiveProfile: null,
    ...overrides,
  };
}

describe('BunkerPage Canonical Integration', () => {
  let fixture: ComponentFixture<BunkerPage>;

  let playerIdentityApiMock: {
    getCurrentIdentity: ReturnType<typeof vi.fn>;
  };
  let bunkerApiMock: {
    getSummary: ReturnType<typeof vi.fn>;
  };
  let playerAuthApiMock: {
    steamLoginUrl: string;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    playerIdentityApiMock = {
      getCurrentIdentity: vi.fn(),
    };
    bunkerApiMock = {
      getSummary: vi.fn(),
    };
    playerAuthApiMock = {
      steamLoginUrl: 'https://example.com/steam/login',
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BunkerPage],
      providers: [
        { provide: PlayerIdentityApiService, useValue: playerIdentityApiMock },
        { provide: BunkerApiService, useValue: bunkerApiMock },
        { provide: PlayerAuthApiService, useValue: playerAuthApiMock },
      ],
    }).compileComponents();
  });

  it('1. renderiza loading antes da identidade responder', () => {
    const identity$ = new Subject<PlayerIdentity | null>();
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(identity$);

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bpnl--loading')).toBeTruthy();
  });

  it('2. identidade válida chama BunkerApiService.getSummary() uma vez', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
  });

  it('3. identidade válida e resumo válido renderizam estado authenticated', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-player-header')).toBeTruthy();
    expect(compiled.querySelector('app-bunker-season-info')).toBeTruthy();
    expect(compiled.querySelector('app-bunker-section-nav')).toBeTruthy();
  });

  it('4. o mesmo BunkerSummary canônico retornado pelo serviço alimenta os componentes integrados sem normalização na página', () => {
    const summary = createBunkerSummary({ status: 'ready' });
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(summary));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Season 5');
  });

  it('5. identidade null renderiza BunkerAuthCard e não chama BunkerApiService', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(null));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-auth-card')).toBeTruthy();
    expect(bunkerApiMock.getSummary).not.toHaveBeenCalled();
  });

  it('6. BunkerAuthCard recebe steamLoginUrl exata do PlayerAuthApiService', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(null));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('app-bunker-auth-card a');
    expect(link?.getAttribute('href')).toBe('https://example.com/steam/login');
  });

  it('7. erro 401 da identidade renderiza unauthenticated', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-auth-card')).toBeTruthy();
    expect(bunkerApiMock.getSummary).not.toHaveBeenCalled();
  });

  it('8. erro 403 da identidade renderiza unauthenticated', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 })),
    );

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-auth-card')).toBeTruthy();
    expect(bunkerApiMock.getSummary).not.toHaveBeenCalled();
  });

  it('9. erro 500 da identidade renderiza error global', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Bunker indisponível');
  });

  it('10. erro de rede da identidade renderiza error global', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(
      throwError(() => new Error('Network error')),
    );

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-empty-state')).toBeTruthy();
  });

  it('11. erro do BunkerApiService preserva authenticated', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(throwError(() => new Error('Summary error')));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-player-header')).toBeTruthy();
    expect(compiled.querySelector('app-empty-state')).toBeNull();
  });

  it('12. erro do BunkerApiService produz summaryState error e exibe a temporada como indisponível', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(throwError(() => new Error('Summary error')));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('indisponível');
  });

  it('13. erro do BunkerApiService não renderiza o empty state global', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(throwError(() => new Error('Summary error')));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-empty-state')).toBeNull();
  });

  it('14. ciclo inicial chama identidade e resumo exatamente uma vez', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    expect(playerIdentityApiMock.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
  });

  it('15. authenticated renderiza os três componentes principais', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-player-header')).toBeTruthy();
    expect(compiled.querySelector('app-bunker-season-info')).toBeTruthy();
    expect(compiled.querySelector('app-bunker-section-nav')).toBeTruthy();
  });

  it('16. player e summary são repassados corretamente ao BunkerPlayerHeader', () => {
    const identity = createPlayerIdentity({ displayName: 'Player Specific Name' });
    const summary = createBunkerSummary();
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(identity));
    bunkerApiMock.getSummary.mockReturnValue(of(summary));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const headerDebug = fixture.debugElement.query(By.directive(BunkerPlayerHeader));
    const header = headerDebug.injector.get(BunkerPlayerHeader);

    expect(header.player()).toBe(identity);
    expect(header.summary()).toBe(summary);
  });

  it('17. clicar no logout do BunkerPlayerHeader chama PlayerAuthApiService.logout() uma vez', async () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));
    playerAuthApiMock.logout.mockReturnValue(of(undefined));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const headerDebug = fixture.debugElement.query(By.directive(BunkerPlayerHeader));
    const logoutButton = headerDebug.query(
      By.css('button[type="button"]'),
    ).nativeElement as HTMLButtonElement;

    expect(logoutButton.disabled).toBe(false);

    logoutButton.click();
    fixture.detectChanges();

    expect(playerAuthApiMock.logout).toHaveBeenCalledTimes(1);
  });

  it('18. enquanto logout está pendente: desabilita e impede chamada duplicada', async () => {
    const logout$ = new Subject<void>();
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));
    playerAuthApiMock.logout.mockReturnValue(logout$);

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const pageComponent = fixture.componentInstance;
    void pageComponent['logout']();
    fixture.detectChanges();

    void pageComponent['logout']();
    fixture.detectChanges();

    expect(playerAuthApiMock.logout).toHaveBeenCalledTimes(1);
  });

  it('19. logout bem-sucedido renderiza unauthenticated e não refaz requisições', async () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));
    playerAuthApiMock.logout.mockReturnValue(of(undefined));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const pageComponent = fixture.componentInstance;
    await pageComponent['logout']();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-auth-card')).toBeTruthy();
    expect(playerIdentityApiMock.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(bunkerApiMock.getSummary).toHaveBeenCalledTimes(1);
  });

  it('20. logout com erro mantém authenticated e exibe erro', async () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));
    playerAuthApiMock.logout.mockReturnValue(throwError(() => new Error('Logout failed')));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const pageComponent = fixture.componentInstance;
    await pageComponent['logout']();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-bunker-player-header')).toBeTruthy();
  });

  it('21. nova tentativa após erro chama logout novamente', async () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));
    playerAuthApiMock.logout
      .mockReturnValueOnce(throwError(() => new Error('Logout fail 1')))
      .mockReturnValueOnce(of(undefined));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const pageComponent = fixture.componentInstance;
    await pageComponent['logout']();
    fixture.detectChanges();

    await pageComponent['logout']();
    fixture.detectChanges();

    expect(playerAuthApiMock.logout).toHaveBeenCalledTimes(2);
  });

  it('22. conteúdo canônico recente usa team1Score/team2Score, utilityDamage, headShotKills, shotsFiredTotal/shotsOnTargetTotal', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('13 x 11');
    expect(compiled.textContent).toContain('300');
  });

  it('23. nenhum button de navegação antigo permanece no BunkerPage', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bnav button')).toBeNull();
  });

  it('24. nenhuma estrutura inline antiga de login, identidade, temporada ou navegação permanece duplicada', () => {
    playerIdentityApiMock.getCurrentIdentity.mockReturnValue(of(createPlayerIdentity()));
    bunkerApiMock.getSummary.mockReturnValue(of(createBunkerSummary()));

    fixture = TestBed.createComponent(BunkerPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bp__identity')).toBeNull();
    expect(compiled.querySelector('.bunker-auth')).toBeNull();
    expect(compiled.querySelector('.bsn__top')).toBeNull();
  });

  it('25. inspeção estática de bunker-page.ts confirma ausência de elementos legados e presenças obrigatórias', () => {
    const tsPath = path.resolve(__dirname, 'bunker-page.ts');
    const tsContent = fs.readFileSync(tsPath, 'utf-8');

    expect(tsContent).not.toContain('Cs2ApiService');
    expect(tsContent).not.toContain('core/api/dto');
    expect(tsContent).not.toContain('normalizeSummary');
    expect(tsContent).not.toContain('normalizeBunkerSummary');
    expect(tsContent).not.toContain('ViewEncapsulation');
    expect(tsContent).not.toContain('window');
    expect(tsContent).not.toContain('document');
    expect(tsContent).not.toContain('scrollIntoView');
    expect(tsContent).not.toContain('getElementById');
    expect(tsContent).not.toContain('.subscribe(');
    expect(tsContent).not.toContain('utility_damage');
    expect(tsContent).not.toContain('team1_score');
    expect(tsContent).not.toContain('team2_score');
  });

  it('26. inspeção estática de bunker-page.html confirma ausência de métodos e atributos legados', () => {
    const htmlPath = path.resolve(__dirname, 'bunker-page.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    expect(htmlContent).not.toContain('loginWithSteam');
    expect(htmlContent).not.toContain('scrollToSection');
    expect(htmlContent).not.toContain('navButtonClass');
    expect(htmlContent).not.toContain('utility_damage');
    expect(htmlContent).not.toContain('team1_score');
    expect(htmlContent).not.toContain('team2_score');
    expect(htmlContent).not.toContain('head_shot_kills');
    expect(htmlContent).not.toContain('shots_fired_total');
    expect(htmlContent).not.toContain('shots_on_target_total');
  });

  it('27. inspeção estática confirma presença dos quatro selectors feature-local', () => {
    const htmlPath = path.resolve(__dirname, 'bunker-page.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    expect(htmlContent).toContain('app-bunker-auth-card');
    expect(htmlContent).toContain('app-bunker-player-header');
    expect(htmlContent).toContain('app-bunker-season-info');
    expect(htmlContent).toContain('app-bunker-section-nav');
  });
});
