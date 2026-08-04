import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { catchError, map, of, switchMap } from 'rxjs';

import type { SeasonsIndexDto } from '../../../core/api/dto/season.dto';
import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { SeasonMatches } from '../domain/season-matches.model';
import { normalizeSeasonMatches } from '../domain/season-matches.normalizer';
import { resolveSeasonContext } from '../season-context';

export class SeasonMatchesContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeasonMatchesContractError';
  }
}

export type SeasonMatchesLoadResult =
  | { kind: 'available'; matches: SeasonMatches }
  | { kind: 'season-unavailable' };

@Injectable({ providedIn: 'root' })
export class SeasonMatchesApiService {
  private readonly http = inject(HttpClient);

  getMatches(slug: string | null): Observable<SeasonMatchesLoadResult> {
    const normalizedSlug = normalizeSlug(slug);

    if (normalizedSlug) {
      return this.loadMatchesBySlug(normalizedSlug);
    }

    return this.http.get<unknown>(cs2ApiPaths.seasons).pipe(
      switchMap((indexPayload): Observable<SeasonMatchesLoadResult> => {
        const context = resolveSeasonContext(indexPayload as SeasonsIndexDto | null);
        if (!context) {
          return of<SeasonMatchesLoadResult>({ kind: 'season-unavailable' });
        }

        return this.loadMatchesBySlug(context.slug);
      })
    );
  }

  private loadMatchesBySlug(slug: string): Observable<SeasonMatchesLoadResult> {
    return this.http.get<unknown>(cs2ApiPaths.seasonMatches(slug)).pipe(
      map((payload): SeasonMatchesLoadResult => {
        const matches = normalizeSeasonMatches(payload);
        if (!matches) {
          throw new SeasonMatchesContractError('Payload de partidas sazonais malformado.');
        }
        return { kind: 'available', matches };
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of<SeasonMatchesLoadResult>({ kind: 'season-unavailable' });
        }
        throw error;
      })
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
