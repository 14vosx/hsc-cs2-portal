import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, startWith, switchMap, distinctUntilChanged } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import { NewsIndexDto } from '../../../core/api/dto/news.dto';
import { resolveSeasonContext } from '../../seasons/season-context';
import { HomeEditorialItem, HomeSeasonState } from '../domain/home-season.model';
import { normalizeHomeSeasonMetrics } from '../domain/home-season.normalizer';

@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly cs2Api = inject(Cs2ApiService);

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
    return this.cs2Api.getNewsIndex().pipe(
      map((newsDto: NewsIndexDto): HomeEditorialItem | null => {
        if (!Array.isArray(newsDto?.items) || newsDto.items.length === 0) {
          return null;
        }

        const firstItem = newsDto.items[0];
        if (!firstItem || !firstItem.title || !firstItem.slug) {
          return null;
        }

        return {
          id: firstItem.slug,
          title: firstItem.title,
          summary: firstItem.excerpt || '',
          slug: firstItem.slug,
          date: firstItem.published_at || '',
        };
      }),
      catchError(() => of<HomeEditorialItem | null>(null)),
      startWith<HomeEditorialItem | null>(null),
      distinctUntilChanged(),
    );
  }
}
