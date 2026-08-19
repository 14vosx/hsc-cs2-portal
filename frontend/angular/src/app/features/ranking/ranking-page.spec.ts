import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, NEVER, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  PlayerPresentationReference,
} from '../../core/player-presentation/player-presentation-reference.model';
import { PlayerPresentationReferenceService } from '../../core/player-presentation/player-presentation-reference.service';
import type { PlayerSession } from '../../core/session/player-session.model';
import { PlayerSessionService } from '../../core/session/player-session.service';
import { RankingApiService } from './data-access/ranking-api.service';
import type { Ranking, RankingPlayer } from './domain/ranking.model';
import { RankingPage } from './ranking-page';

type RankingApiServiceMock = {
  getRanking: Mock<RankingApiService['getRanking']>;
};

function setSearch(fixture: ComponentFixture<RankingPage>, term: string): void {
  const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
    '#ranking-search-input',
  );
  if (!input) {
    throw new Error('Search input not found');
  }
  input.value = term;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
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

  it('1. o componente pode ser instanciado e renderizado', () => {
    const fixture = TestBed.createComponent(RankingPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('2. RankingApiService.getRanking() é chamado na inicialização', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    expect(mockRankingApi.getRanking).toHaveBeenCalledTimes(1);
  });

  it('3. estado inicial de loading é exibido antes da resposta do ranking', () => {
    mockRankingApi.getRanking.mockReturnValue(NEVER);
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const loadingState = element.querySelector('app-page-state[type="loading"]');
    expect(loadingState).not.toBeNull();
    expect(loadingState?.textContent).toContain(
      'Sincronizando a classificação dos jogadores.',
    );
  });

  it('4. resposta de ranking encerra loading e renderiza a página de ranking', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-page-state')).toBeNull();
    expect(element.querySelector('.ranking-page__metrics')).not.toBeNull();
    expect(element.querySelector('.ranking-page__podium-section')).not.toBeNull();
    expect(element.querySelector('.ranking-page__table-section')).not.toBeNull();
  });

  it('5. exibe métricas resumidas de jogadores classificados, mapas concluídos e líder atual', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const summaryCards = element.querySelectorAll('.ranking-page__summary-card');
    expect(summaryCards).toHaveLength(3);
    expect(summaryCards[0].textContent).toContain('4');
    expect(summaryCards[0].textContent).toContain('Jogadores');
    expect(summaryCards[1].textContent).toContain('15');
    expect(summaryCards[1].textContent).toContain('Mapas finalizados');
    expect(summaryCards[2].textContent).toContain('Fallen');
    expect(summaryCards[2].textContent).toContain('Líder atual');
  });

  it('6. pódio renderiza os três primeiros colocados com medalhas correspondentes', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const podiumItems = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.ranking-page__podium-item',
    );
    expect(podiumItems).toHaveLength(3);
    expect(podiumItems[0].textContent).toContain('Fallen');
    expect(podiumItems[0].textContent).toContain('#1');
    expect(podiumItems[0].textContent).toContain('Ouro · Campeão');

    expect(podiumItems[1].textContent).toContain('fer');
    expect(podiumItems[1].textContent).toContain('#2');
    expect(podiumItems[1].textContent).toContain('Prata');

    expect(podiumItems[2].textContent).toContain('coldzera');
    expect(podiumItems[2].textContent).toContain('#3');
    expect(podiumItems[2].textContent).toContain('Bronze');
  });

  it('7. tabela exibe jogadores na ordem canônica com posição e SteamID64', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows).toHaveLength(4);

    expect(rows[0].querySelector('.ranking-page__cell-pos')?.textContent).toBe('#1');
    expect(rows[0].querySelector('.ranking-page__player-name')?.textContent).toContain('Fallen');
    expect(rows[0].querySelector('.ranking-page__player-steamid')?.textContent).toBe('76561198000000001');

    expect(rows[1].querySelector('.ranking-page__cell-pos')?.textContent).toBe('#2');
    expect(rows[1].querySelector('.ranking-page__player-name')?.textContent).toContain('fer');
    expect(rows[1].querySelector('.ranking-page__player-steamid')?.textContent).toBe('76561198000000002');

    expect(rows[2].querySelector('.ranking-page__cell-pos')?.textContent).toBe('#3');
    expect(rows[2].querySelector('.ranking-page__player-name')?.textContent).toContain('coldzera');
    expect(rows[2].querySelector('.ranking-page__player-steamid')?.textContent).toBe('76561198000000003');

    expect(rows[3].querySelector('.ranking-page__cell-pos')?.textContent).toBe('#4');
    expect(rows[3].querySelector('.ranking-page__player-name')?.textContent).toContain('Sem nome');
    expect(rows[3].querySelector('.ranking-page__player-steamid')?.textContent).toBe('76561198000000004');
  });

  it('8. busca por nome filtra linhas da tabela', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    setSearch(fixture, 'fallen');

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Fallen');
  });

  it('9. busca por SteamID filtra linhas da tabela', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    setSearch(fixture, '76561198000000002');

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('fer');
  });

  it('10. busca é segura quando jogador possui nome nulo', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    setSearch(fixture, '76561198000000004');

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('76561198000000004');
  });

  it('11. consulta vazia restaura todos os jogadores', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    setSearch(fixture, 'fallen');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')).toHaveLength(1);

    setSearch(fixture, '   ');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('12. busca sem resultados exibe estado vazio de busca', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    setSearch(fixture, 'jogador-inexistente');

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('tbody tr')).toHaveLength(0);
    const emptyState = element.querySelector('app-empty-state');
    expect(emptyState).not.toBeNull();
    expect(element.textContent).toContain('Nenhum jogador encontrado');
  });

  it('13. ranking vazio renderiza estado de página vazia preservando o cabeçalho', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockEmptyRanking));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Ranking Geral HSC');
    const emptyState = element.querySelector('app-page-state');
    expect(emptyState).not.toBeNull();
    expect(element.textContent).toContain('Nenhum jogador classificado');
    expect(element.querySelector('.ranking-page__metrics')).toBeNull();
    expect(element.querySelector('.ranking-page__table-section')).toBeNull();
  });

  it('14. erro na API encerra loading e renderiza estado de erro sem dados parciais', () => {
    mockRankingApi.getRanking.mockReturnValue(throwError(() => new Error('HTTP 500')));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const errorState = element.querySelector('app-page-state');
    expect(errorState).not.toBeNull();
    expect(element.textContent).toContain('Ranking indisponível');
    expect(element.querySelector('.ranking-page__metrics')).toBeNull();
    expect(element.querySelector('.ranking-page__table-section')).toBeNull();
  });

  it('15. não dispara segunda chamada ao serviço durante detecções de mudança repetidas', () => {
    mockRankingApi.getRanking.mockReturnValue(of(mockRanking));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(mockRankingApi.getRanking).toHaveBeenCalledTimes(1);
  });

  it('16. ação de retry no estado de erro dispara nova requisição e transita para ready', () => {
    mockRankingApi.getRanking.mockReturnValueOnce(throwError(() => new Error('HTTP 500')));
    mockRankingApi.getRanking.mockReturnValueOnce(of(mockRanking));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Ranking indisponível');

    const retryButton = element.querySelector<HTMLButtonElement>('.page-state__btn');
    expect(retryButton).not.toBeNull();
    retryButton?.click();
    fixture.detectChanges();

    expect(mockRankingApi.getRanking).toHaveBeenCalledTimes(2);
    expect(element.querySelector('app-page-state')).toBeNull();
    expect(element.querySelector('.ranking-page__table-section')).not.toBeNull();
    expect(element.textContent).toContain('Fallen');
  });

  it('17. sessão autenticada destaca visualmente somente a linha do jogador correspondente', () => {
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

  it('18. sessão anônima não destaca nenhum jogador na tabela', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const highlightedRows = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'tbody tr[data-current-player="true"]',
    );

    expect(highlightedRows).toHaveLength(0);
  });

  it('19. destaque da sessão não altera a ordem canônica nem posições exibidas', () => {
    mockSessionState.set({
      status: 'authenticated',
      displayName: 'coldzera',
      steamId64: mockPlayer3.steamId64,
      avatarMedium: null,
    });

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows).toHaveLength(4);
    expect(rows[0].querySelector('.ranking-page__cell-pos')?.textContent).toBe('#1');
    expect(rows[0].querySelector('.ranking-page__player-name')?.textContent).toContain('Fallen');

    expect(rows[1].querySelector('.ranking-page__cell-pos')?.textContent).toBe('#2');
    expect(rows[1].querySelector('.ranking-page__player-name')?.textContent).toContain('fer');

    expect(rows[2].querySelector('.ranking-page__cell-pos')?.textContent).toBe('#3');
    expect(rows[2].querySelector('.ranking-page__player-name')?.textContent).toContain('coldzera');
    expect(rows[2].getAttribute('data-current-player')).toBe('true');

    expect(rows[3].querySelector('.ranking-page__cell-pos')?.textContent).toBe('#4');
  });

  it('20. usuário autenticado no Top 3 recebe badge Você no pódio', () => {
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

  it('21. winRate zero é formatado como 0.0% na apresentação da tabela', () => {
    const rankingWithZeroWinRate: Ranking = {
      ...mockRanking,
      players: [{ ...mockPlayer1, winRate: 0 }],
    };
    mockRankingApi.getRanking.mockReturnValue(of(rankingWithZeroWinRate));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const winRateCell = (fixture.nativeElement as HTMLElement).querySelector(
      '.ranking-page__win-rate',
    );
    expect(winRateCell?.textContent).toContain('0.0%');
  });

  it('22. apresentação usa somente conceitos fornecidos pelo ranking', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(content).not.toContain('Season 02');
    expect(content).not.toContain('128 tick');
  });

  it('23. troca copy, labels compactos e busca para en-US preservando dados e terminologia', async () => {
    mockSessionState.set({
      status: 'authenticated',
      displayName: 'fer',
      steamId64: mockPlayer2.steamId64,
      avatarMedium: null,
    });
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
    expect(element.querySelector('label[for="ranking-search-input"]')?.textContent).toContain(
      'Search player',
    );
    expect(element.querySelector('#ranking-search-input')?.getAttribute('placeholder')).toBe(
      'Name or SteamID64',
    );
    for (const term of ['Score', 'Impact', 'K/D', 'ADR', 'HS%']) {
      expect(element.textContent).toContain(term);
    }
  });

  it('24. localiza fallbacks de jogador sem nome e data ausente', async () => {
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

  it('25. ranking renderiza dados mesmo quando a resolução de referências falha', () => {
    mockPresentation.resolve.mockReturnValue(throwError(() => new Error('HTTP 401')));
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-page-state')).toBeNull();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(element.querySelector('tbody tr:first-child')?.textContent).toContain('Fallen');
  });

  it('26. renderiza dados estáticos antes da resolução assíncrona de apresentação responder', () => {
    const references$ = new Subject<ReadonlyMap<string, PlayerPresentationReference>>();
    mockPresentation.resolve.mockReturnValue(references$);

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('tbody tr:first-child')?.textContent).toContain('Fallen');

    references$.next(presentationMap());
    fixture.detectChanges();

    expect(element.querySelector('tbody tr:first-child')?.textContent).toContain('Lavos');
  });

  it('27. resolve todas as identidades em uma única operação batch, sem N+1', () => {
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    expect(mockPresentation.resolve).toHaveBeenCalledTimes(1);
    expect([...mockPresentation.resolve.mock.calls[0][0]]).toEqual(
      mockRanking.players.map((player) => player.steamId64),
    );
  });

  it('28. busca encontra personaname resolvido sem perder busca por nome ETL nem SteamID64', () => {
    mockPresentation.resolve.mockReturnValue(of(presentationMap()));
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    for (const term of ['lavos', 'fallen', mockPlayer1.steamId64]) {
      setSearch(fixture, term);
      const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain('Lavos');
      expect(rows[0].textContent).toContain(mockPlayer1.steamId64);
    }
  });

  it('29. personaname atual aparece no leader, podium, desktop e mobile com link público', () => {
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

  it('30. profile null mantém current name como texto sem anchor', () => {
    mockPresentation.resolve.mockReturnValue(of(presentationMap({ profile: null })));
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const firstRowLink = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr:first-child app-player-link',
    );
    expect(firstRowLink?.textContent).toContain('Lavos');
    expect(firstRowLink?.querySelector('a')).toBeNull();
  });

  it('31. sem reference ou com personaname null mantém RankingPlayer.name', () => {
    mockPresentation.resolve.mockReturnValue(of(presentationMap({ personaname: null })));
    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('tbody tr:first-child')?.textContent,
    ).toContain('Fallen');
  });

  it('32. avatar de presentation tem precedência e usa o current name acessível', () => {
    mockSessionState.set({
      status: 'authenticated',
      displayName: 'Fallen',
      steamId64: mockPlayer1.steamId64,
      avatarMedium: 'https://session/avatar.jpg',
    });
    mockPresentation.resolve.mockReturnValue(of(presentationMap()));

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    const image = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr:first-child app-player-avatar img',
    );
    expect(image?.getAttribute('src')).toBe('https://steam/avatar.jpg');
    expect(image?.getAttribute('alt')).toBe('Avatar de Lavos');
  });

  it('33. retry remove presentation data antiga enquanto a nova resolução permanece pendente', () => {
    const ranking$ = new Subject<Ranking>();
    mockRankingApi.getRanking.mockReturnValueOnce(ranking$).mockReturnValueOnce(of(mockRanking));

    const presentation$ = new Subject<ReadonlyMap<string, PlayerPresentationReference>>();
    mockPresentation.resolve.mockReturnValueOnce(presentation$).mockReturnValueOnce(NEVER);

    const fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();

    ranking$.next(mockRanking);
    fixture.detectChanges();

    presentation$.next(presentationMap());
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('tbody tr:first-child')?.textContent).toContain('Lavos');

    ranking$.error(new Error('Network error'));
    fixture.detectChanges();

    const retryButton = element.querySelector<HTMLButtonElement>('.page-state__btn');
    expect(retryButton).not.toBeNull();
    retryButton?.click();
    fixture.detectChanges();

    expect(element.querySelector('tbody tr:first-child')?.textContent).toContain('Fallen');
    expect(element.textContent).not.toContain('Lavos');
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
