import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PageState } from '../../../shared/components/page-state/page-state';
import { SeasonRankingApiService } from '../data-access/season-ranking-api.service';
import type { SeasonRanking, SeasonRankingPlayer, SeasonRankingSeason } from '../domain/season-ranking.model';
import { SeasonPodium } from '../season-podium/season-podium';
import { SeasonRankingPage } from './season-ranking-page';

class TestableSeasonRankingPage extends SeasonRankingPage {
  get publicVm$() {
    return this.vm$;
  }

  getPublicSearchTerm(): string {
    return this.searchTerm();
  }

  callRetry(): void {
    this.retry();
  }

  callUpdateSearch(event: Event): void {
    this.updateSearch(event);
  }

  callFilteredPlayers(players: readonly SeasonRankingPlayer[]): readonly SeasonRankingPlayer[] {
    return this.filteredPlayers(players);
  }
}

type SeasonRankingApiServiceMock = {
  getRanking: Mock<SeasonRankingApiService['getRanking']>;
};

function createInputEvent(value: string): Event {
  const input = document.createElement('input');
  input.value = value;

  const event = new Event('input');
  Object.defineProperty(event, 'target', { value: input });

  return event;
}

describe('SeasonRankingPage', () => {
  let mockSeasonRankingApi: SeasonRankingApiServiceMock;
  let paramMap$: BehaviorSubject<ParamMap>;

  const mockSeason: SeasonRankingSeason = {
    slug: 'summer-2026',
    name: 'Summer 2026',
    description: 'Season de verão',
    status: 'active',
    startAt: '2026-06-01T00:00:00Z',
    endAt: '2026-08-31T23:59:59Z',
    coverImageUrl: 'https://example.com/cover.jpg',
  };

  const mockPlayer1: SeasonRankingPlayer = {
    rank: 1,
    prizeRank: 1,
    prizeEligible: true,
    prizeEligibilityReason: null,
    steamId64: '76561198000000001',
    name: 'Fallen',
    avatarUrl: 'https://example.com/fallen.png',
    matchesPlayed: 12,
    mapsPlayed: 10,
    roundsPlayed: 240,
    wins: 9,
    losses: 3,
    kills: 300,
    deaths: 180,
    assists: 20,
    kdRatio: 1.67,
    headshotPct: 41.2,
    adr: 92.1,
    utilityDmgPerRound: 10.2,
    killsPerRound: 1.25,
    assistsPerRound: 0.08,
    deathsPerRound: 0.75,
    impactRating: 1.35,
    winRate: 0.75,
    sampleWeight: 1,
    score: 98.4,
  };

  const mockPlayer2: SeasonRankingPlayer = {
    ...mockPlayer1,
    rank: 2,
    prizeRank: 2,
    steamId64: '76561198000000002',
    name: 'fer',
    score: 91.2,
  };

  const mockRanking: SeasonRanking = {
    generatedAt: '2026-08-03T12:00:00Z',
    season: mockSeason,
    rules: {
      minRoundsPerMap: 12,
      rankingFormulaVersion: 'v1',
      prizeEligibility: {
        minMapsPlayed: 6,
        minRoundsPlayed: 120,
      },
    },
    summary: {
      matches: 20,
      maps: 10,
      rounds: 240,
      players: 2,
      eligiblePlayers: 2,
      lastMapEndedAt: '2026-08-03T11:00:00Z',
    },
    topPrizeCandidates: [mockPlayer1, mockPlayer2],
    players: [mockPlayer1, mockPlayer2],
  };

  beforeEach(() => {
    paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    mockSeasonRankingApi = {
      getRanking: vi.fn<SeasonRankingApiService['getRanking']>().mockReturnValue(of({ kind: 'available', ranking: mockRanking })),
    };

    TestBed.configureTestingModule({
      imports: [SeasonRankingPage],
      providers: [
        TestableSeasonRankingPage,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: SeasonRankingApiService, useValue: mockSeasonRankingApi },
      ],
    });
  });

  it('creates the component', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);
    expect(page).toBeTruthy();
  });

  it('calls getRanking with null for the current-season route', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);

    const values: unknown[] = [];
    page.publicVm$.subscribe((value) => values.push(value));

    expect(mockSeasonRankingApi.getRanking).toHaveBeenCalledWith(null);
    expect(values.at(-1)).toMatchObject({ state: 'ready' });
  });

  it('calls getRanking with the explicit slug', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);

    paramMap$.next(convertToParamMap({ slug: 'summer-2026' }));
    page.publicVm$.subscribe();

    expect(mockSeasonRankingApi.getRanking).toHaveBeenCalledWith('summer-2026');
  });


  it('emits loading initially', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);
    mockSeasonRankingApi.getRanking.mockReturnValue(new Observable(() => undefined));

    const values: unknown[] = [];
    page.publicVm$.subscribe((value) => values.push(value));

    expect(values[0]).toEqual({ state: 'loading' });
  });

  it('maps available rankings with players to ready', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);

    paramMap$.next(convertToParamMap({ slug: 'summer-2026' }));
    const values: Array<{ state: string }> = [];
    page.publicVm$.subscribe((value) => values.push(value as { state: string }));

    expect(values.at(-1)).toMatchObject({ state: 'ready' });
  });

  it('maps available rankings without players to empty while preserving the ranking', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);
    mockSeasonRankingApi.getRanking.mockReturnValue(
      of({ kind: 'available', ranking: { ...mockRanking, players: [] } }),
    );

    paramMap$.next(convertToParamMap({ slug: 'summer-2026' }));
    const values: unknown[] = [];
    page.publicVm$.subscribe((value) => values.push(value));

    expect(values.at(-1)).toMatchObject({ state: 'empty', ranking: { season: mockSeason } });
  });

  it('keeps the season-unavailable state distinct', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);
    mockSeasonRankingApi.getRanking.mockReturnValue(of({ kind: 'season-unavailable' }));

    paramMap$.next(convertToParamMap({ slug: 'summer-2026' }));
    const values: unknown[] = [];
    page.publicVm$.subscribe((value) => values.push(value));

    expect(values.at(-1)).toEqual({ state: 'season-unavailable' });
  });

  it('maps service errors to error', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);
    mockSeasonRankingApi.getRanking.mockReturnValue(throwError(() => new Error('boom')));

    paramMap$.next(convertToParamMap({ slug: 'summer-2026' }));
    const values: unknown[] = [];
    page.publicVm$.subscribe((value) => values.push(value));

    expect(values.at(-1)).toEqual({ state: 'error' });
  });

  it('retries and performs a second request', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);

    mockSeasonRankingApi.getRanking
      .mockReturnValueOnce(throwError(() => new Error('boom')))
      .mockReturnValueOnce(of({ kind: 'available', ranking: mockRanking }));

    const values: unknown[] = [];
    page.publicVm$.subscribe((value) => values.push(value));

    page.callRetry();

    expect(mockSeasonRankingApi.getRanking).toHaveBeenCalledTimes(2);
    expect(values.map((v) => (v as { state: string }).state)).toEqual(['loading', 'error', 'loading', 'ready']);
  });

  it('changes slug and issues another request', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);

    paramMap$.next(convertToParamMap({ slug: 'summer-2026' }));
    const states: string[] = [];
    page.publicVm$.subscribe((v) => states.push((v as { state: string }).state));

    paramMap$.next(convertToParamMap({ slug: 'winter-2026' }));

    expect(mockSeasonRankingApi.getRanking).toHaveBeenCalledTimes(2);
    expect(mockSeasonRankingApi.getRanking).toHaveBeenCalledWith('summer-2026');
    expect(mockSeasonRankingApi.getRanking).toHaveBeenCalledWith('winter-2026');
    expect(states).toEqual(['loading', 'ready', 'loading', 'ready']);
  });

  it('filters players case-insensitively and restores the full list', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);

    const filtered = page.callFilteredPlayers([mockPlayer1, mockPlayer2]);
    expect(filtered).toHaveLength(2);

    page.callUpdateSearch(createInputEvent('fallen'));
    expect(page.callFilteredPlayers([mockPlayer1, mockPlayer2])).toHaveLength(1);

    page.callUpdateSearch(createInputEvent('   '));
    expect(page.callFilteredPlayers([mockPlayer1, mockPlayer2])).toHaveLength(2);
  });

  it('does not change the remote state when the local search produces no result', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);

    page.callUpdateSearch(createInputEvent('zzz'));
    expect(page.callFilteredPlayers([mockPlayer1, mockPlayer2])).toEqual([]);
    expect(page.getPublicSearchTerm()).toBe('zzz');
  });

  it('preserves player order and top prize candidates from the domain', () => {
    const page = TestBed.inject(TestableSeasonRankingPage);

    const visible = page.callFilteredPlayers([mockPlayer1, mockPlayer2]);
    expect(visible[0].steamId64).toBe(mockPlayer1.steamId64);
    expect(visible[1].steamId64).toBe(mockPlayer2.steamId64);
    expect(mockRanking.topPrizeCandidates[0].steamId64).toBe(mockPlayer1.steamId64);
  });

  it('does not trigger extra requests on repeated change detection', () => {
    const fixture = TestBed.createComponent(SeasonRankingPage);

    fixture.detectChanges();
    fixture.detectChanges();

    expect(mockSeasonRankingApi.getRanking).toHaveBeenCalledTimes(1);
  });

  it('ready state renders the season suite composition', () => {
    const fixture = TestBed.createComponent(SeasonRankingPage);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.season-ranking__hero')).toBeTruthy();
    expect(el.querySelector('app-season-tabs')).toBeTruthy();
    expect(el.querySelectorAll('.season-ranking__snapshot > div').length).toBe(5);
    expect(el.querySelector('.season-ranking__classification')).toBeTruthy();
    expect(el.querySelector('app-status-badge')).toBeTruthy();
    expect(el.querySelector('app-season-podium')).toBeTruthy();
  });

  it('metrics use exactly the summary values from the domain', () => {
    const fixture = TestBed.createComponent(SeasonRankingPage);
    fixture.detectChanges();

    const snapshot = fixture.nativeElement.querySelector('.season-ranking__snapshot').textContent;
    expect(snapshot).toContain(String(mockRanking.summary.players));
    expect(snapshot).toContain(String(mockRanking.summary.eligiblePlayers));
    expect(snapshot).toContain(String(mockRanking.summary.matches));
    expect(snapshot).toContain(String(mockRanking.summary.maps));
    expect(snapshot).toContain(String(mockRanking.summary.rounds));
  });

  it('passes topPrizeCandidates to SeasonPodium without derivation', () => {
    const fixture = TestBed.createComponent(SeasonRankingPage);
    fixture.detectChanges();

    const podium = fixture.debugElement.query(By.directive(SeasonPodium));
    expect(podium.componentInstance.players).toBe(mockRanking.topPrizeCandidates);
  });

  it('table preserves the order of players from the domain', () => {
    const fixture = TestBed.createComponent(SeasonRankingPage);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.season-ranking__table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Fallen');
    expect(rows[1].textContent).toContain('fer');
  });

  it('renders EmptyState locally when search produces no results', () => {
    const fixture = TestBed.createComponent(SeasonRankingPage);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.season-ranking__search-input') as HTMLInputElement;
    input.value = 'zzz-no-match';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.season-ranking__table')).toBeNull();
  });

  it('empty state renders the compact hero, SeasonTabs and no table', () => {
    mockSeasonRankingApi.getRanking.mockReturnValue(
      of({ kind: 'available', ranking: { ...mockRanking, players: [] } }),
    );
    const fixture = TestBed.createComponent(SeasonRankingPage);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.season-ranking__hero')).toBeTruthy();
    expect(el.querySelector('app-season-tabs')).toBeTruthy();
    expect(el.querySelector('.season-ranking__snapshot')).toBeNull();
    expect(el.querySelector('.season-ranking__table')).toBeNull();
  });

  it('season-unavailable does not render SeasonTabs and shows its own message', () => {
    mockSeasonRankingApi.getRanking.mockReturnValue(of({ kind: 'season-unavailable' }));
    const fixture = TestBed.createComponent(SeasonRankingPage);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-season-tabs')).toBeNull();
    expect(el.querySelector('app-page-state')).toBeTruthy();
  });

  it('error state keeps the Tentar novamente action', () => {
    mockSeasonRankingApi.getRanking.mockReturnValue(throwError(() => new Error('boom')));
    const fixture = TestBed.createComponent(SeasonRankingPage);
    fixture.detectChanges();

    const pageState = fixture.debugElement.query(By.directive(PageState));
    expect(pageState).toBeTruthy();
    expect(pageState.componentInstance.actionLabel()).toBe('Tentar novamente');
  });
});
