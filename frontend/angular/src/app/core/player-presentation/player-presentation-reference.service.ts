import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { finalize, forkJoin, map, of, shareReplay } from 'rxjs';

import { cs2ApiPaths } from '../config/api-paths';
import type {
  PlayerPresentationReference,
  PlayerPresentationReferences,
} from './player-presentation-reference.model';
import {
  isSteamId64,
  normalizePlayerPresentationReferences,
  PlayerPresentationReferenceContractError,
} from './player-presentation-reference.normalizer';

const MAX_BATCH_SIZE = 100;
export const PLAYER_PRESENTATION_CACHE_TTL_MS = 30_000;

interface CacheEntry {
  readonly reference: PlayerPresentationReference | null;
  readonly expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class PlayerPresentationReferenceService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Observable<PlayerPresentationReferences>>();

  resolve(steamIds: Iterable<string>): Observable<PlayerPresentationReferences> {
    const uniqueIds = [...new Set(steamIds)].filter(isSteamId64);
    if (uniqueIds.length === 0) return of(new Map());

    const now = Date.now();
    const resolved = new Map<string, PlayerPresentationReference>();
    const pending: string[] = [];

    for (const steamId64 of uniqueIds) {
      const cached = this.cache.get(steamId64);
      if (cached && cached.expiresAt > now) {
        if (cached.reference) resolved.set(steamId64, cached.reference);
      } else {
        if (cached) this.cache.delete(steamId64);
        pending.push(steamId64);
      }
    }

    if (pending.length === 0) return of(resolved);

    const requests: Observable<PlayerPresentationReferences>[] = [];
    for (let index = 0; index < pending.length; index += MAX_BATCH_SIZE) {
      requests.push(this.resolveBatch(pending.slice(index, index + MAX_BATCH_SIZE)));
    }

    return forkJoin(requests).pipe(
      map((batches) => {
        for (const batch of batches) {
          for (const [steamId64, reference] of batch) resolved.set(steamId64, reference);
        }
        return resolved;
      }),
    );
  }

  private resolveBatch(steamIds: readonly string[]): Observable<PlayerPresentationReferences> {
    const key = steamIds.join(',');
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const request = this.http
      .post<unknown>(
        cs2ApiPaths.playerPresentationReferences,
        { steamIds },
        { withCredentials: true },
      )
      .pipe(
        map(normalizePlayerPresentationReferences),
        map((references) => {
          const requested = new Set(steamIds);
          if ([...references.keys()].some((steamId64) => !requested.has(steamId64))) {
            throw new PlayerPresentationReferenceContractError();
          }

          const expiresAt = Date.now() + PLAYER_PRESENTATION_CACHE_TTL_MS;
          for (const steamId64 of steamIds) {
            this.cache.set(steamId64, {
              reference: references.get(steamId64) ?? null,
              expiresAt,
            });
          }
          return references;
        }),
        finalize(() => this.inFlight.delete(key)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

    this.inFlight.set(key, request);
    return request;
  }
}
