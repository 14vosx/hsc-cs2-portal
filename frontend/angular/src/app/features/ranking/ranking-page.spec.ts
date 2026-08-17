import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import type { Observable } from 'rxjs';
import { firstValueFrom, NEVER, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerSession } from '../../core/session/player-session.model';
import type {
  PlayerPresentationReference,
} from '../../core/player-presentation/player-presentation-reference.model';
import { PlayerPresentationReferenceService } from '../../core/player-presentation/player-presentation-reference.service';
import { PlayerSessionService } from '../../core/session/player-session.service';
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

  callRetry(): void {
    this.retry();
  }

  callUpdateSearch(event: Event): void {
    this.updateSearch(event);
  }

  callFilteredPlayers(players: readonly RankingPlayer[]): readonly RankingPlayer[] {
    return this.filteredPlayers(players);
  }

  callFilteredPlayersWithReferences(
    players: readonly RankingPlayer[],
    references: ReadonlyMap<string, PlayerPresentationReference>,
  ): readonly RankingPlayer[] {
    return this.filteredPlayers(players, references);
  }

  callAvatarUrlFor(
    player: RankingPlayer,
    references: ReadonlyMap<string, PlayerPresentationReference>,
  ): string | null {
    return this.avatarUrlFor(player, references);
  }

  callIsCurrentPlayer(player: RankingPlayer): boolean {
    return this.isCurrentPlayer(player);
  }

  callFormatRateAsPct(value: number): string {
    return this.formatRateAsPct(value);
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
  let mockPresentation: { resolve: Mock<PlayerPresentationReferenceService['resolve']> };
  let translate: TranslateService;
  const mockSessionState = signal<PlayerSession>({ status: 'anonymous' });

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
    mockSessionState.set({ status: 'anonymous' });
    mockRankingApi = {
      getRanking: vi.fn<RankingApiService['getRanking']>().mockReturnValue(of(mockRanking)),
    };
    mockPresentation = {
      resolve: vi.fn<PlayerPresentationReferenceService['resolve']>().mockReturnValue(NEVER),
    };

    TestBed.configureTestingModule({
      imports: [RankingPage],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        TestableRankingPage,
        { provide: RankingApiService, useValue: mockRankingApi },
        { provide: PlayerPresentationReferenceService, useValue: mockPresentation },
        { provide: PlayerSessionService, useValue: { state: mockSessionState } },
      ],
    });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { ranking: { hero: { eyebrow: 'Ranking Geral', title: 'Ranking Geral HSC', description: 'Classificação geral acumulada.', synced: 'Dados sincronizados', lastUpdated: 'Última atualização' }, states: { loading: { title: 'Carregando ranking geral...', message: 'Sincronizando a classificação dos jogadores.' }, error: { title: 'Ranking indisponível', message: 'Não foi possível carregar.', retry: 'Tentar novamente' }, empty: { title: 'Nenhum jogador classificado', message: 'Não há dados de ranking geral disponíveis no momento.' } }, summary: { ariaLabel: 'Resumo do ranking geral', players: 'Jogadores', completedMaps: 'Mapas finalizados', currentLeader: 'Líder atual', noLeader: 'Sem líder' }, podium: { ariaLabel: 'Pódio top 3', eyebrow: 'Pódio', title: 'Top 3 da Comunidade', description: 'Jogadores com maior pontuação.', gold: 'Ouro · Campeão', silver: 'Prata', bronze: 'Bronze', player: 'Jogador', wins: 'Vitórias', losses: 'Derrotas' }, players: { unnamedAccessible: 'Jogador sem nome', unnamed: 'Sem nome', you: 'Você' }, table: { ariaLabel: 'Tabela de classificação completa', mobileAriaLabel: 'Classificação completa', eyebrow: 'Classificação', title: 'Classificação Completa', description: 'Lista ordinal.', searchLabel: 'Buscar jogador', searchPlaceholder: 'Nome ou SteamID64', position: 'Pos', player: 'Jogador', record: 'V/D', win: 'V', loss: 'D', winPct: 'Vit%', winMobile: 'Vit' }, searchEmpty: { title: 'Nenhum jogador encontrado', description: 'A busca atual não encontrou nome ou SteamID64 correspondente.' }, guide: { eyebrow: 'Como ler', title: 'Score e Impact', score: 'Resumo do Score.', impact: 'Descrição do Impact.' }, date: { unavailable: 'Sem data disponível' } } });
    translate.setTranslation(
      'pt-BR',
      { shared: { playerAvatar: { alt: 'Avatar de {{displayName}}' } } },
      true,
    );
    translate.setTranslation('en-US', { ranking: { hero: { eyebrow: 'Overall Ranking', title: 'HSC Overall Ranking', description: 'Overall player ranking.', synced: 'Data synced', lastUpdated: 'Last updated' }, states: { loading: { title: 'Loading overall ranking...', message: 'Syncing the player ranking.' }, error: { title: 'Ranking unavailable', message: 'Could not load.', retry: 'Try again' }, empty: { title: 'No ranked players', message: 'No ranking data is available.' } }, summary: { ariaLabel: 'Overall ranking summary', players: 'Players', completedMaps: 'Completed maps', currentLeader: 'Current leader', noLeader: 'No leader' }, podium: { ariaLabel: 'Top 3 podium', eyebrow: 'Podium', title: 'Community Top 3', description: 'Highest scoring players.', gold: 'Gold · Champion', silver: 'Silver', bronze: 'Bronze', player: 'Player', wins: 'Wins', losses: 'Losses' }, players: { unnamedAccessible: 'Unnamed player', unnamed: 'Unnamed', you: 'You' }, table: { ariaLabel: 'Full ranking table', mobileAriaLabel: 'Full ranking', eyebrow: 'Ranking', title: 'Full Ranking', description: 'Ordered list.', searchLabel: 'Search player', searchPlaceholder: 'Name or SteamID64', position: 'Pos', player: 'Player', record: 'W/L', win: 'W', loss: 'L', winPct: 'Win%', winMobile: 'Win' }, searchEmpty: { title: 'No players found', description: 'No matching name or SteamID64.' }, guide: { eyebrow: 'How to read', title: 'Score and Impact', score: 'Score summary.', impact: 'Impact description.' }, date: { unavailable: 'No date available' } } });
    void translate.use('pt-BR');
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
    const publishedRanking = {
      ...mockRanking,
      players: [mockPlayer3, mockPlayer1, mockPlayer2, mockPlayer4],
    } satisfies Ranking;
    mockRankingApi.getRanking.mockReturnValue(of(publishedRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.podium).toHaveLength(3);
    expect(vm.podium[0]).toEqual(mockPlayer3);
    expect(vm.podium[1]).toEqual(mockPlayer1);
    expect(vm.podium[2]).toEqual(mockPlayer2);
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

  it('16. Ranking vazio emite estado empty', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockEmptyRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = captureLatest(page.publicVm$);

    expect(vm).toEqual({ state: 'empty' });
  });

  it('17. Ranking vazio não é tratado como erro', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockEmptyRanking));

    const page = TestBed.inject(TestableRankingPage);
    const vm = captureLatest(page.publicVm$);

    expect(vm?.state).toBe('empty');
    expect(vm?.state).not.toBe('error');
  });

  it('18. erro do Observable exibe o estado de erro atual', () => {
    mockRankingApi.getRanking.mockReturnValue(throwError(() => new Error('HTTP 500')));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireErrorVm(captureLatest(page.publicVm$));

    expect(vm).toEqual({ state: 'error' });
  });

  it('19. erro encerra loading', () => {
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

  it('20. erro não exibe dados de sucesso', () => {
    mockRankingApi.getRanking.mockReturnValue(throwError(() => new Error('HTTP 500')));

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireErrorVm(captureLatest(page.publicVm$));

    expect('players' in vm).toBe(false);
    expect('rankedPlayerCount' in vm).toBe(false);
  });

  it('21. não existe segunda chamada ao serviço durante detecções de mudança', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(mockRankingApi.getRanking).toHaveBeenCalledTimes(1);
  });

  it('22. chamada de retry re-executa a requisição após erro e transita para ready', () => {
    mockRankingApi.getRanking.mockReturnValueOnce(throwError(() => new Error('HTTP 500')));
    mockRankingApi.getRanking.mockReturnValueOnce(of(mockRanking));

    const page = TestBed.inject(TestableRankingPage);
    const states: string[] = [];

    const sub = page.publicVm$.subscribe((vm) => states.push(vm.state));

    expect(states).toEqual(['loading', 'error']);

    page.callRetry();

    expect(states).toEqual(['loading', 'error', 'loading', 'ready']);
    expect(mockRankingApi.getRanking).toHaveBeenCalledTimes(2);

    sub.unsubscribe();
  });

  it('23. template no estado empty preserva header e page-state', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockEmptyRanking));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Ranking Geral HSC');
    expect(element.querySelector('app-page-state')).not.toBeNull();
  });

  it('24. sessão autenticada identifica somente o SteamID64 correspondente', () => {
    mockSessionState.set({
      status: 'authenticated',
      displayName: 'fer',
      steamId64: mockPlayer2.steamId64,
      avatarMedium: null,
    });

    const page = TestBed.inject(TestableRankingPage);

    expect(page.callIsCurrentPlayer(mockPlayer1)).toBe(false);
    expect(page.callIsCurrentPlayer(mockPlayer2)).toBe(true);
    expect(page.callIsCurrentPlayer(mockPlayer3)).toBe(false);
  });

  it('25. tabela destaca visualmente somente a row do jogador autenticado', () => {
    mockSessionState.set({
      status: 'authenticated',
      displayName: 'fer',
      steamId64: mockPlayer2.steamId64,
      avatarMedium: null,
    });

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const highlightedRows = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'tbody tr[data-current-player="true"]',
    );

    expect(highlightedRows).toHaveLength(1);
    expect(highlightedRows[0].textContent).toContain('fer');
    expect(highlightedRows[0].textContent).toContain('Você');
  });

  it('26. sessão anonymous não destaca nenhum jogador', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const highlightedRows = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'tbody tr[data-current-player="true"]',
    );

    expect(highlightedRows).toHaveLength(0);
  });

  it('27. destaque da sessão não altera posição nem ordem canônica', () => {
    mockSessionState.set({
      status: 'authenticated',
      displayName: 'coldzera',
      steamId64: mockPlayer3.steamId64,
      avatarMedium: null,
    });

    const page = TestBed.inject(TestableRankingPage);
    const vm = requireReadyVm(captureLatest(page.publicVm$));

    expect(vm.players.map((player) => player.steamId64)).toEqual(
      mockRanking.players.map((player) => player.steamId64),
    );
    expect(vm.players.map((player) => player.position)).toEqual([1, 2, 3, 4]);
  });

  it('28. usuário autenticado no Top 3 recebe badge Você também no pódio', () => {
    mockSessionState.set({
      status: 'authenticated',
      displayName: 'Fallen',
      steamId64: mockPlayer1.steamId64,
      avatarMedium: null,
    });

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const highlightedPodium = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.ranking-page__podium-item[data-current-player="true"]',
    );

    expect(highlightedPodium).toHaveLength(1);
    expect(highlightedPodium[0].textContent).toContain('Fallen');
    expect(highlightedPodium[0].textContent).toContain('Você');
  });

  it('29. winRate zero permanece zero na apresentação', () => {
    const page = TestBed.inject(TestableRankingPage);

    expect(page.callFormatRateAsPct(0)).toBe('0.0%');
  });

  it('30. apresentação usa somente conceitos fornecidos pelo ranking', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(content).not.toContain('Season 02');
    expect(content).not.toContain('128 tick');
  });

  it('31. troca copy, labels compactos e busca para en-US preservando dados e terminologia', async () => {
    mockSessionState.set({ status: 'authenticated', displayName: 'fer', steamId64: mockPlayer2.steamId64, avatarMedium: null });
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('V/D');

    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('HSC Overall Ranking');
    expect(element.textContent).toContain('W/L');
    expect(element.textContent).toContain('You');
    expect(element.textContent).toContain('fer');
    expect(element.textContent).toContain(mockPlayer2.steamId64);
    expect(element.querySelector('label[for="ranking-search-input"]')?.textContent).toContain('Search player');
    expect(element.querySelector('#ranking-search-input')?.getAttribute('placeholder')).toBe('Name or SteamID64');
    for (const term of ['Score', 'Impact', 'K/D', 'ADR', 'HS%']) expect(element.textContent).toContain(term);
  });

  it('32. localiza fallbacks de jogador sem nome e data ausente', async () => {
    mockRankingApi.getRanking.mockReturnValue(of({ ...mockRanking, generatedAt: null }));
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sem data disponível');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sem nome');

    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No date available');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Unnamed');
  });

  it('33. ranking fica ready mesmo quando o enrichment Auth falha', () => {
    mockPresentation.resolve.mockReturnValue(throwError(() => new Error('HTTP 401')));
    const page = TestBed.inject(TestableRankingPage);

    const vm = requireReadyVm(captureLatest(page.publicVm$));
    expect(vm.players).toEqual(mockRanking.players);
    expect(vm.presentationReferences.size).toBe(0);
  });

  it('34. ranking emite ready estático antes de o enrichment responder', () => {
    const references$ = new Subject<ReadonlyMap<string, PlayerPresentationReference>>();
    mockPresentation.resolve.mockReturnValue(references$);
    const states: Array<{ state: string; name?: string | null }> = [];

    const page = TestBed.inject(TestableRankingPage);
    page.publicVm$.subscribe((vm) => states.push({
      state: vm.state,
      name: vm.state === 'ready'
        ? vm.presentationReferences.get(mockPlayer1.steamId64)?.steam.personaname ?? mockPlayer1.name
        : undefined,
    }));

    expect(states).toEqual([
      { state: 'loading', name: undefined },
      { state: 'ready', name: 'Fallen' },
    ]);
    references$.next(presentationMap());
    expect(states.at(-1)).toEqual({ state: 'ready', name: 'Lavos' });
  });

  it('35. resolve todas as identidades em uma única operação batch, sem N+1', () => {
    const page = TestBed.inject(TestableRankingPage);
    page.publicVm$.subscribe();

    expect(mockPresentation.resolve).toHaveBeenCalledTimes(1);
    expect([...mockPresentation.resolve.mock.calls[0][0]]).toEqual(
      mockRanking.players.map((player) => player.steamId64),
    );
  });

  it('36. busca encontra current name sem perder nome ETL nem SteamID64', () => {
    const page = TestBed.inject(TestableRankingPage);
    const references = presentationMap();

    for (const term of ['lavos', 'fallen', mockPlayer1.steamId64]) {
      page.callUpdateSearch(createInputEvent(term));
      expect(page.callFilteredPlayersWithReferences(mockRanking.players, references)).toEqual([
        mockPlayer1,
      ]);
    }
  });

  it('37. personaname atual aparece no leader, podium, desktop e mobile com link público', () => {
    mockPresentation.resolve.mockReturnValue(of(presentationMap()));
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const selectors = [
      '.ranking-page__summary-card:last-child',
      '.ranking-page__podium-item:first-child',
      'tbody tr:first-child',
      '.ranking-page__mobile-player:first-child',
    ];
    for (const selector of selectors) {
      const block = element.querySelector(selector);
      expect(block?.textContent).toContain('Lavos');
      expect(block?.textContent).not.toContain('Fallen');
      expect(block?.querySelector('app-player-link a')?.getAttribute('href')).toBe('/players/lavos');
    }
  });

  it('38. profile null mantém current name como texto sem anchor', () => {
    mockPresentation.resolve.mockReturnValue(of(presentationMap({ profile: null })));
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const firstRowLink = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr:first-child app-player-link',
    );
    expect(firstRowLink?.textContent).toContain('Lavos');
    expect(firstRowLink?.querySelector('a')).toBeNull();
  });

  it('39. sem reference ou com personaname null mantém RankingPlayer.name', () => {
    mockPresentation.resolve.mockReturnValue(of(presentationMap({ personaname: null })));
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('tbody tr:first-child')?.textContent)
      .toContain('Fallen');
  });

  it('40. avatar de presentation tem precedência e usa o current name acessível', () => {
    mockSessionState.set({
      status: 'authenticated',
      displayName: 'Fallen',
      steamId64: mockPlayer1.steamId64,
      avatarMedium: 'https://session/avatar.jpg',
    });
    const references = presentationMap();
    mockPresentation.resolve.mockReturnValue(of(references));
    const page = TestBed.inject(TestableRankingPage);
    expect(page.callAvatarUrlFor(mockPlayer1, references)).toBe('https://steam/avatar.jpg');

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    const image = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr:first-child app-player-avatar img',
    );
    expect(image?.getAttribute('src')).toBe('https://steam/avatar.jpg');
    expect(image?.getAttribute('alt')).toBe('Avatar de Lavos');
  });

  it('41. retry remove referências antigas enquanto a nova resolução está pendente', () => {
    mockPresentation.resolve.mockReturnValueOnce(of(presentationMap())).mockReturnValueOnce(NEVER);
    const page = TestBed.inject(TestableRankingPage);
    const emissions: ExposedRankingVm[] = [];
    page.publicVm$.subscribe((vm) => emissions.push(vm));
    expect(requireReadyVm(emissions.at(-1)).presentationReferences.size).toBe(1);

    page.callRetry();
    expect(requireReadyVm(emissions.at(-1)).presentationReferences.size).toBe(0);
  });
});

function presentationMap(
  overrides: Partial<PlayerPresentationReference['steam']> & {
    profile?: PlayerPresentationReference['profile'];
  } = {},
): ReadonlyMap<string, PlayerPresentationReference> {
  const { profile, ...steamOverrides } = overrides;
  return new Map([
    [
      '76561198000000001',
      {
        steam: {
          steamId64: '76561198000000001',
          personaname: 'Lavos',
          avatarMediumUrl: 'https://steam/avatar.jpg',
          ...steamOverrides,
        },
        profile: profile === undefined ? { slug: 'lavos' } : profile,
      },
    ],
  ]);
}
