import { PlayerIdentity } from '../domain/player-identity.model';

export function normalizePlayerIdentity(input: unknown): PlayerIdentity | null {
  if (!isRecord(input) || ownDataProperty(input, 'authenticated') === false) {
    return null;
  }

  const identityInput =
    ownDataProperty(input, 'player') ?? ownDataProperty(input, 'user') ?? input;

  if (!isRecord(identityInput)) {
    return null;
  }

  const playerAccountId = optionalTrimmedString(
    ownDataProperty(identityInput, 'playerAccountId'),
  );

  const steamId64 =
    optionalTrimmedString(ownDataProperty(identityInput, 'steamid64')) ??
    optionalTrimmedString(ownDataProperty(identityInput, 'steamId64'));

  if (!playerAccountId && !steamId64) {
    return null;
  }

  return {
    displayName: optionalTrimmedString(ownDataProperty(identityInput, 'displayName')),
    steamId64,
    avatarMedium: optionalTrimmedString(ownDataProperty(identityInput, 'avatarMedium')),
    steamProfileUrl: optionalTrimmedString(ownDataProperty(identityInput, 'steamProfileUrl')),
  };
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

function optionalTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}
