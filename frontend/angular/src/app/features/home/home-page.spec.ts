import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { HomeApiService } from './data-access/home-api.service';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let homeApiMock: {
    getHomeSeasonMetrics: ReturnType<typeof vi.fn>;
    getEditorialHighlight: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    homeApiMock = {
      getHomeSeasonMetrics: vi.fn(),
      getEditorialHighlight: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: HomeApiService, useValue: homeApiMock },
      ],
    }).compileComponents();
  });

  it('should render page identity header and shortcuts grid immediately on initial emission', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(of({ status: 'loading' }));
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const title = native.querySelector('.page-header__title');
    expect(title).toBeTruthy();
    expect(title.textContent.trim()).toBe('HSC CS2 Portal');

    const shortcuts = native.querySelectorAll('.home-page__card-link');
    expect(shortcuts.length).toBe(6);
  });

  it('should wrap shortcut cards in semantic <a> elements without nested <a> tags', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(of({ status: 'loading' }));
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const cardLinks = native.querySelectorAll('.home-page__card-link');
    expect(cardLinks.length).toBe(6);

    for (const link of cardLinks) {
      expect(link.tagName.toLowerCase()).toBe('a');
      expect(link.getAttribute('href')).toBeTruthy();
      expect(link.querySelector('app-ui-card')).toBeTruthy();
      expect(link.querySelectorAll('a').length).toBe(0);
    }
  });

  it('should render active season and current leader when status is ready', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(
      of({
        status: 'ready',
        data: {
          seasonSlug: 'season-alpha',
          seasonName: 'Temporada Alpha',
          contextMode: 'active',
          generatedAt: '2026-08-04T12:00:00Z',
          playersCount: 50,
          matchesCount: 120,
          mapsCount: 180,
          roundsCount: 1500,
          hasClassifiedPlayers: true,
          leader: {
            position: 1,
            steamId64: '76561198012345678',
            name: 'ProPlayer',
            score: 2500,
            wins: 15,
            losses: 3,
            kdRatio: 1.8,
          },
        },
      }),
    );
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    expect(native.querySelector('.home-page__season-title').textContent.trim()).toBe('Temporada Alpha');
    expect(native.querySelector('.home-page__leader-name').textContent.trim()).toBe('ProPlayer');
    expect(native.querySelector('.home-page__leader-tag').textContent.trim()).toBe('Líder Atual');
  });

  it('should render seasons-error when list of seasons fails', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(
      of({
        status: 'seasons-error',
        error: 'Não foi possível carregar a lista de temporadas.',
      }),
    );
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const errorState = native.querySelector('.page-state--error');
    expect(errorState).toBeTruthy();
    expect(native.textContent).toContain('Indisponibilidade Sazonal');
  });

  it('should preserve season context and render season action in ranking-error state', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(
      of({
        status: 'ranking-error',
        error: 'Não foi possível carregar o ranking da temporada.',
        seasonSlug: 'season-1',
        seasonName: 'Season 1',
        contextMode: 'active',
      }),
    );
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    expect(native.querySelector('.home-page__season-title').textContent.trim()).toBe('Season 1');
    expect(native.querySelector('.home-page__season-slug').textContent.trim()).toBe('#season-1');
    expect(native.querySelector('app-status-badge')).toBeTruthy();

    const actionLink = native.querySelector('.home-page__season-actions a');
    expect(actionLink).toBeTruthy();
    expect(actionLink.getAttribute('href')).toBe('/seasons/current');
  });

  it('should render editorial highlight when news is present without blocking rest of page', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(of({ status: 'empty' }));
    homeApiMock.getEditorialHighlight.mockReturnValue(
      of({
        id: 'news-1',
        title: 'Atualização do Regulamento',
        summary: 'Confira as regras da nova temporada.',
        slug: 'atualizacao-regulamento',
        date: '2026-08-04',
      }),
    );

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const editorialTitle = native.querySelector('.home-page__editorial-title');
    expect(editorialTitle.textContent.trim()).toBe('Atualização do Regulamento');
  });

  it('should not call HomeApiService methods repeatedly on subscription', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(of({ status: 'empty' }));
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    expect(homeApiMock.getHomeSeasonMetrics).toHaveBeenCalledTimes(1);
    expect(homeApiMock.getEditorialHighlight).toHaveBeenCalledTimes(1);
  });

  it('botão Ver Ranking aponta para /ranking', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(of({ status: 'loading' }));
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('.home-page__btn--primary');
    expect(link.getAttribute('href')).toBe('/ranking');
  });

  it('botão Ver Temporadas aponta para /seasons', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(of({ status: 'loading' }));
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('.home-page__btn--secondary');
    expect(link.getAttribute('href')).toBe('/seasons');
  });

  it('shortcut Ranking Geral aponta para /ranking', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(of({ status: 'loading' }));
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.home-page__card-link')) as HTMLAnchorElement[];
    const rankingCard = links.find((a) => a.textContent?.includes('Ranking Geral'));
    expect(rankingCard?.getAttribute('href')).toBe('/ranking');
  });

  it('shortcut Temporadas aponta para /seasons', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(of({ status: 'loading' }));
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.home-page__card-link')) as HTMLAnchorElement[];
    const seasonsCard = links.find((a) => a.textContent?.includes('Temporadas'));
    expect(seasonsCard?.getAttribute('href')).toBe('/seasons');
  });

  it('Season ativa produz links /seasons/current e /seasons/current/ranking', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(
      of({
        status: 'ready',
        data: {
          seasonSlug: 'season-alpha',
          seasonName: 'Temporada Alpha',
          contextMode: 'active',
          generatedAt: null,
          playersCount: 10,
          matchesCount: 5,
          mapsCount: 8,
          roundsCount: 100,
          hasClassifiedPlayers: true,
          leader: null,
        },
      }),
    );
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.home-page__season-actions a');
    const hrefs = Array.from(actions).map((a: unknown) => (a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toContain('/seasons/current');
    expect(hrefs).toContain('/seasons/current/ranking');
  });

  it('última Season encerrada produz links /seasons/{slug} e /seasons/{slug}/ranking', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(
      of({
        status: 'ready',
        data: {
          seasonSlug: 'season-alpha',
          seasonName: 'Temporada Alpha',
          contextMode: 'latest-closed',
          generatedAt: null,
          playersCount: 10,
          matchesCount: 5,
          mapsCount: 8,
          roundsCount: 100,
          hasClassifiedPlayers: true,
          leader: null,
        },
      }),
    );
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.home-page__season-actions a');
    const hrefs = Array.from(actions).map((a: unknown) => (a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toContain('/seasons/season-alpha');
    expect(hrefs).toContain('/seasons/season-alpha/ranking');
  });

  it('Season ativa sem líder ainda mostra os dois CTAs contextuais', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(
      of({
        status: 'ready',
        data: {
          seasonSlug: 'season-alpha',
          seasonName: 'Temporada Alpha',
          contextMode: 'active',
          generatedAt: null,
          playersCount: 0,
          matchesCount: 0,
          mapsCount: 0,
          roundsCount: 0,
          hasClassifiedPlayers: false,
          leader: null,
        },
      }),
    );
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.home-page__season-actions a');
    expect(actions.length).toBe(2);
  });

  it('ranking-error mostra link para Season, link para /seasons e nenhum link de ranking sazonal', () => {
    homeApiMock.getHomeSeasonMetrics.mockReturnValue(
      of({
        status: 'ranking-error',
        error: 'Falha no ranking.',
        seasonSlug: 'season-1',
        seasonName: 'Season 1',
        contextMode: 'active',
      }),
    );
    homeApiMock.getEditorialHighlight.mockReturnValue(of(null));

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.home-page__season-actions a');
    const hrefs = Array.from(actions).map((a: unknown) => (a as HTMLAnchorElement).getAttribute('href'));

    expect(hrefs).toContain('/seasons/current');
    expect(hrefs).toContain('/seasons');
    expect(hrefs.some((h) => h?.includes('/ranking'))).toBe(false);
  });
});
