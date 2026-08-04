import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { catchError, map, of, switchMap } from 'rxjs';

import { SeasonsIndexDto } from '../../../core/api/dto/season.dto';
import { cs2ApiPaths } from '../../../core/config/api-paths';
import { resolveSeasonContext } from '../season-context';
import { SeasonRanking } from '../domain/season-ranking.model';
import { normalizeSeasonRanking } from '../domain/season-ranking.normalizer';

export type SeasonRankingLoadResult =
  | { kind: 'available'; ranking: SeasonRanking }
  | { kind: 'season-unavailable' };

@Injectable({ providedIn: 'root' })
export class SeasonRankingApiService {
  private readonly http = inject(HttpClient);

  getRanking(slug: string | null): Observable<SeasonRankingLoadResult> {
    const normalizedSlug = normalizeSlug(slug);

    if (normalizedSlug) {
      return this.loadRankingBySlug(normalizedSlug);
    }

    return this.http.get<unknown>(cs2ApiPaths.seasons).pipe(
      switchMap((indexPayload): Observable<SeasonRankingLoadResult> => {
        const context = resolveSeasonContext(indexPayload as SeasonsIndexDto | null);
        if (!context) {
          return of<SeasonRankingLoadResult>({ kind: 'season-unavailable' });
        }

        return this.loadRankingBySlug(context.slug);
      }),
    );
  }

  private loadRankingBySlug(slug: string): Observable<SeasonRankingLoadResult> {
    return this.http.get<unknown>(cs2ApiPaths.seasonRanking(slug)).pipe(
      map((payload): SeasonRankingLoadResult => {
        const ranking = normalizeSeasonRanking(payload);
        return ranking ? { kind: 'available', ranking } : { kind: 'season-unavailable' };
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of<SeasonRankingLoadResult>({ kind: 'season-unavailable' });
        }

        throw error;
      }),
    );
  }
}

function normalizeSlug(slug: string | null | undefined): string | null {
  if (typeof slug !== 'string') {
    return null;
  }

  const trimmed = slug.trim();
  return trimmed.length > 0 ? trimmed : null;
}
