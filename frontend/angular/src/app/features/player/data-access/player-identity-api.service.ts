import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { PlayerIdentity } from '../domain/player-identity.model';
import { normalizePlayerIdentity } from './player-identity.normalizer';

@Injectable({
  providedIn: 'root',
})
export class PlayerIdentityApiService {
  private readonly http = inject(HttpClient);

  getCurrentIdentity(): Observable<PlayerIdentity | null> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerMe, {
        withCredentials: true,
      })
      .pipe(map(normalizePlayerIdentity));
  }
}
