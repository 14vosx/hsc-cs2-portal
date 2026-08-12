import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import type { SeasonsIndexDto } from '../../core/api/dto/season.dto';
import { SeasonsPage } from './seasons-page';

describe('SeasonsPage', () => {
  let fixture: ComponentFixture<SeasonsPage>;
  const api = { getSeasons: vi.fn() };

  const payload: SeasonsIndexDto = {
    activeSeasonSlug: 'season-two',
    seasons: [
      { slug: 'season-one', name: 'Season One', status: 'published', start_at: '2025-01-01T00:00:00Z', end_at: '2025-06-30T00:00:00Z', summary: { matches: 0, maps: 12, rounds: 300, players: 24 } },
      { slug: 'season-two', name: 'Season Two', description: 'Circuito atual.', status: 'custom-status', cover_image_url: '/covers/s2.webp', start_at: '2026-01-01T00:00:00Z', end_at: '2026-06-30T00:00:00Z', summary: { matches: 8, maps: 20, rounds: 480, players: 32, lastMapEndedAt: '2026-04-10T00:00:00Z' } },
      { slug: 'season-three', name: 'Season Three', hero_image_url: '/covers/s3.webp' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.getSeasons.mockReturnValue(of(payload));
  });

  async function render(response: Observable<SeasonsIndexDto> = of(payload)): Promise<HTMLElement> {
    api.getSeasons.mockReturnValue(response);
    await TestBed.configureTestingModule({
      imports: [SeasonsPage],
      providers: [provideRouter([]), { provide: Cs2ApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(SeasonsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows loading while the index request is pending', async () => {
    const pending = new Subject<SeasonsIndexDto>();
    const native = await render(pending);
    expect(native.textContent).toContain('Carregando temporadas...');
  });

  it('shows the existing error state when the request fails', async () => {
    const native = await render(throwError(() => new Error('network')));
    expect(native.textContent).toContain('Temporadas indisponíveis');
  });

  it('shows the existing empty state', async () => {
    const native = await render(of({ seasons: [] }));
    expect(native.textContent).toContain('Nenhuma temporada disponível');
  });

  it('promotes the active season by activeSeasonSlug exactly once and preserves historical order', async () => {
    const native = await render();
    expect(native.querySelector('.active-season h2')?.textContent).toContain('Season Two');
    expect(native.querySelectorAll('.active-season')).toHaveLength(1);
    const history = Array.from(native.querySelectorAll('.season-card h3')).map((item) => item.textContent?.trim());
    expect(history).toEqual(['Season One', 'Season Three']);
    expect(native.querySelector('.seasons-archive')?.textContent).not.toContain('Season Two');
  });

  it('uses current routes for active CTAs and slug routes for historical CTAs', async () => {
    const native = await render();
    expect(native.querySelector('.active-season a[href="/seasons/current"]')).toBeTruthy();
    expect(native.querySelector('.active-season a[href="/seasons/current/ranking"]')).toBeTruthy();
    expect(native.querySelector('.season-card a[href="/seasons/season-one"]')).toBeTruthy();
    expect(native.querySelector('.season-card a[href="/seasons/season-one/ranking"]')).toBeTruthy();
  });

  it('renders published covers and keeps a CSS fallback when a cover is absent', async () => {
    const native = await render();
    expect(native.querySelector<HTMLElement>('.active-season')?.style.getPropertyValue('--season-cover')).toContain('/covers/s2.webp');
    const cards = native.querySelectorAll<HTMLElement>('.season-card');
    expect(cards[0]?.style.getPropertyValue('--season-cover')).toBe('none');
    expect(cards[1]?.style.getPropertyValue('--season-cover')).toContain('/covers/s3.webp');
  });

  it('keeps real zero and presents absent summary values as unavailable', async () => {
    const native = await render();
    const firstHistoryMetrics = native.querySelector('.season-card .season-card__metrics')?.textContent ?? '';
    const secondHistoryMetrics = native.querySelectorAll('.season-card .season-card__metrics')[1]?.textContent ?? '';
    expect(firstHistoryMetrics).toContain('0');
    expect(secondHistoryMetrics.match(/—/g)).toHaveLength(4);
  });

  it('shows period, neutral description fallback and last map as last activity', async () => {
    const native = await render();
    expect(native.querySelector('.active-season')?.textContent).toContain('01/01/2026');
    expect(native.querySelector('.active-season')?.textContent).toContain('Última atividade');
    expect(native.querySelectorAll('.season-card')[1]?.textContent).toContain('Temporada competitiva HSC.');
  });

  it('does not promote a season from remote status when activeSeasonSlug is absent', async () => {
    const native = await render(of({ seasons: payload.seasons }));
    expect(native.querySelector('.active-season')).toBeNull();
    expect(native.querySelectorAll('.season-card h3')).toHaveLength(3);
  });

  it('does not promote an artificial active season when the active slug mismatches', async () => {
    const native = await render(of({ activeSeasonSlug: 'missing', seasons: payload.seasons }));
    expect(native.querySelector('.active-season')).toBeNull();
    expect(Array.from(native.querySelectorAll('.season-card h3')).map((item) => item.textContent?.trim())).toEqual(['Season One', 'Season Two', 'Season Three']);
  });
});
