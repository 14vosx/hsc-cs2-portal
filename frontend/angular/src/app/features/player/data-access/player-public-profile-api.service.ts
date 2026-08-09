import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { PlayerPublicProfile } from '../domain/player-public-profile.model';
import {
  isPreferredMap,
  isPreferredRole,
  type PreferredMap,
  type PreferredRole,
} from '../domain/player-profile.model';

export class PlayerPublicProfileContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlayerPublicProfileContractError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class PlayerPublicProfileApiService {
  private readonly http = inject(HttpClient);

  getProfile(slug: string): Observable<PlayerPublicProfile> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerPublicProfile(slug), {
        withCredentials: true,
      })
      .pipe(
        map((payload) => {
          const profile = normalizePlayerPublicProfileEnvelope(payload);
          if (!profile) {
            throw new PlayerPublicProfileContractError(
              'Invalid public player profile payload received',
            );
          }
          return profile;
        }),
      );
  }
}

function normalizePlayerPublicProfileEnvelope(input: unknown): PlayerPublicProfile | null {
  if (!isRecord(input) || ownDataProperty(input, 'ok') !== true) {
    return null;
  }

  const profileInput = ownDataProperty(input, 'profile');
  if (!isRecord(profileInput)) {
    return null;
  }

  const displayName = requiredTrimmedString(ownDataProperty(profileInput, 'displayName'));
  const slug = requiredTrimmedString(ownDataProperty(profileInput, 'slug'));
  const joinedAt = requiredDateString(ownDataProperty(profileInput, 'joinedAt'));
  const preferredRole = normalizePreferredRole(ownDataProperty(profileInput, 'preferredRole'));
  const preferredMap = normalizePreferredMap(ownDataProperty(profileInput, 'preferredMap'));

  if (
    !displayName ||
    !slug ||
    !joinedAt ||
    preferredRole === undefined ||
    preferredMap === undefined
  ) {
    return null;
  }

  return {
    displayName,
    slug,
    bio: optionalTrimmedString(ownDataProperty(profileInput, 'bio')),
    avatarUrl: optionalTrimmedString(ownDataProperty(profileInput, 'avatarUrl')),
    bannerUrl: optionalTrimmedString(ownDataProperty(profileInput, 'bannerUrl')),
    discordHandle: optionalTrimmedString(ownDataProperty(profileInput, 'discordHandle')),
    preferredRole,
    preferredMap,
    joinedAt,
  };
}

function normalizePreferredRole(value: unknown): PreferredRole | null | undefined {
  if (value === null) {
    return null;
  }
  return isPreferredRole(value) ? value : undefined;
}

function normalizePreferredMap(value: unknown): PreferredMap | null | undefined {
  if (value === null) {
    return null;
  }
  return isPreferredMap(value) ? value : undefined;
}

function requiredTrimmedString(value: unknown): string | null {
  const normalized = optionalTrimmedString(value);
  return normalized || null;
}

function optionalTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized || null;
}

function requiredDateString(value: unknown): string | null {
  const normalized = requiredTrimmedString(value);
  return normalized && Number.isFinite(Date.parse(normalized)) ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ownDataProperty(record: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && 'value' in descriptor ? descriptor.value : undefined;
}
