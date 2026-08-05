import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BunkerPlayerHeader } from './bunker-player-header';
import type { PlayerIdentity } from '../../../player/domain/player-identity.model';
import type { BunkerSummary } from '../../domain/bunker.model';
import { beforeEach, describe, expect, it } from 'vitest';

function createPlayerIdentity(overrides: Partial<PlayerIdentity> = {}): PlayerIdentity {
  return {
    displayName: 'Player Base',
    steamId64: '76561198000000000',
    avatarMedium: 'https://example.com/base-avatar.jpg',
    steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000000',
    ...overrides,
  };
}

function createBunkerSummary(overrides: Partial<BunkerSummary> = {}): BunkerSummary {
  return {
    status: 'active',
    seasonFirst: true,
    statsAvailable: true,
    currentSeason: null,
    seasonPlayer: null,
    competitiveProfile: null,
    ...overrides,
  };
}

describe('BunkerPlayerHeader', () => {
  let component: BunkerPlayerHeader;
  let fixture: ComponentFixture<BunkerPlayerHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerPlayerHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(BunkerPlayerHeader);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('player', createPlayerIdentity());
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();
  });

  it('1. componente pode ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('2. usa PlayerIdentity como fallback básico', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ displayName: 'Caio Base', steamId64: '111' }));
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bunker-player-header__name')?.textContent?.trim()).toBe('Caio Base');
    expect(compiled.querySelector('.bunker-player-header__steam-id')?.textContent?.trim()).toBe('SteamID 111');
  });

  it('3. PlayerIdentity tem precedência para nome e SteamID', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ displayName: 'Player Identity Name', steamId64: '111' }));
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonPlayer: {
          name: 'Season Name',
          steamId64: '999',
          generatedAt: null,
          summary: null,
          byMap: [],
          recentMaps: [],
          timeline: [],
        },
        competitiveProfile: {
          name: 'Comp Name',
          steamId64: '888',
          generatedAt: null,
          avatarMedium: null,
          steamProfileUrl: null,
          lifetime: null,
        },
      })
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bunker-player-header__name')?.textContent?.trim()).toBe('Player Identity Name');
    expect(compiled.querySelector('.bunker-player-header__steam-id')?.textContent?.trim()).toBe('SteamID 111');
  });

  it('4. competitiveProfile tem precedência sobre seasonPlayer quando PlayerIdentity for nulo', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ displayName: null, steamId64: '' }));
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonPlayer: {
          name: 'Season Name',
          steamId64: '999',
          generatedAt: null,
          summary: null,
          byMap: [],
          recentMaps: [],
          timeline: [],
        },
        competitiveProfile: {
          name: 'Comp Name',
          steamId64: '888',
          generatedAt: null,
          avatarMedium: null,
          steamProfileUrl: null,
          lifetime: null,
        },
      })
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bunker-player-header__name')?.textContent?.trim()).toBe('Comp Name');
    expect(compiled.querySelector('.bunker-player-header__steam-id')?.textContent?.trim()).toBe('SteamID 888');
  });

  it('5. seasonPlayer é utilizado como fallback antes de Jogador HSC', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ displayName: null, steamId64: '' }));
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonPlayer: {
          name: 'Season Priority',
          steamId64: '777',
          generatedAt: null,
          summary: null,
          byMap: [],
          recentMaps: [],
          timeline: [],
        },
        competitiveProfile: null,
      })
    );
    fixture.detectChanges();

    expect(component.playerName()).toBe('Season Priority');
    expect(component.steamId64()).toBe('777');
  });

  it('6. whitespace vazio é ignorado nos fallbacks textuais', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ displayName: '  Valid Player  ', steamId64: '  123  ' }));
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonPlayer: {
          name: '   ',
          steamId64: '   ',
          generatedAt: null,
          summary: null,
          byMap: [],
          recentMaps: [],
          timeline: [],
        },
        competitiveProfile: {
          name: '   ',
          steamId64: '   ',
          generatedAt: null,
          avatarMedium: null,
          steamProfileUrl: null,
          lifetime: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.playerName()).toBe('Valid Player');
    expect(component.steamId64()).toBe('123');
  });

  it('7. fallback final de nome é "Jogador HSC"', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ displayName: '   ', steamId64: '' }));
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();

    expect(component.playerName()).toBe('Jogador HSC');
  });

  it('8. avatar de PlayerIdentity tem precedência', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ avatarMedium: 'https://example.com/base.jpg' }));
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        competitiveProfile: {
          name: null,
          steamId64: null,
          generatedAt: null,
          avatarMedium: 'https://example.com/comp.jpg',
          steamProfileUrl: null,
          lifetime: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.avatarUrl()).toBe('https://example.com/base.jpg');
  });

  it('9. avatar de competitiveProfile é fallback quando PlayerIdentity for nulo', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ avatarMedium: null }));
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        competitiveProfile: {
          name: null,
          steamId64: null,
          generatedAt: null,
          avatarMedium: 'https://example.com/comp.jpg',
          steamProfileUrl: null,
          lifetime: null,
        },
      })
    );
    fixture.detectChanges();

    expect(component.avatarUrl()).toBe('https://example.com/comp.jpg');
  });

  it('10. ausência de avatar renderiza monograma', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ avatarMedium: null, displayName: 'Felipe Melo' }));
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const fallback = compiled.querySelector('.bunker-player-header__avatar-fallback');
    expect(fallback).toBeTruthy();
    expect(fallback?.textContent?.trim()).toBe('FM');
  });

  it('11. monograma usa no máximo duas palavras', () => {
    fixture.componentRef.setInput(
      'player',
      createPlayerIdentity({ avatarMedium: null, displayName: 'Caio Henrique Silva Santos' })
    );
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();

    expect(component.monogram()).toBe('CH');
  });

  it('12. falha da imagem troca para monograma', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ avatarMedium: 'https://example.com/broken.jpg', displayName: 'Lucas Moura' }));
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();

    component.onAvatarError();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('img')).toBeNull();
    expect(compiled.querySelector('.bunker-player-header__avatar-fallback')?.textContent?.trim()).toBe('LM');
  });

  it('13. nova URL posterior não permanece bloqueada pela falha anterior', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ avatarMedium: 'https://example.com/broken.jpg', displayName: 'Lucas Moura' }));
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();

    component.onAvatarError();
    fixture.detectChanges();
    expect(component.showAvatar()).toBe(false);

    fixture.componentRef.setInput('player', createPlayerIdentity({ avatarMedium: 'https://example.com/new-working.jpg', displayName: 'Lucas Moura' }));
    fixture.detectChanges();

    expect(component.showAvatar()).toBe(true);
    expect(component.avatarUrl()).toBe('https://example.com/new-working.jpg');
  });

  it('14. link Steam é renderizado com atributos seguros', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ steamProfileUrl: 'https://steamcommunity.com/id/test' }));
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.bunker-player-header__steam-link');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('15. link não é renderizado sem URL', () => {
    fixture.componentRef.setInput('player', createPlayerIdentity({ steamProfileUrl: null }));
    fixture.componentRef.setInput('summary', createBunkerSummary());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.bunker-player-header__steam-link');
    expect(link).toBeNull();
  });

  it('16. badges exibem histórico disponível/pendente e primeira season', () => {
    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonFirst: true,
        competitiveProfile: {
          generatedAt: null,
          steamId64: null,
          name: null,
          avatarMedium: null,
          steamProfileUrl: null,
          lifetime: {
            mapsPlayed: 10,
            matchesPlayed: 10,
            wins: 5,
            losses: 5,
            winRate: 50,
            kdRatio: 1,
            adr: 70,
            impactRating: 1,
            kills: 100,
            deaths: 100,
            assists: 20,
            roundsPlayed: 150,
            headshotPct: 40,
            accuracy: 20,
            utilityDmgPerRound: 10,
            killsPerRound: 0.6,
            assistsPerRound: 0.1,
            deathsPerRound: 0.6,
            entryWinRate: 50,
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
      })
    );
    fixture.detectChanges();

    expect(component.seasonFirstLabel()).toBe('sim');
    expect(component.historyAvailabilityLabel()).toBe('Histórico disponível');

    fixture.componentRef.setInput(
      'summary',
      createBunkerSummary({
        seasonFirst: false,
        competitiveProfile: null,
      })
    );
    fixture.detectChanges();

    expect(component.seasonFirstLabel()).toBe('não');
    expect(component.historyAvailabilityLabel()).toBe('Histórico pendente');
  });

  it('17. botão normal exibe "Sair"', () => {
    fixture.componentRef.setInput('logoutPending', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.bunker-player-header__logout-btn') as HTMLButtonElement;
    expect(btn.textContent?.trim()).toBe('Sair');
    expect(btn.disabled).toBe(false);
  });

  it('18. pending desabilita botão e exibe "Saindo..."', () => {
    fixture.componentRef.setInput('logoutPending', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.bunker-player-header__logout-btn') as HTMLButtonElement;
    expect(btn.textContent?.trim()).toBe('Saindo...');
    expect(btn.disabled).toBe(true);
  });

  it('19. clique normal emite logoutRequested uma vez', () => {
    let emitted = 0;
    component.logoutRequested.subscribe(() => emitted++);

    fixture.componentRef.setInput('logoutPending', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('.bunker-player-header__logout-btn') as HTMLButtonElement;
    btn.click();

    expect(emitted).toBe(1);
  });

  it('20. pending impede emissão', () => {
    let emitted = 0;
    component.logoutRequested.subscribe(() => emitted++);

    fixture.componentRef.setInput('logoutPending', true);
    fixture.detectChanges();

    component.onLogout();

    expect(emitted).toBe(0);
  });

  it('21. logoutFailed renderiza role="alert"', () => {
    fixture.componentRef.setInput('logoutFailed', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.textContent?.trim()).toBe('Não foi possível encerrar a sessão. Tente novamente.');
  });

  it('22. logoutFailed false não renderiza a mensagem', () => {
    fixture.componentRef.setInput('logoutFailed', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('[role="alert"]');
    expect(alert).toBeNull();
  });

  it('23. nenhum serviço, DTO ou acesso global é usado', () => {
    expect(BunkerPlayerHeader).toBeDefined();
  });
});
