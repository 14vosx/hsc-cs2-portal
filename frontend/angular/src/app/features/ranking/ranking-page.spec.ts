import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RankingApiService } from './data-access/ranking-api.service';
import type { Ranking, RankingPlayer } from './domain/ranking.model';
import { RankingPage } from './ranking-page';

class TestableRankingPage extends RankingPage {
  get publicVm$() {
    return this.vm$;
  }

  getPublicSearchTerm(): string {
    return this.searchTerm();
  }

  callUpdateSearch(event: Event): void {
    this.updateSearch(event);
  }

  callFilteredPlayers(players: readonly RankingPlayer[]): readonly RankingPlayer[] {
    return this.filteredPlayers(players);
  }
}

type RankingApiServiceMock = {
  getRanking: Mock<RankingApiService['getRanking']>;
};

type ObservableValue<T> = T extends Observable<infer TValue> ? TValue : never;

type ExposedRankingVm = ObservableValue<TestableRankingPage['publicVm$']>;

function captureLatest<T>(source: Observable<T>): T | undefined {
  let latest: T | undefined;

  source.subscribe((value) => {
    latest = value;
  });

  return latest;
}

function requireReadyVm(
  value: ExposedRankingVm | undefined,
): Extract<ExposedRankingVm, { state: 'ready' }> {
  if (!value || value.state !== 'ready') {
    throw new Error(`Expected ready RankingVm, received ${value?.state ?? 'undefined'}`);
  }

  return value;
}

function requireErrorVm(
  value: ExposedRankingVm | undefined,
): Extract<ExposedRankingVm, { state: 'error' }> {
  if (!value || value.state !== 'error') {
    throw new Error(`Expected error RankingVm, received ${value?.state ?? 'undefined'}`);
  }

  return value;
}

function createInputEvent(value: string): Event {
  const input = document.createElement('input');
  input.value = value;

  const event = new Event('input');

  Object.defineProperty(event, 'target', {
    value: input,
  });

  return event;
}

describe('RankingPage', () => {
  let mockRankingApi: RankingApiServiceMock;

  const mockPlayer1: RankingPlayer = {
    position: 1,
    steamId64: '76561198000000001',
    name: 'Fallen',
    matchesPlayed: 10,
    mapsPlayed: 12,
    roundsPlayed: 250,
    wins: 8,
    losses: 4,
    kills: 220,
    deaths: 150,
    assists: 45,
    kdRatio: 1.47,
    headshotPct: 45.5,
    adr: 85.2,
    utilityDmgPerRound: 12.4,
    killsPerRound: 0.88,
    assistsPerRound: 0.18,
    deathsPerRound: 0.6,
    impactRating: 1.35,
    winRate: 0.667,
    sampleWeight: 1.0,
    score: 88.5,
  };

  const mockPlayer2: RankingPlayer = {
    position: 2,
    steamId64: '76561198000000002',
    name: 'fer',
    matchesPlayed: 10,
    mapsPlayed: 12,
    roundsPlayed: 250,
    wins: 7,
    losses: 5,
    kills: 210,
    deaths: 160,
    assists: 40,
    kdRatio: 1.31,
    headshotPct: 52.0,
    adr: 82.0,
    utilityDmgPerRound: 10.0,
    killsPerRound: 0.84,
    assistsPerRound: 0.16,
    deathsPerRound: 0.64,
    impactRating: 1.25,
    winRate: 0.583,
    sampleWeight: 1.0,
    score: 82.1,
  };

  const mockPlayer3: RankingPlayer = {
    position: 3,
    steamId64: '76561198000000003',
    name: 'coldzera',
    matchesPlayed: 10,
    mapsPlayed: 12,
    roundsPlayed: 250,
    wins: 7,
    losses: 5,
    kills: 200,
    deaths: 155,
    assists: 50,
    kdRatio: 1.29,
    headshotPct: 48.0,
    adr: 80.5,
    utilityDmgPerRound: 11.5,
    killsPerRound: 0.8,
    assistsPerRound: 0.2,
    deathsPerRound: 0.62,
    impactRating: 1.2,
    winRate: 0.583,
    sampleWeight: 1.0,
    score: 80.0,
  };

  const mockPlayer4: RankingPlayer = {
    position: 4,
    steamId64: '76561198000000004',
    name: null,
    matchesPlayed: 8,
    mapsPlayed: 10,
    roundsPlayed: 200,
    wins: 5,
    losses: 5,
    kills: 150,
    deaths: 150,
    assists: 30,
    kdRatio: 1.0,
    headshotPct: 40.0,
    adr: 70.0,
    utilityDmgPerRound: 8.0,
    killsPerRound: 0.75,
    assistsPerRound: 0.15,
    deathsPerRound: 0.75,
    impactRating: 1.0,
    winRate: 0.5,
    sampleWeight: 0.9,
    score: 65.0,
  };

  const mockRanking: Ranking = {
    generatedAt: '2026-08-03T12:00:00Z',
    completedMaps: 15,
    players: [mockPlayer1, mockPlayer2, mockPlayer3, mockPlayer4],
    rankedPlayerCount: 4,
    leader: mockPlayer1,
  };

  const mockEmptyRanking: Ranking = {
    generatedAt: '2026-08-03T12:00:00Z',
    completedMaps: 0,
    players: [],
    rankedPlayerCount: 0,
    leader: null,
  };

  beforeEach(() => {
    mockRankingApi = {
      getRanking: vi.fn<RankingApiService['getRanking']>().mockReturnValue(of(mockRanking)),
    };

    TestBed.configureTestingModule({
      imports: [RankingPage],
      providers: [
        TestableRankingPage,
        { provide: RankingApiService, useValue: mockRankingApi },
      ],
    });
  });

  it('1. o componente pode ser criado', () => {
    const page = TestBed.inject(TestableRankingPage);
    expect(page).toBeTruthy();
  });

  it('2. RankingApiService.getRanking() é chamado exatamente uma vez', () => {
    const page = TestBed.inject(TestableRankingPage);
    page.publicVm$.subscribe();
    expect(mockRankingApi.getRanking).toHaveBeenCalledTimes(1);
  });

  it('3. estado inicial de loading é preservado antes da emissão', () => {
    const rankingSubject = new Subject<Ranking>();
    mockRankingApi.getRanking.mockReturnValue(rankingSubject.asObservable());

    const page = TestBed.inject(TestableRankingPage);
    const states: string[] = [];
    const sub = page.publicVm$.subscribe((vm) => states.push(vm.state));

    expect(states).toEqual(['loading']);

    rankingSubject.next(mockRanking);
    sub.unsubscribe();
  });

  it('4. emissão de Ranking encerra loading e produz estado de pronto', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.state).toBe('ready');
    expect(vm.generatedAt).toBe('2026-08-03T12:00:00Z');
    expect(vm.completedMaps).toBe(15);
    expect(vm.rankedPlayerCount).toBe(4);
  });

  it('5. rankedPlayerCount é exposto como métrica', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.rankedPlayerCount).toBe(4);
  });

  it('6. completedMaps é exibido a partir do domínio', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.completedMaps).toBe(15);
  });

  it('7. leader é usado na apresentação do líder', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.leader).toEqual(mockPlayer1);
  });

  it('8. pódio preserva a ordem dos três primeiros jogadores', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.podium).toHaveLength(3);
    expect(vm.podium[0]).toEqual(mockPlayer1);
    expect(vm.podium[1]).toEqual(mockPlayer2);
    expect(vm.podium[2]).toEqual(mockPlayer3);
  });

  it('9. tabela preserva a ordem recebida do domínio sem reordenar', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.players).toEqual([mockPlayer1, mockPlayer2, mockPlayer3, mockPlayer4]);
  });

  it('10. player.position é mantida a partir do modelo de domínio', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.players[0].position).toBe(1);
    expect(vm.players[1].position).toBe(2);
    expect(vm.players[2].position).toBe(3);
    expect(vm.players[3].position).toBe(4);
  });

  it('11. player.steamId64 é usado como identificador canônico', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.players[0].steamId64).toBe('76561198000000001');
  });

  it('12. busca por nome continua funcionando', () => {
    const page = TestBed.inject(TestableRankingPage);

    page.callUpdateSearch(createInputEvent('fallen'));
    expect(page.getPublicSearchTerm()).toBe('fallen');

    const filtered = page.callFilteredPlayers(mockRanking.players);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].steamId64).toBe('76561198000000001');
  });

  it('13. busca por SteamID continua funcionando', () => {
    const page = TestBed.inject(TestableRankingPage);

    page.callUpdateSearch(createInputEvent('76561198000000002'));
    const filtered = page.callFilteredPlayers(mockRanking.players);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('fer');
  });

  it('14. busca é segura quando name é null', () => {
    const page = TestBed.inject(TestableRankingPage);

    page.callUpdateSearch(createInputEvent('76561198000000004'));
    expect(() => {
      const filtered = page.callFilteredPlayers(mockRanking.players);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBeNull();
    }).not.toThrow();
  });

  it('15. consulta vazia restaura todos os jogadores', () => {
    const page = TestBed.inject(TestableRankingPage);

    page.callUpdateSearch(createInputEvent('   '));
    const filtered = page.callFilteredPlayers(mockRanking.players);
    expect(filtered).toHaveLength(4);
  });

  it('16. Ranking vazio é tratado como sucesso válido', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockEmptyRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm).toEqual({
      state: 'ready',
      generatedAt: '2026-08-03T12:00:00Z',
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
      podium: [],
    });
  });

  it('17. Ranking vazio não exibe líder fictício', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockEmptyRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.leader).toBeNull();
  });

  it('18. Ranking vazio não é tratado como erro', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockEmptyRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = captureLatest(page.publicVm$);

    expect(vm?.state).not.toBe('error');
  });

  it('19. erro do Observable exibe o estado de erro atual', () => {
    mockRankingApi.getRanking.mockReturnValue(throwError(() => new Error('HTTP 500')));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireErrorVm(captureLatest(page.publicVm$));

    expect(vm).toEqual({ state: 'error' });
  });

  it('20. erro encerra loading', () => {
    const errorSubject = new Subject<Ranking>();
    mockRankingApi.getRanking.mockReturnValue(errorSubject.asObservable());

    const page = TestBed.inject(TestableRankingPage);
    const states: string[] = [];

    const sub = page.publicVm$.subscribe((vm) => states.push(vm.state));

    expect(states).toEqual(['loading']);

    errorSubject.error(new Error('Network error'));
    expect(states).toEqual(['loading', 'error']);

    sub.unsubscribe();
  });

  it('21. erro não exibe dados de sucesso', () => {
    mockRankingApi.getRanking.mockReturnValue(throwError(() => new Error('HTTP 500')));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireErrorVm(captureLatest(page.publicVm$));

    expect('players' in vm).toBe(false);
    expect('rankedPlayerCount' in vm).toBe(false);
  });

  it('22. não existe segunda chamada ao serviço durante detecções de mudança', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(mockRankingApi.getRanking).toHaveBeenCalledTimes(1);
  });
});
