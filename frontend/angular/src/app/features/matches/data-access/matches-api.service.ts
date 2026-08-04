import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { MatchDetail, MatchesIndex } from '../domain/match.model';
import { normalizeMatchDetail, normalizeMatchesIndex } from '../domain/match.normalizer';

export class MatchesContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatchesContractError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class MatchesApiService {
  private readonly http = inject(HttpClient);

  getMatches(): Observable<MatchesIndex> {
    return this.http.get<unknown>(cs2ApiPaths.matches).pipe(
      map((payload) => {
        const normalized = normalizeMatchesIndex(payload);
        if (!normalized) {
          throw new MatchesContractError('Invalid MatchesIndex payload received');
        }
        return normalized;
      })
    );
  }

  getMatch(matchId: number | string): Observable<MatchDetail> {
    return this.http.get<unknown>(cs2ApiPaths.match(matchId)).pipe(
      map((payload) => {
        const normalized = normalizeMatchDetail(payload);
        if (!normalized) {
          throw new MatchesContractError(`Invalid MatchDetail payload received for matchId: ${matchId}`);
        }
        return normalized;
      })
    );
  }
}
