import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, startWith, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import { NewsApiService } from '../../news/data-access/news-api.service';
import { resolveSeasonContext, type SeasonContext } from '../../seasons/season-context';
import type {
  HomeNewsState,
  HomeRecentMatchesState,
  HomeSeasonState,
} from '../domain/home-season.model';
import { normalizeHomeRecentMatches } from '../domain/home-recent-matches.normalizer';
import { normalizeHomeSeasonMetrics } from '../domain/home-season.normalizer';

type SeasonContextResult =
  | { readonly status: 'ready'; readonly context: SeasonContext }
  | { readonly status: 'empty' }
  | { readonly status: 'error' };

@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly cs2Api = inject(Cs2ApiService);
  private readonly newsApi = inject(NewsApiService);

  private readonly seasonContext$: Observable<SeasonContextResult> = this.cs2Api.getSeasons().pipe(
    map((index): SeasonContextResult => {
      const context = resolveSeasonContext(index);
      return context ? { status: 'ready', context } : { status: 'empty' };
    }),
    catchError(() => of<SeasonContextResult>({ status: 'error' })),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  getHomeSeasonMetrics(): Observable<HomeSeasonState> {
    return this.seasonContext$.pipe(
      switchMap((result) => {
        if (result.status === 'error') {
          return of<HomeSeasonState>({
            status: 'seasons-error',
            error: 'Não foi possível carregar a lista de temporadas.',
          });
        }
        if (result.status === 'empty') {
          return of<HomeSeasonState>({ status: 'empty' });
        }

        const { context } = result;
        const seasonName = context.season.name?.trim() || context.slug;
        return this.cs2Api.getSeasonRanking(context.slug).pipe(
          map((ranking): HomeSeasonState => ({
            status: 'ready',
            data: normalizeHomeSeasonMetrics(context, ranking),
          })),
          catchError(() => of<HomeSeasonState>({
            status: 'ranking-error',
            error: 'Não foi possível carregar o ranking da temporada.',
            seasonSlug: context.slug,
            seasonName,
            contextMode: context.mode,
          })),
        );
      }),
      startWith<HomeSeasonState>({ status: 'loading' }),
    );
  }

  getRecentMatches(): Observable<HomeRecentMatchesState> {
    return this.seasonContext$.pipe(
      switchMap((result) => {
        if (result.status !== 'ready') {
          return of<HomeRecentMatchesState>(
            result.status === 'empty' ? { status: 'empty' } : { status: 'error' },
          );
        }

        return this.cs2Api.getSeasonMatches(result.context.slug).pipe(
          map((payload): HomeRecentMatchesState => {
            const matches = normalizeHomeRecentMatches(payload);
            return matches.length > 0
              ? { status: 'ready', data: matches }
              : { status: 'empty' };
          }),
          catchError(() => of<HomeRecentMatchesState>({ status: 'error' })),
        );
      }),
      startWith<HomeRecentMatchesState>({ status: 'loading' }),
    );
  }

  getHomeNews(): Observable<HomeNewsState> {
    return this.newsApi.getNewsIndex().pipe(
      map((index): HomeNewsState => {
        const items = index.items.slice(0, 2).map((item) => ({
          slug: item.slug,
          title: item.title,
          excerpt: item.excerpt,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
        }));
        return items.length > 0 ? { status: 'ready', data: items } : { status: 'empty' };
      }),
      catchError(() => of<HomeNewsState>({ status: 'error' })),
      startWith<HomeNewsState>({ status: 'loading' }),
    );
  }
}
