import type {
  PlayerProfile,
  PlayerProfilePatch,
  PlayerProfileVisibility,
  PreferredMap,
  PreferredRole,
} from '../../player/domain/player-profile.model';

export interface PlayerProfileEditModel {
  displayName: string;
  slug: string;
  bio: string;
  discordHandle: string;
  preferredRole: PreferredRole | '';
  preferredMap: PreferredMap | '';
  visibility: PlayerProfileVisibility;
}

export function createPlayerProfileEditModel(profile: PlayerProfile): PlayerProfileEditModel {
  return {
    displayName: profile.displayName ?? '',
    slug: profile.slug ?? '',
    bio: profile.bio ?? '',
    discordHandle: profile.discordHandle ?? '',
    preferredRole: profile.preferredRole ?? '',
    preferredMap: profile.preferredMap ?? '',
    visibility: profile.visibility ?? 'private',
  };
}

export function isTechnicalSlug(slug: string): boolean {
  return /^player-[0-9a-f]{32}$/.test(slug);
}

export function buildPlayerProfilePatch(
  current: PlayerProfileEditModel,
  original: PlayerProfile,
): PlayerProfilePatch | null {
  let patch: PlayerProfilePatch = {};

  const normDisplayName = current.displayName.trim();
  const origDisplayName = original.displayName.trim();
  if (normDisplayName !== origDisplayName) {
    patch = { ...patch, displayName: normDisplayName };
  }

  const normSlug = current.slug.trim().toLowerCase();
  const origSlug = original.slug.trim().toLowerCase();
  if (normSlug !== origSlug) {
    patch = { ...patch, slug: normSlug };
  }

  const normBio = current.bio.trim() || null;
  const origBio = original.bio ? original.bio.trim() || null : null;
  if (normBio !== origBio) {
    patch = { ...patch, bio: normBio };
  }

  const normDiscordHandle = current.discordHandle.trim() || null;
  const origDiscordHandle = original.discordHandle ? original.discordHandle.trim() || null : null;
  if (normDiscordHandle !== origDiscordHandle) {
    patch = { ...patch, discordHandle: normDiscordHandle };
  }

  const normPreferredRole: PreferredRole | null = current.preferredRole || null;
  const origPreferredRole = original.preferredRole;
  if (normPreferredRole !== origPreferredRole) {
    patch = { ...patch, preferredRole: normPreferredRole };
  }

  const normPreferredMap: PreferredMap | null = current.preferredMap || null;
  const origPreferredMap = original.preferredMap;
  if (normPreferredMap !== origPreferredMap) {
    patch = { ...patch, preferredMap: normPreferredMap };
  }

  const normVisibility = current.visibility;
  const origVisibility = original.visibility;
  if (normVisibility !== origVisibility) {
    patch = { ...patch, visibility: normVisibility };
  }

  if (Object.keys(patch).length === 0) {
    return null;
  }

  return patch;
}
