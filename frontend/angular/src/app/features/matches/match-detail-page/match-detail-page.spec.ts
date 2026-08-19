import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, type ParamMap } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchesApiService, MatchesContractError } from '../data-access/matches-api.service';
import type { MatchDetail, MatchDetailMap, MatchPlayerStats, MatchTeam } from '../domain/match.model';
import { MatchDetailPage } from './match-detail-page';

const stats = (kills: number, deaths: number, damage: number): MatchPlayerStats => ({
  kills, deaths, damage, assists: 5, enemy5Ks: 0, enemy4Ks: 0, enemy3Ks: 1, enemy2Ks: 2,
  utilityCount: 0, utilityDamage: 0, utilitySuccesses: 0, utilityEnemies: 0,
  flashCount: 0, flashSuccesses: 0, healthPointsRemovedTotal: 0,
  healthPointsDealtTotal: 0, shotsFiredTotal: 0, shotsOnTargetTotal: 0,
  v1Count: 0, v1Wins: 0, v2Count: 0, v2Wins: 0, entryCount: 0, entryWins: 0,
  equipmentValue: 0, moneySaved: 0, killReward: 0, liveTime: 0,
  headShotKills: 0, cashEarned: 0, enemiesFlashed: 0,
});

const team = (name: string, kills: number): MatchTeam => ({
  team: name,
  players: [],
  teamTotals: stats(kills, 10, kills * 90),
});

const mapDetail = (
  matchId: number,
  mapNumber: number,
  name: string | null,
  winner: string,
  team1Score: number,
  team2Score: number
): MatchDetailMap => ({
  matchId,
  mapNumber,
  startedAt: `2026-08-04T1${mapNumber - 1}:00:00Z`,
  endedAt: `2026-08-04T1${mapNumber - 1}:40:00Z`,
  winner,
  name,
  team1Score,
  team2Score,
  teams: [team('Team A', 20), team('Team B', 14)],
});

const createMockDetail = (id = 501): MatchDetail => ({
  generatedAt: '2026-08-04T12:00:00Z',
  id,
  match: {
    id,
    startedAt: '2026-08-04T10:00:00Z',
    endedAt: '2026-08-04T11:30:00Z',
    winner: 'Team B',
    seriesType: 'BO3',
    team1: { name: 'Team A', score: 1 },
    team2: { name: 'Team B', score: 2 },
    serverIp: '10.0.0.1:27015',
  },
  computed: { teams: ['Team A', 'Team B'], mapsPlayed: 2, bestOf: 3, partialSeries: false },
  maps: [
    mapDetail(id, 1, 'de_nuke', 'Team A', 13, 7),
    mapDetail(id, 2, 'de_mirage', 'Team B', 9, 13),
  ],
  totals: [],
  limitations: ['Nota sobre ETL incompleto'],
});

describe('MatchDetailPage', () => {
  let fixture: ComponentFixture<MatchDetailPage>;
  let matchesApiMock: { getMatch: ReturnType<typeof vi.fn> };
  let paramMapSubject: BehaviorSubject<ParamMap>;

  beforeEach(() => {
    matchesApiMock = { getMatch: vi.fn() };
    paramMapSubject = new BehaviorSubject(convertToParamMap({ matchId: '501' }));

    TestBed.configureTestingModule({
      imports: [MatchDetailPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MatchesApiService, useValue: matchesApiMock },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', { matchDetail: { states: { loading: { eyebrow: 'Relatório competitivo', title: 'Detalhe da partida', description: 'Carregando relatório competitivo.', pageTitle: 'Carregando partida...', pageMessage: 'Buscando detalhes do confronto.' }, notFound: { eyebrow: 'Partidas', title: 'Partida não encontrada', description: 'O registro solicitado não foi localizado.', pageMessage: 'Não encontrada', action: 'Voltar para partidas' }, error: { eyebrow: 'Partidas', title: 'Partida indisponível', description: 'Erro', pageTitle: 'Erro ao carregar partida', pageMessage: 'Erro', retry: 'Tentar novamente' } }, backToMatches: '← Voltar para partidas', hero: { match: 'Partida #{{ id }}', seriesUnavailable: 'Série não informada', winner: 'Vencedor', matchWinner: 'Vencedor do confronto' }, summary: { ariaLabel: 'Resumo da partida', series: 'Série', seriesUnavailable: 'Não informada', score: 'Placar', maps: 'Mapas', bestOf: 'Best of', partialSeries: 'Série parcial' }, maps: { eyebrow: 'Mapas', title: 'Navegação da série', description: 'Selecione um mapa.', selectAriaLabel: 'Selecionar mapa', winnerPrefix: 'Vencedor:', mapNumber: 'Mapa #{{ number }}', winner: 'Vencedor', detailCta: 'Ver detalhe do mapa' }, teams: { label: 'Time', kills: 'Abates', deaths: 'Mortes', damage: 'Dano' }, notes: { eyebrow: 'Notas do relatório', title: 'Limitações dos dados' }, fallbacks: { team: 'Time não informado', map: 'Mapa sem nome', date: 'Sem data disponível', winner: 'Sem vencedor' } }, matchPlayerTable: { ariaLabel: 'Estatísticas dos jogadores', columns: { player: 'Jogador' }, fallbacks: { unnamed: 'Sem nome' } } });
    translate.setTranslation('en-US', { matchDetail: { backToMatches: '← Back to matches', hero: { match: 'Match #{{ id }}', seriesUnavailable: 'Series unavailable', winner: 'Winner', matchWinner: 'Match winner' }, summary: { ariaLabel: 'Match summary', series: 'Series', seriesUnavailable: 'Unavailable', score: 'Score', maps: 'Maps', bestOf: 'Best of', partialSeries: 'Partial series' }, maps: { eyebrow: 'Maps', title: 'Series navigation', description: 'Select a map to view team performance.', selectAriaLabel: 'Select map', winnerPrefix: 'Winner:', mapNumber: 'Map #{{ number }}', winner: 'Winner', detailCta: 'View map details' }, teams: { label: 'Team', kills: 'Kills', deaths: 'Deaths', damage: 'Damage' }, notes: { eyebrow: 'Report notes', title: 'Data limitations' }, fallbacks: { team: 'Team unavailable', map: 'Unnamed map', date: 'No date available', winner: 'No winner' } }, matchPlayerTable: { ariaLabel: 'Player statistics', columns: { player: 'Player' }, fallbacks: { unnamed: 'Unnamed player' } } });
    void translate.use('pt-BR');
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(MatchDetailPage);
    fixture.detectChanges();
  };

  it('não faz request e exibe not-found para matchId inválido', () => {
    paramMapSubject.next(convertToParamMap({ matchId: '12.3' }));
    createComponent();

    expect(matchesApiMock.getMatch).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Partida não encontrada');
  });

  it('converte HTTP 404 em not-found', () => {
    matchesApiMock.getMatch.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
    );
    createComponent();
    expect(fixture.nativeElement.textContent).toContain('Partida não encontrada');
  });

  it('converte erro não-404 em error e preserva retry', () => {
    matchesApiMock.getMatch
      .mockReturnValueOnce(throwError(() => new MatchesContractError('Payload malformado')))
      .mockReturnValueOnce(of(createMockDetail()));
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar partida');

    const retryBtn = fixture.nativeElement.querySelector('.page-state__btn') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();
    retryBtn.click();
    fixture.detectChanges();

    expect(matchesApiMock.getMatch).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('app-page-state')).toBeNull();
    expect(fixture.nativeElement.querySelector('.match-report__hero')).toBeTruthy();
  });

  it('hero usa times e placar reais sem reordenar team1 e team2', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail()));
    createComponent();

    const hero = fixture.nativeElement.querySelector('.match-report__hero') as HTMLElement;
    const teams = hero.querySelectorAll('.match-report__team');
    expect(teams[0].textContent).toContain('Team A');
    expect(teams[0].textContent).toContain('1');
    expect(teams[1].textContent).toContain('Team B');
    expect(teams[1].textContent).toContain('2');
  });

  it('comunica textualmente o vencedor correspondente ao contrato', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail()));
    createComponent();

    const winner = fixture.nativeElement.querySelector('.match-report__team--two');
    expect(winner.classList.contains('is-winner')).toBe(true);
    expect(winner.textContent).toContain('Vencedor');
    expect(fixture.nativeElement.querySelector('.match-report__team--one').classList.contains('is-winner')).toBe(false);
  });

  it('summary usa seriesType, placar e computed reais', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail()));
    createComponent();
    const summary = fixture.nativeElement.querySelector('.match-report__summary') as HTMLElement;

    expect(summary.textContent).toContain('BO3');
    expect(summary.textContent).toContain('1 × 2');
    expect(summary.textContent).toContain('Mapas');
    expect(summary.textContent).toContain('2');
    expect(summary.textContent).toContain('Best of');
    expect(summary.textContent).toContain('3');
  });

  it('preserva a ordem publicada das tabs e seleciona o primeiro mapa por default', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail()));
    createComponent();
    const tabs = fixture.nativeElement.querySelectorAll('.match-report__map-tabs button');

    expect(tabs[0].textContent).toContain('de_nuke');
    expect(tabs[1].textContent).toContain('de_mirage');
    expect(tabs[0].getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.match-report__active-map').textContent).toContain('de_nuke');
  });

  it('selecionar outro mapa troca o conteúdo sem novo request HTTP', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail()));
    createComponent();

    const secondTab = fixture.nativeElement.querySelectorAll('.match-report__map-tabs button')[1];
    secondTab.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.match-report__active-map').textContent).toContain('de_mirage');
    expect(matchesApiMock.getMatch).toHaveBeenCalledTimes(1);
  });

  it('mapa sem nome usa fallback e não cria link /maps', () => {
    const detail = createMockDetail();
    const unnamed = { ...detail.maps[0], name: null };
    matchesApiMock.getMatch.mockReturnValue(of({ ...detail, maps: [unnamed] }));
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Mapa sem nome');
    expect(fixture.nativeElement.querySelector('.match-report__active-map a')).toBeNull();
  });

  it('cria /maps/:name apenas para mapa nomeado', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail()));
    createComponent();
    const mapLink = fixture.nativeElement.querySelector('.match-report__active-map a');
    expect(mapLink.getAttribute('href')).toBe('/maps/de_nuke');
  });

  it('preserva limitations exatamente como recebidas', () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail()));
    createComponent();
    expect(fixture.nativeElement.querySelector('.match-report__notes li').textContent.trim()).toBe(
      'Nota sobre ETL incompleto'
    );
  });

  it('comunica série parcial quando computed.partialSeries é true', () => {
    const detail = createMockDetail();
    matchesApiMock.getMatch.mockReturnValue(
      of({ ...detail, computed: { ...detail.computed, partialSeries: true } })
    );
    createComponent();
    expect(fixture.nativeElement.textContent).toContain('Série parcial');
  });

  it('troca a UI ready para en-US preservando mapa, domínio, limitations e request', async () => {
    matchesApiMock.getMatch.mockReturnValue(of(createMockDetail()));
    createComponent();
    const secondTab = fixture.nativeElement.querySelectorAll('.match-report__map-tabs button')[1];
    secondTab.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('← Voltar para partidas');
    expect(fixture.nativeElement.textContent).toContain('Limitações dos dados');

    const translate = TestBed.inject(TranslateService);
    await firstValueFrom(translate.use('en-US'));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('← Back to matches');
    expect(fixture.nativeElement.querySelector('.match-report__summary').getAttribute('aria-label')).toBe('Match summary');
    expect(text).toContain('Series navigation');
    expect(text).toContain('Kills');
    expect(text).toContain('Data limitations');
    expect(text).toContain('Best of');
    for (const value of ['Team A', 'Team B', 'de_nuke', 'de_mirage', 'BO3', '1 × 2', 'Partida #501']) {
      expect(text).toContain(value === 'Partida #501' ? 'Match #501' : value);
    }
    expect(fixture.nativeElement.querySelector('.match-report__active-map').textContent).toContain('de_mirage');
    expect(fixture.nativeElement.querySelector('.match-report__notes li').textContent.trim()).toBe('Nota sobre ETL incompleto');
    expect(matchesApiMock.getMatch).toHaveBeenCalledTimes(1);
  });
});
