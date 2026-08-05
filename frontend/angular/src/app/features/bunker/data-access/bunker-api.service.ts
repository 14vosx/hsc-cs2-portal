import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { BunkerSummary } from '../domain/bunker.model';
import { normalizeBunkerSummary } from './bunker-summary.normalizer';

export class BunkerContractError extends Error {
  constructor(message = 'Invalid Player Bunker summary contract.') {
    super(message);
    this.name = 'BunkerContractError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class BunkerApiService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<BunkerSummary> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerBunkerSummary, {
        withCredentials: true,
      })
      .pipe(
        map((payload) => {
          const summary = normalizeBunkerSummary(payload);

          if (!summary) {
            throw new BunkerContractError();
          }

          return summary;
        }),
      );
  }
}
