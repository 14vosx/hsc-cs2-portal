import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import type { SeasonRankingDto } from '../../../core/api/dto/season-ranking.dto';
import type { SeasonsIndexDto } from '../../../core/api/dto/season.dto';
import { SeasonDetailPage } from './season-detail-page';
import { installSeasonsTranslations } from '../../../testing/seasons-i18n.fixture';

describe('SeasonDetailPage command center', () => {
  let fixture: ComponentFixture<SeasonDetailPage>;
  const api = { getSeasons: vi.fn(), getSeasonRanking: vi.fn() };
  const players = Array.from({ length: 7 }, (_, index) => ({
    rank: index + 1,
    steamid64: `steam-${index + 1}`,
    name: `Player ${index + 1}`,
    prizeEligible: index < 3,
    score: 100 - index,
    kdRatio: 1.2,
    adr: 80,
    mapsPlayed: 10,
  }));
  const ranking: SeasonRankingDto = {
    generatedAt: '2026-05-02T12:30:00Z',
    season: { slug: 's2', name: 'Season 02', description: 'Circuito competitivo atual.', status: 'published', start_at: '2026-01-01T00:00:00Z', end_at: '2026-06-30T00:00:00Z', cover_image_url: '/covers/s2.webp' },
    summary: { players: 24, eligiblePlayers: 8, matches: 0, maps: 20, rounds: 480, lastMapEndedAt: '2026-04-30T20:00:00Z' },
    rules: { minRoundsPerMap: 12, prizeEligibility: { minMapsPlayed: 5, minRoundsPlayed: 100 } },
    players,
  };
  const index: SeasonsIndexDto = { activeSeasonSlug: 's2', seasons: [{ slug: 's2', status: 'active' }] };

  beforeEach(() => {
    vi.clearAllMocks();
    api.getSeasons.mockReturnValue(of(index));
    api.getSeasonRanking.mockReturnValue(of(ranking));
  });

  async function render(options: {
    slug?: string;
    rankingResponse?: Observable<SeasonRankingDto>;
    indexResponse?: Observable<SeasonsIndexDto>;
  } = {}): Promise<HTMLElement> {
    TestBed.resetTestingModule();
    if (options.rankingResponse) api.getSeasonRanking.mockReturnValue(options.rankingResponse);
    if (options.indexResponse) api.getSeasons.mockReturnValue(options.indexResponse);
    await TestBed.configureTestingModule({
      imports: [SeasonDetailPage],
      providers: [
        provideTranslateService({ fallbackLang: 'pt-BR' }),
        provideRouter([]),
        { provide: Cs2ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(options.slug ? { slug: options.slug } : {})) } },
      ],
    }).compileComponents();
    await installSeasonsTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(SeasonDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows loading while the existing flow is pending', async () => {
    const native = await render({ slug: 's2', rankingResponse: new Subject<SeasonRankingDto>() });
    expect(native.textContent).toContain('Carregando temporada...');
  });

  it('switches overview copy at runtime without changing domain data or loading again', async () => {
    const native = await render({ slug: 's2' });
    const translate = TestBed.inject(TranslateService);
    expect(native.textContent).toContain('Todas as temporadas');
    expect(native.textContent).toContain('Top da temporada');
    expect(native.textContent).toContain('Critérios de elegibilidade');
    const calls = api.getSeasonRanking.mock.calls.length;
    const links = Array.from(native.querySelectorAll('a')).map((link) => link.getAttribute('href'));
    await translate.use('en-US').toPromise(); fixture.detectChanges();
    expect(native.textContent).toContain('All seasons');
    expect(native.textContent).toContain('Season top');
    expect(native.textContent).toContain('Eligibility criteria');
    expect(native.textContent).toContain(ranking.season!.name!);
    expect(native.textContent).toContain(ranking.season!.description!);
    expect(native.textContent).toContain('480');
    expect(Array.from(native.querySelectorAll('a')).map((link) => link.getAttribute('href'))).toEqual(links);
    expect(api.getSeasonRanking).toHaveBeenCalledTimes(calls);
  });

  it('shows error and season-not-found states', async () => {
    const error = await render({ slug: 's2', rankingResponse: throwError(() => new Error('network')) });
    expect(error.textContent).toContain('Temporada indisponível');
    const missing = await render({ slug: 's2', rankingResponse: of({ season: null }) });
    expect(missing.textContent).toContain('Temporada não encontrada');
  });

  it('uses the slug route without loading the seasons index', async () => {
    const native = await render({ slug: 'historical' });
    expect(api.getSeasonRanking).toHaveBeenCalledWith('historical');
    expect(api.getSeasons).not.toHaveBeenCalled();
    expect(native.textContent).toContain('published');
    expect(native.textContent).not.toContain('Temporada ativa');
  });

  it('uses the existing current context flow and labels the route context', async () => {
    const native = await render();
    expect(api.getSeasons).toHaveBeenCalledOnce();
    expect(api.getSeasonRanking).toHaveBeenCalledWith('s2');
    expect(native.textContent).toContain('Temporada ativa');
  });

  it('renders canonical identity, dates, generated metadata, cover and summary values', async () => {
    const native = await render({ slug: 's2' });
    expect(native.querySelector('.season-hero h1')?.textContent).toContain('Season 02');
    expect(native.textContent).toContain('Circuito competitivo atual.');
    expect(native.textContent).toContain('01/01/2026');
    expect(native.textContent).toContain('Dados atualizados');
    expect(native.textContent).toContain('Última atividade');
    expect(native.querySelector<HTMLElement>('.season-hero')?.style.getPropertyValue('--season-cover')).toContain('/covers/s2.webp');
    expect(native.querySelector('.season-snapshot')?.textContent).toContain('24');
    expect(native.querySelector('.season-snapshot')?.textContent).toContain('0');
  });

  it('uses the CSS cover fallback and presents absent summary values as unavailable', async () => {
    const native = await render({ slug: 's2', rankingResponse: of({ ...ranking, season: { ...ranking.season!, cover_image_url: null }, summary: null }) });
    expect(native.querySelector<HTMLElement>('.season-hero')?.style.getPropertyValue('--season-cover')).toBe('none');
    expect(native.querySelector('.season-snapshot')?.textContent?.match(/—/g)).toHaveLength(5);
  });

  it('preserves published player order and limits the preview to five without creating a podium', async () => {
    const native = await render({ slug: 's2' });
    const names = Array.from(native.querySelectorAll('.ranking-preview__player strong')).map((item) => item.textContent?.trim());
    expect(names).toEqual(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5']);
    expect(native.querySelector('app-season-podium')).toBeNull();
  });

  it('renders the podium only from published topPrizeCandidates', async () => {
    const native = await render({ slug: 's2', rankingResponse: of({ ...ranking, topPrizeCandidates: players.slice(0, 3) }) });
    expect(native.querySelector('app-season-podium')).toBeTruthy();
  });

  it('renders real rules and neutral unavailable values when rules are absent', async () => {
    const native = await render({ slug: 's2' });
    expect(native.querySelector('.season-rules-panel')?.textContent).toContain('5');
    expect(native.querySelector('.season-rules-panel')?.textContent).toContain('100');
    expect(native.querySelector('.season-rules-panel')?.textContent).toContain('12');
    const absent = await render({ slug: 's2', rankingResponse: of({ ...ranking, rules: null }) });
    expect(absent.querySelector('.season-rules-panel')?.textContent?.match(/—/g)).toHaveLength(3);
  });

  it('keeps full ranking, matches and maps links', async () => {
    const native = await render({ slug: 's2' });
    expect(native.querySelector('a[href="/seasons/s2/ranking"]')).toBeTruthy();
    expect(native.querySelector('a[href="/seasons/s2/matches"]')).toBeTruthy();
    expect(native.querySelector('a[href="/seasons/s2/maps"]')).toBeTruthy();
  });

  it('shows a controlled state when players are absent', async () => {
    const native = await render({ slug: 's2', rankingResponse: of({ ...ranking, players: [] }) });
    expect(native.textContent).toContain('Ranking ainda sem dados');
    expect(native.querySelector('.ranking-preview')).toBeNull();
  });
});
