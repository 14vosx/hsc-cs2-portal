import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { SeasonTabs, seasonTabLink } from './season-tabs';
import { installSeasonsTranslations } from '../../../testing/seasons-i18n.fixture';

const localeLabels = { 'pt-BR': ['Visão geral', 'Ranking', 'Partidas', 'Mapas'], 'en-US': ['Overview', 'Ranking', 'Matches', 'Maps'] };

describe('seasonTabLink', () => {
  it('keeps four localized labels for the unchanged route IDs', () => {
    expect(localeLabels['pt-BR']).toHaveLength(4);
    expect(localeLabels['en-US']).toHaveLength(4);
  });

  it('switches rendered navigation labels without changing destinations', async () => {
    TestBed.configureTestingModule({ imports: [SeasonTabs], providers: [provideRouter([]), provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    await installSeasonsTranslations(translate);
    const fixture = TestBed.createComponent(SeasonTabs);
    fixture.componentRef.setInput('seasonSlug', 'season-02'); fixture.componentRef.setInput('activeTab', 'overview');
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe('Navegação da temporada');
    expect(nav.textContent).toContain('Visão geral'); expect(nav.textContent).toContain('Ranking'); expect(nav.textContent).toContain('Partidas'); expect(nav.textContent).toContain('Mapas');
    const hrefs = Array.from(nav.querySelectorAll('a')).map((link) => link.getAttribute('href'));
    await translate.use('en-US').toPromise(); fixture.detectChanges();
    expect(nav.getAttribute('aria-label')).toBe('Season navigation');
    expect(nav.textContent).toContain('Overview'); expect(nav.textContent).toContain('Ranking'); expect(nav.textContent).toContain('Matches'); expect(nav.textContent).toContain('Maps');
    expect(Array.from(nav.querySelectorAll('a')).map((link) => link.getAttribute('href'))).toEqual(hrefs);
    expect(hrefs).toEqual(['/seasons/season-02', '/seasons/season-02/ranking', '/seasons/season-02/matches', '/seasons/season-02/maps']);
  });
  it('builds the canonical overview route', () => {
    expect(seasonTabLink('season-02', 'overview')).toBe(
      '/seasons/season-02',
    );
  });

  it('builds canonical child routes', () => {
    expect(seasonTabLink('season-02', 'ranking')).toBe(
      '/seasons/season-02/ranking',
    );
    expect(seasonTabLink('season-02', 'matches')).toBe(
      '/seasons/season-02/matches',
    );
    expect(seasonTabLink('season-02', 'maps')).toBe(
      '/seasons/season-02/maps',
    );
  });

  it('normalizes whitespace in the slug', () => {
    expect(seasonTabLink('  season-02  ', 'ranking')).toBe(
      '/seasons/season-02/ranking',
    );
  });

  it('falls back safely to the seasons index without a slug', () => {
    expect(seasonTabLink(undefined, 'ranking')).toBe('/seasons');
  });
});
