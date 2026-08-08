export type PlayerMembershipStatus =
  | 'inactive'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'cancelled';

export interface PlayerMembership {
  readonly status: PlayerMembershipStatus;
  readonly planCode: string;
  readonly startedAt: string | null;
  readonly expiresAt: string | null;
  readonly suspendedAt: string | null;
  readonly cancelledAt: string | null;
}
