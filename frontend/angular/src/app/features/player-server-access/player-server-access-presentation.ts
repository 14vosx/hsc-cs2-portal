import type {
  PlayerServerAccess,
  PlayerServerAccessReason,
} from '../player/domain/player-server-access.model';

export interface ServerAccessPresentation {
  readonly status: string;
  readonly description: string;
  readonly authorized: boolean;
}

export function presentServerAccess(
  access: PlayerServerAccess | null,
  available: boolean,
): ServerAccessPresentation {
  if (!available || !access) {
    return {
      status: 'playerArea.serverAccess.unavailable.status',
      description: 'playerArea.serverAccess.unavailable.description',
      authorized: false,
    };
  }

  if (access.authorized) {
    return {
      status: 'playerArea.serverAccess.authorized.status',
      description: 'playerArea.serverAccess.authorized.description',
      authorized: true,
    };
  }

  return deniedServerAccessPresentation(access.reason);
}

function deniedServerAccessPresentation(
  reason: Exclude<PlayerServerAccessReason, 'membership_active'>,
): ServerAccessPresentation {
  const presentations: Record<
    typeof reason,
    Omit<ServerAccessPresentation, 'authorized'>
  > = {
    steam_identity_not_linked: {
      status: 'playerArea.serverAccess.reasons.steamIdentityNotLinked.status',
      description: 'playerArea.serverAccess.reasons.steamIdentityNotLinked.description',
    },
    player_account_disabled: {
      status: 'playerArea.serverAccess.reasons.accountDisabled.status',
      description: 'playerArea.serverAccess.reasons.accountDisabled.description',
    },
    membership_required: {
      status: 'playerArea.serverAccess.reasons.membershipRequired.status',
      description: 'playerArea.serverAccess.reasons.membershipRequired.description',
    },
    membership_inactive: {
      status: 'playerArea.serverAccess.reasons.membershipInactive.status',
      description: 'playerArea.serverAccess.reasons.membershipInactive.description',
    },
    membership_suspended: {
      status: 'playerArea.serverAccess.reasons.membershipSuspended.status',
      description: 'playerArea.serverAccess.reasons.membershipSuspended.description',
    },
    membership_expired: {
      status: 'playerArea.serverAccess.reasons.membershipExpired.status',
      description: 'playerArea.serverAccess.reasons.membershipExpired.description',
    },
    membership_cancelled: {
      status: 'playerArea.serverAccess.reasons.membershipCancelled.status',
      description: 'playerArea.serverAccess.reasons.membershipCancelled.description',
    },
  };
  return { ...presentations[reason], authorized: false };
}
