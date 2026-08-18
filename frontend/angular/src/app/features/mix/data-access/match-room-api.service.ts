import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { MatchRoomSnapshot } from '../domain/match-room.model';
import {
  normalizeMatchRoomListEnvelope,
  normalizeMatchRoomSingleEnvelope,
} from '../domain/match-room.normalizer';

const KNOWN_ERROR_CODES: ReadonlySet<string> = new Set([
  'already_in_active_room',
  'already_in_room',
  'room_not_found',
  'room_not_joinable',
  'room_full',
  'not_room_participant',
  'creator_must_cancel_room',
  'not_room_creator',
  'room_not_cancellable',
  'room_not_confirmable',
  'confirmation_window_closed',
  'steam_identity_not_linked',
  'player_account_disabled',
  'membership_required',
  'membership_inactive',
  'membership_suspended',
  'membership_expired',
  'membership_cancelled',
  'match_room_operation_failed',
]);

export function extractMatchRoomErrorCode(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.error && typeof error.error === 'object') {
      const errObj = error.error as Record<string, unknown>;
      if (typeof errObj['error'] === 'string' && errObj['error'].trim()) {
        return errObj['error'].trim();
      }
      if (typeof errObj['code'] === 'string' && errObj['code'].trim()) {
        return errObj['code'].trim();
      }
    }
    if (error.status === 404) {
      return 'room_not_found';
    }
  }
  return 'generic';
}

export function mapMatchRoomErrorToI18nKey(error: unknown): string {
  const code = extractMatchRoomErrorCode(error);
  if (KNOWN_ERROR_CODES.has(code)) {
    return `mix.errors.${code}`;
  }
  return 'mix.errors.generic';
}

@Injectable({
  providedIn: 'root',
})
export class MatchRoomApiService {
  private readonly http = inject(HttpClient);

  listMatchRooms(): Observable<readonly MatchRoomSnapshot[]> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerMatchRooms, {
        withCredentials: true,
      })
      .pipe(map(normalizeMatchRoomListEnvelope));
  }

  getMatchRoom(roomId: string): Observable<MatchRoomSnapshot> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerMatchRoom(roomId), {
        withCredentials: true,
      })
      .pipe(map(normalizeMatchRoomSingleEnvelope));
  }

  createMatchRoom(): Observable<MatchRoomSnapshot> {
    return this.http
      .post<unknown>(cs2ApiPaths.playerMatchRooms, {}, {
        withCredentials: true,
      })
      .pipe(map(normalizeMatchRoomSingleEnvelope));
  }

  joinMatchRoom(roomId: string): Observable<MatchRoomSnapshot> {
    return this.http
      .post<unknown>(cs2ApiPaths.playerMatchRoomJoin(roomId), {}, {
        withCredentials: true,
      })
      .pipe(map(normalizeMatchRoomSingleEnvelope));
  }

  leaveMatchRoom(roomId: string): Observable<MatchRoomSnapshot> {
    return this.http
      .post<unknown>(cs2ApiPaths.playerMatchRoomLeave(roomId), {}, {
        withCredentials: true,
      })
      .pipe(map(normalizeMatchRoomSingleEnvelope));
  }

  cancelMatchRoom(roomId: string): Observable<MatchRoomSnapshot> {
    return this.http
      .post<unknown>(cs2ApiPaths.playerMatchRoomCancel(roomId), {}, {
        withCredentials: true,
      })
      .pipe(map(normalizeMatchRoomSingleEnvelope));
  }

  confirmMatchRoom(roomId: string): Observable<MatchRoomSnapshot> {
    return this.http
      .post<unknown>(cs2ApiPaths.playerMatchRoomConfirm(roomId), {}, {
        withCredentials: true,
      })
      .pipe(map(normalizeMatchRoomSingleEnvelope));
  }
}
