import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, startWith, switchMap, distinctUntilChanged } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import { NewsApiService } from '../../news/data-access/news-api.service';
import type { NewsIndex } from '../../news/domain/news.model';
import { resolveSeasonContext } from '../../seasons/season-context';
import { HomeEditorialItem, HomeSeasonState } from '../domain/home-season.model';
import { normalizeHomeSeasonMetrics } from '../domain/home-season.normalizer';

@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly cs2Api = inject(Cs2ApiService);
  private readonly newsApi = inject(NewsApiService);

  getHomeSeasonMetrics(): Observable<HomeSeasonState> {
    return this.cs2Api.getSeasons().pipe(
      switchMap((seasonsIndex) => {
        const context = resolveSeasonContext(seasonsIndex);
        if (!context) {
          return of<HomeSeasonState>({ status: 'empty' });
        }

        const seasonSlug = context.slug;
        const seasonName =
          context.season?.name && context.season.name.trim().length > 0
            ? context.season.name.trim()
            : context.slug;
        const contextMode = context.mode;

        return this.cs2Api.getSeasonRanking(seasonSlug).pipe(
          map((rankingDto): HomeSeasonState => {
            const data = normalizeHomeSeasonMetrics(context, rankingDto);
            return { status: 'ready', data };
          }),
          catchError(() =>
            of<HomeSeasonState>({
              status: 'ranking-error',
              error: 'Não foi possível carregar o ranking da temporada.',
              seasonSlug,
              seasonName,
              contextMode,
            }),
          ),
        );
      }),
      catchError(() =>
        of<HomeSeasonState>({
          status: 'seasons-error',
          error: 'Não foi possível carregar a lista de temporadas.',
        }),
      ),
      startWith<HomeSeasonState>({ status: 'loading' }),
    );
  }

  getEditorialHighlight(): Observable<HomeEditorialItem | null> {
    return this.newsApi.getNewsIndex().pipe(
      map((newsIndex: NewsIndex): HomeEditorialItem | null => {
        if (!newsIndex.items || newsIndex.items.length === 0) {
          return null;
        }

        const firstItem = newsIndex.items[0];

        return {
          id: firstItem.slug,
          title: firstItem.title,
          summary: firstItem.excerpt ?? '',
          slug: firstItem.slug,
          date: firstItem.publishedAt ?? '',
        };
      }),
      catchError(() => of<HomeEditorialItem | null>(null)),
      startWith<HomeEditorialItem | null>(null),
      distinctUntilChanged(),
    );
  }
}
