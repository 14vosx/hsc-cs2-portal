export const PLAYER_SERVER_ACCESS_REASONS = [
  'membership_active',
  'steam_identity_not_linked',
  'player_account_disabled',
  'membership_required',
  'membership_inactive',
  'membership_suspended',
  'membership_expired',
  'membership_cancelled',
] as const;

export type PlayerServerAccessReason = (typeof PLAYER_SERVER_ACCESS_REASONS)[number];

export type PlayerServerAccess =
  | {
      readonly ok: true;
      readonly authorized: true;
      readonly reason: 'membership_active';
    }
  | {
      readonly ok: true;
      readonly authorized: false;
      readonly reason: Exclude<PlayerServerAccessReason, 'membership_active'>;
    };

export function isPlayerServerAccessReason(value: unknown): value is PlayerServerAccessReason {
  return (
    typeof value === 'string' &&
    (PLAYER_SERVER_ACCESS_REASONS as readonly string[]).includes(value)
  );
}
