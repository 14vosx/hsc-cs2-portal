import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';

import { cs2ApiPaths } from '../config/api-paths';
import type { PlayerSession } from './player-session.model';

@Injectable({ providedIn: 'root' })
export class PlayerSessionService {
  private readonly http = inject(HttpClient);
  readonly state = signal<PlayerSession>({ status: 'loading' });
  load(): void {
    this.state.set({ status: 'loading' });
    this.http.get<unknown>(cs2ApiPaths.playerMe, { withCredentials: true }).pipe(
      map(normalizeSession),
      catchError((error: unknown) => of(sessionFromError(error))),
    ).subscribe((session) => this.state.set(session));
  }

  logout(): void {
    this.http.post<unknown>(cs2ApiPaths.playerAuthLogout, {}, { withCredentials: true }).pipe(
      tap(() => this.state.set({ status: 'anonymous' })),
      catchError(() => of(null)),
    ).subscribe();
  }
}

function normalizeSession(payload: unknown): PlayerSession {
  if (!isRecord(payload) || payload['authenticated'] === false) return { status: 'anonymous' };
  const identity = isRecord(payload['player']) ? payload['player'] : isRecord(payload['user']) ? payload['user'] : payload;
  const accountId = text(identity['playerAccountId']);
  const steamId64 = text(identity['steamid64']) ?? text(identity['steamId64']);
  if (!accountId && !steamId64) return { status: 'anonymous' };
  return {
    status: 'authenticated',
    displayName: text(identity['displayName']) ?? 'Jogador HSC',
    steamId64,
    avatarMedium: text(identity['avatarMedium']),
  };
}

function sessionFromError(error: unknown): PlayerSession {
  return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)
    ? { status: 'anonymous' }
    : { status: 'unavailable' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
