import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import {
  isPlayerServerAccessReason,
  type PlayerServerAccess,
} from '../domain/player-server-access.model';

export class PlayerServerAccessContractError extends Error {
  constructor() {
    super('Invalid /player/server-access response envelope');
    this.name = 'PlayerServerAccessContractError';
  }
}

@Injectable({ providedIn: 'root' })
export class PlayerServerAccessApiService {
  private readonly http = inject(HttpClient);

  getServerAccess(): Observable<PlayerServerAccess> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerServerAccess, { withCredentials: true })
      .pipe(
        map((payload) => {
          const access = normalizePlayerServerAccess(payload);
          if (!access) throw new PlayerServerAccessContractError();
          return access;
        }),
      );
  }
}

export function normalizePlayerServerAccess(payload: unknown): PlayerServerAccess | null {
  if (!isRecord(payload)) return null;
  const ok = payload['ok'];
  const authorized = payload['authorized'];
  const reason = payload['reason'];

  if (ok !== true || typeof authorized !== 'boolean' || !isPlayerServerAccessReason(reason)) {
    return null;
  }
  if (authorized !== (reason === 'membership_active')) return null;

  return payload as unknown as PlayerServerAccess;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
