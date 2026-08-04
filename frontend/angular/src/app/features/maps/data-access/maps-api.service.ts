import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { MapDetail, MapsIndex } from '../domain/map.model';
import { normalizeMapDetail, normalizeMapsIndex } from '../domain/map.normalizer';

export class MapsContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapsContractError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class MapsApiService {
  private readonly http = inject(HttpClient);

  getMaps(): Observable<MapsIndex> {
    return this.http.get<unknown>(cs2ApiPaths.maps).pipe(
      map((payload) => {
        const normalized = normalizeMapsIndex(payload);
        if (!normalized) {
          throw new MapsContractError('Invalid MapsIndex payload received');
        }
        return normalized;
      })
    );
  }

  getMap(mapName: string): Observable<MapDetail> {
    return this.http.get<unknown>(cs2ApiPaths.map(mapName)).pipe(
      map((payload) => {
        const normalized = normalizeMapDetail(payload);
        if (!normalized) {
          throw new MapsContractError(`Invalid MapDetail payload received for mapName: ${mapName}`);
        }
        return normalized;
      })
    );
  }
}
