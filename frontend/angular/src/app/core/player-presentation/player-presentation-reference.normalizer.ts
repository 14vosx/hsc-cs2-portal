import type {
  PlayerPresentationReference,
  PlayerPresentationReferences,
} from './player-presentation-reference.model';

export class PlayerPresentationReferenceContractError extends Error {
  constructor() {
    super('Invalid player presentation references response envelope');
    this.name = 'PlayerPresentationReferenceContractError';
  }
}

export function isSteamId64(value: unknown): value is string {
  return typeof value === 'string' && /^\d{17}$/.test(value);
}

export function normalizePlayerPresentationReferences(
  payload: unknown,
): PlayerPresentationReferences {
  if (!isRecord(payload) || ownDataProperty(payload, 'ok') !== true) {
    throw new PlayerPresentationReferenceContractError();
  }

  const input = ownDataProperty(payload, 'references');
  if (!isRecord(input)) {
    throw new PlayerPresentationReferenceContractError();
  }

  const references = new Map<string, PlayerPresentationReference>();

  for (const steamId64 of Object.keys(input)) {
    const reference = ownDataProperty(input, steamId64);
    const normalized = normalizePlayerPresentationReference(reference);
    if (!normalized || normalized.steam.steamId64 !== steamId64) {
      throw new PlayerPresentationReferenceContractError();
    }
    references.set(steamId64, normalized);
  }

  return references;
}

export function normalizePlayerPresentationReference(
  input: unknown,
): PlayerPresentationReference | null {
  if (!isRecord(input)) return null;

  const steam = ownDataProperty(input, 'steam');
  const profile = ownDataProperty(input, 'profile');
  if (!isRecord(steam)) return null;

  const steamId64 = ownDataProperty(steam, 'steamId64');
  if (!isSteamId64(steamId64)) return null;

  const personaname = nullableTrimmedString(ownDataProperty(steam, 'personaname'));
  const avatarMediumUrl = nullableTrimmedString(ownDataProperty(steam, 'avatarMediumUrl'));
  if (personaname === undefined || avatarMediumUrl === undefined) return null;

  let normalizedProfile: { readonly slug: string } | null;
  if (profile === null) {
    normalizedProfile = null;
  } else if (isRecord(profile)) {
    const slug = requiredTrimmedString(ownDataProperty(profile, 'slug'));
    if (!slug) return null;
    normalizedProfile = { slug };
  } else {
    return null;
  }

  return {
    steam: { steamId64, personaname, avatarMediumUrl },
    profile: normalizedProfile,
  };
}

function nullableTrimmedString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return requiredTrimmedString(value) ?? undefined;
}

function requiredTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ownDataProperty(record: object, key: PropertyKey): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && 'value' in descriptor ? descriptor.value : undefined;
}
