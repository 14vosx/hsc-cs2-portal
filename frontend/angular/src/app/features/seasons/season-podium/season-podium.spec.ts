import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { eligibilityLabel, podiumPlacementLabel } from '../season-ui';

import type { SeasonRankingPlayer } from '../domain/season-ranking.model';
import { SeasonPodium } from './season-podium';
import { installSeasonsTranslations } from '../../../testing/seasons-i18n.fixture';

function createPlayer(overrides: Partial<SeasonRankingPlayer> = {}): SeasonRankingPlayer {
  return {
    rank: 1,
    prizeRank: 1,
    prizeEligible: true,
    prizeEligibilityReason: null,
    steamId64: '76561198000000001',
    name: 'Fallen',
    avatarUrl: 'https://example.com/fallen.png',
    matchesPlayed: 10,
    mapsPlayed: 8,
    roundsPlayed: 160,
    wins: 7,
    losses: 3,
    kills: 200,
    deaths: 120,
    assists: 15,
    kdRatio: 1.67,
    headshotPct: 43.2,
    adr: 90.6,
    utilityDmgPerRound: 8.7,
    killsPerRound: 1.25,
    assistsPerRound: 0.09,
    deathsPerRound: 0.75,
    impactRating: 1.35,
    winRate: 0.7,
    sampleWeight: 1,
    score: 95.4,
    ...overrides,
  };
}

describe('SeasonPodium', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SeasonPodium],
      providers: [provideTranslateService()],
    });
  });

  it('uses locale-neutral semantic presentation descriptors', () => {
    expect(podiumPlacementLabel(createPlayer()).translationKey).toBe('seasons.podium.placement.first');
    expect(eligibilityLabel(createPlayer()).translationKey).toBe('seasons.shared.eligibility.eligible');
  });

  it('switches rendered placement, eligibility, record, and fallback without mutating inputs', async () => {
    const translate = TestBed.inject(TranslateService);
    await installSeasonsTranslations(translate);
    const fixture = TestBed.createComponent(SeasonPodium);
    const players = [
      createPlayer({ name: 'Real Player', steamId64: '76561198000000001' }),
      createPlayer({ name: null, steamId64: '76561198000000002', prizeRank: 2, prizeEligible: false }),
    ];
    fixture.componentInstance.players = players;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Primeiro lugar');
    expect(fixture.nativeElement.textContent).toContain('Elegível');
    expect(fixture.nativeElement.textContent).toContain('V/D');
    expect(fixture.nativeElement.textContent).toContain('Sem nome');
    await translate.use('en-US').toPromise();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('First place');
    expect(text).toContain('Eligible');
    expect(text).toContain('W/L');
    expect(text).toContain('Unnamed player');
    expect(text).toContain('Real Player');
    expect(text).toContain('95.40');
    expect(fixture.componentInstance.players).toBe(players);
    expect(players.map((player) => player.steamId64)).toEqual(['76561198000000001', '76561198000000002']);
  });

  it('accepts SeasonRankingPlayer values', () => {
    const component = new SeasonPodium();
    component.players = [createPlayer()];

    expect(component.players).toHaveLength(1);
  });

  it('preserves the incoming order for one or two players', () => {
    const fixture = TestBed.createComponent(SeasonPodium);
    const first = createPlayer({ steamId64: '1', name: 'First' });
    const second = createPlayer({ steamId64: '2', name: 'Second' });

    fixture.componentInstance.players = [first, second];
    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.season-podium-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('First');
    expect(cards[1].textContent).toContain('Second');
  });

  it('renders three players as second, first, third', () => {
    const fixture = TestBed.createComponent(SeasonPodium);
    const first = createPlayer({ steamId64: '1', name: 'First', prizeRank: 1 });
    const second = createPlayer({ steamId64: '2', name: 'Second', prizeRank: 2 });
    const third = createPlayer({ steamId64: '3', name: 'Third', prizeRank: 3 });

    fixture.componentInstance.players = [first, second, third];
    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.season-podium-card');
    expect(cards).toHaveLength(3);
    expect(cards[0].textContent).toContain('Second');
    expect(cards[1].textContent).toContain('First');
    expect(cards[2].textContent).toContain('Third');
  });

  it('uses the provided prize rank without recalculation', () => {
    const fixture = TestBed.createComponent(SeasonPodium);
    const player = createPlayer({ prizeRank: 9, rank: 4 });

    fixture.componentInstance.players = [player];
    fixture.detectChanges();

    const rank = (fixture.nativeElement as HTMLElement).querySelector('.season-podium-card__rank');
    expect(rank?.textContent).toContain('#9');
  });

  it('supports the canonical steamId64 field in the template contract', () => {
    const player = createPlayer({ steamId64: '76561198000000099' });
    expect(player.steamId64).toBe('76561198000000099');
  });

  it('renders without crashing when the name and avatar are missing', () => {
    const fixture = TestBed.createComponent(SeasonPodium);
    const player = createPlayer({ name: null, avatarUrl: null });

    fixture.componentInstance.players = [player];
    fixture.detectChanges();

    const portrait = (fixture.nativeElement as HTMLElement).querySelector(
      '.season-podium-card__portrait',
    );
    expect(portrait?.querySelector('img')).toBeNull();
    expect(portrait?.textContent).toContain('HSC');
  });
});
