export type PlayerProfileVisibility = 'private' | 'public';

export const PREFERRED_ROLES = [
  { key: 'awper', label: 'AWPer' },
  { key: 'rifler', label: 'Rifler' },
  { key: 'entry_fragger', label: 'Entry Fragger' },
  { key: 'lurker', label: 'Lurker' },
  { key: 'support', label: 'Support' },
  { key: 'igl', label: 'IGL' },
  { key: 'anchor', label: 'Anchor' },
] as const;

export type PreferredRole = (typeof PREFERRED_ROLES)[number]['key'];

export function isPreferredRole(value: unknown): value is PreferredRole {
  return typeof value === 'string' && PREFERRED_ROLES.some((r) => r.key === value);
}

export const PREFERRED_MAPS = [
  { key: 'de_ancient', label: 'Ancient' },
  { key: 'de_anubis', label: 'Anubis' },
  { key: 'de_cache', label: 'Cache' },
  { key: 'de_cbble', label: 'Cobblestone' },
  { key: 'de_dust2', label: 'Dust II' },
  { key: 'de_inferno', label: 'Inferno' },
  { key: 'de_mirage', label: 'Mirage' },
  { key: 'de_nuke', label: 'Nuke' },
  { key: 'de_overpass', label: 'Overpass' },
  { key: 'de_train', label: 'Train' },
  { key: 'de_vertigo', label: 'Vertigo' },
  { key: 'cs_italy', label: 'Italy' },
  { key: 'cs_office', label: 'Office' },
  { key: 'de_boulder', label: 'Boulder' },
  { key: 'de_fachwerk', label: 'Fachwerk' },
  { key: 'cs_shelter', label: 'Shelter' },
  { key: 'de_debris', label: 'Debris' },
  { key: 'de_eldorado', label: 'El Dorado' },
  { key: 'de_poseidon', label: 'Poseidon' },
] as const;

export type PreferredMap = (typeof PREFERRED_MAPS)[number]['key'];

export function isPreferredMap(value: unknown): value is PreferredMap {
  return typeof value === 'string' && PREFERRED_MAPS.some((m) => m.key === value);
}

export interface PlayerProfile {
  readonly displayName: string;
  readonly slug: string;
  readonly bio: string | null;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
  readonly discordHandle: string | null;
  readonly preferredRole: PreferredRole | null;
  readonly preferredMap: PreferredMap | null;
  readonly visibility: PlayerProfileVisibility;
  readonly joinedAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface PlayerProfilePatch {
  readonly displayName?: string;
  readonly slug?: string;
  readonly bio?: string | null;
  readonly discordHandle?: string | null;
  readonly preferredRole?: PreferredRole | null;
  readonly preferredMap?: PreferredMap | null;
  readonly visibility?: PlayerProfileVisibility;
}
