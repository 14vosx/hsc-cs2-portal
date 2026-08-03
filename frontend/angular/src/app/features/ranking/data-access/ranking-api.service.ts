import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { Ranking } from '../domain/ranking.model';
import { normalizeRanking } from '../domain/ranking.normalizer';

@Injectable({
  providedIn: 'root',
})
export class RankingApiService {
  private readonly http = inject(HttpClient);

  getRanking(): Observable<Ranking> {
    return this.http
      .get<unknown>(cs2ApiPaths.ranking)
      .pipe(map(normalizeRanking));
  }
}
