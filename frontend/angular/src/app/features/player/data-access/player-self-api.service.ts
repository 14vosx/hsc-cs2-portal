import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type {
  PlayerAccountStatus,
  PlayerAccountSummary,
  PlayerSteamCapabilityReason,
} from '../domain/player-account.model';
import type {
  PlayerMembership,
  PlayerMembershipStatus,
} from '../domain/player-membership.model';
import {
  isPreferredMap,
  isPreferredRole,
  type PlayerProfile,
  type PlayerProfilePatch,
  type PlayerProfileVisibility,
  type PreferredMap,
  type PreferredRole,
} from '../domain/player-profile.model';

export class PlayerSelfContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlayerSelfContractError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class PlayerSelfApiService {
  private readonly http = inject(HttpClient);

  getAccount(): Observable<PlayerAccountSummary> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerAccount, {
        withCredentials: true,
      })
      .pipe(
        map((payload) => {
          const normalized = normalizePlayerAccount(payload);
          if (!normalized) {
            throw new PlayerSelfContractError('Invalid /player/account payload received');
          }
          return normalized;
        }),
      );
  }

  getProfile(): Observable<PlayerProfile> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerProfileMe, {
        withCredentials: true,
      })
      .pipe(
        map((payload) => {
          const normalized = normalizePlayerProfile(payload);
          if (!normalized) {
            throw new PlayerSelfContractError('Invalid /player/profile/me payload received');
          }
          return normalized;
        }),
      );
  }

  updateProfile(patch: PlayerProfilePatch): Observable<PlayerProfile> {
    return this.http
      .patch<unknown>(cs2ApiPaths.playerProfileMe, patch, {
        withCredentials: true,
      })
      .pipe(
        map((payload) => {
          const normalized = normalizePlayerProfile(payload);
          if (!normalized) {
            throw new PlayerSelfContractError('Invalid /player/profile/me PATCH response envelope');
          }
          return normalized;
        }),
      );
  }

  getMembership(): Observable<PlayerMembership | null> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerMembership, {
        withCredentials: true,
      })
      .pipe(
        map((payload) => {
          const normalized = normalizePlayerMembershipEnvelope(payload);
          if (!normalized) {
            throw new PlayerSelfContractError('Invalid /player/membership payload received');
          }
          return normalized.membership;
        }),
      );
  }
}

function normalizePlayerAccount(input: unknown): PlayerAccountSummary | null {
  if (!isRecord(input)) {
    return null;
  }

  const accountInput = ownDataProperty(input, 'account');

  if (!isRecord(accountInput)) {
    return null;
  }

  const status = normalizeAccountStatus(ownDataProperty(accountInput, 'status'));
  const identities = ownDataProperty(accountInput, 'identities');
  const capabilities = ownDataProperty(accountInput, 'capabilities');

  if (!status || !isRecord(identities) || !isRecord(capabilities)) {
    return null;
  }

  const emailIdentity = ownDataProperty(identities, 'email');
  const steamIdentity = ownDataProperty(identities, 'steam');
  const cs2Identity = ownDataProperty(capabilities, 'cs2Identity');
  const personalizedStats = ownDataProperty(capabilities, 'personalizedStats');

  if (
    !isRecord(emailIdentity) ||
    !isRecord(steamIdentity) ||
    !isRecord(cs2Identity) ||
    !isRecord(personalizedStats)
  ) {
    return null;
  }

  const emailLinked = strictBoolean(ownDataProperty(emailIdentity, 'linked'));
  const emailVerified = strictBoolean(ownDataProperty(emailIdentity, 'verified'));
  const steamLinked = strictBoolean(ownDataProperty(steamIdentity, 'linked'));
  const cs2Ready = strictBoolean(ownDataProperty(cs2Identity, 'ready'));
  const personalizedStatsAvailable = strictBoolean(
    ownDataProperty(personalizedStats, 'available'),
  );
  const cs2Reason = normalizeSteamCapabilityReason(ownDataProperty(cs2Identity, 'reason'));
  const statsReason = normalizeSteamCapabilityReason(
    ownDataProperty(personalizedStats, 'reason'),
  );

  if (
    emailLinked === null ||
    emailVerified === null ||
    steamLinked === null ||
    cs2Ready === null ||
    personalizedStatsAvailable === null ||
    cs2Reason === undefined ||
    statsReason === undefined
  ) {
    return null;
  }

  return {
    status,
    identities: {
      email: {
        linked: emailLinked,
        email: emailLinked
          ? optionalTrimmedString(ownDataProperty(emailIdentity, 'email'))
          : null,
        verified: emailVerified,
      },
      steam: {
        linked: steamLinked,
        steamId64: steamLinked
          ? optionalTrimmedString(ownDataProperty(steamIdentity, 'steamid64'))
          : null,
      },
    },
    capabilities: {
      cs2Identity: {
        ready: cs2Ready,
        reason: cs2Reason,
      },
      personalizedStats: {
        available: personalizedStatsAvailable,
        reason: statsReason,
      },
    },
  };
}

function normalizePreferredRole(value: unknown): PreferredRole | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }
  const str = optionalTrimmedString(value);
  if (!str) {
    return null;
  }
  return isPreferredRole(str) ? str : undefined;
}

function normalizePreferredMap(value: unknown): PreferredMap | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }
  const str = optionalTrimmedString(value);
  if (!str) {
    return null;
  }
  return isPreferredMap(str) ? str : undefined;
}

function normalizePlayerProfile(input: unknown): PlayerProfile | null {
  if (!isRecord(input)) {
    return null;
  }

  const profileInput = ownDataProperty(input, 'profile');

  if (!isRecord(profileInput)) {
    return null;
  }

  const displayName = requiredTrimmedString(ownDataProperty(profileInput, 'displayName'));
  const slug = requiredTrimmedString(ownDataProperty(profileInput, 'slug'));
  const visibility = normalizeProfileVisibility(ownDataProperty(profileInput, 'visibility'));
  const preferredRole = normalizePreferredRole(ownDataProperty(profileInput, 'preferredRole'));
  const preferredMap = normalizePreferredMap(ownDataProperty(profileInput, 'preferredMap'));

  if (!displayName || !slug || !visibility || preferredRole === undefined || preferredMap === undefined) {
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
    visibility,
    joinedAt: optionalDateString(ownDataProperty(profileInput, 'joinedAt')),
    createdAt: optionalDateString(ownDataProperty(profileInput, 'createdAt')),
    updatedAt: optionalDateString(ownDataProperty(profileInput, 'updatedAt')),
  };
}

function normalizePlayerMembershipEnvelope(
  input: unknown,
): { membership: PlayerMembership | null } | null {
  if (!isRecord(input)) {
    return null;
  }

  const membershipInput = ownDataProperty(input, 'membership');

  if (membershipInput === null) {
    return { membership: null };
  }

  if (!isRecord(membershipInput)) {
    return null;
  }

  const status = normalizeMembershipStatus(ownDataProperty(membershipInput, 'status'));
  const planCode = requiredTrimmedString(ownDataProperty(membershipInput, 'plan_code'));

  if (!status || !planCode) {
    return null;
  }

  return {
    membership: {
      status,
      planCode,
      startedAt: optionalDateString(ownDataProperty(membershipInput, 'started_at')),
      expiresAt: optionalDateString(ownDataProperty(membershipInput, 'expires_at')),
      suspendedAt: optionalDateString(ownDataProperty(membershipInput, 'suspended_at')),
      cancelledAt: optionalDateString(ownDataProperty(membershipInput, 'cancelled_at')),
    },
  };
}

function normalizeAccountStatus(value: unknown): PlayerAccountStatus | null {
  return value === 'active' || value === 'disabled' ? value : null;
}

function normalizeProfileVisibility(value: unknown): PlayerProfileVisibility | null {
  return value === 'private' || value === 'public' ? value : null;
}

function normalizeMembershipStatus(value: unknown): PlayerMembershipStatus | null {
  return value === 'inactive' ||
    value === 'active' ||
    value === 'suspended' ||
    value === 'expired' ||
    value === 'cancelled'
    ? value
    : null;
}

function normalizeSteamCapabilityReason(
  value: unknown,
): PlayerSteamCapabilityReason | undefined {
  if (value === null) {
    return null;
  }

  if (value === 'steam_link_required') {
    return value;
  }

  return undefined;
}

function strictBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function requiredTrimmedString(value: unknown): string | null {
  return optionalTrimmedString(value);
}

function optionalTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function optionalDateString(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  return optionalTrimmedString(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  try {
    return !Array.isArray(value);
  } catch {
    return false;
  }
}

function ownDataProperty(record: Record<string, unknown>, key: string): unknown {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);

    if (!descriptor || !('value' in descriptor)) {
      return undefined;
    }

    return descriptor.value;
  } catch {
    return undefined;
  }
}
