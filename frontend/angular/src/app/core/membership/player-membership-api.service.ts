import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

import { cs2ApiPaths } from '../config/api-paths';
import type { PlayerMembership, PlayerMembershipStatus } from './player-membership.model';

export class PlayerMembershipContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlayerMembershipContractError';
  }
}

@Injectable({ providedIn: 'root' })
export class PlayerMembershipApiService {
  private readonly http = inject(HttpClient);

  getMembership(): Observable<PlayerMembership | null> {
    return this.http
      .get<unknown>(cs2ApiPaths.playerMembership, { withCredentials: true })
      .pipe(
        map((payload) => {
          const normalized = normalizePlayerMembershipEnvelope(payload);
          if (!normalized) {
            throw new PlayerMembershipContractError(
              'Invalid /player/membership payload received',
            );
          }
          return normalized.membership;
        }),
      );
  }
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

function normalizeMembershipStatus(value: unknown): PlayerMembershipStatus | null {
  return value === 'inactive' ||
    value === 'active' ||
    value === 'suspended' ||
    value === 'expired' ||
    value === 'cancelled'
    ? value
    : null;
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
