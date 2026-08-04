import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { catchError, map, of, switchMap } from 'rxjs';

import type { SeasonsIndexDto } from '../../../core/api/dto/season.dto';
import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { SeasonMaps } from '../domain/season-maps.model';
import { normalizeSeasonMaps } from '../domain/season-maps.normalizer';
import { resolveSeasonContext } from '../season-context';

export class SeasonMapsContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeasonMapsContractError';
  }
}

export type SeasonMapsLoadResult =
  | { kind: 'available'; maps: SeasonMaps }
  | { kind: 'season-unavailable' };

@Injectable({ providedIn: 'root' })
export class SeasonMapsApiService {
  private readonly http = inject(HttpClient);

  getMaps(slug: string | null): Observable<SeasonMapsLoadResult> {
    const normalizedSlug = normalizeSlug(slug);

    if (normalizedSlug) {
      return this.loadMapsBySlug(normalizedSlug);
    }

    return this.http.get<unknown>(cs2ApiPaths.seasons).pipe(
      switchMap((indexPayload): Observable<SeasonMapsLoadResult> => {
        const context = resolveSeasonContext(indexPayload as SeasonsIndexDto | null);
        if (!context) {
          return of<SeasonMapsLoadResult>({ kind: 'season-unavailable' });
        }

        return this.loadMapsBySlug(context.slug);
      })
    );
  }

  private loadMapsBySlug(slug: string): Observable<SeasonMapsLoadResult> {
    return this.http.get<unknown>(cs2ApiPaths.seasonMaps(slug)).pipe(
      map((payload): SeasonMapsLoadResult => {
        const maps = normalizeSeasonMaps(payload);
        if (!maps) {
          throw new SeasonMapsContractError('Payload de mapas sazonais malformado.');
        }
        return { kind: 'available', maps };
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of<SeasonMapsLoadResult>({ kind: 'season-unavailable' });
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
