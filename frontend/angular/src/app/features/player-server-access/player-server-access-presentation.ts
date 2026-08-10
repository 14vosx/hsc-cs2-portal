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
      status: 'Verificação indisponível',
      description: 'Não foi possível verificar o acesso aos servidores agora.',
      authorized: false,
    };
  }

  if (access.authorized) {
    return {
      status: 'Acesso liberado',
      description: 'Sua conta está apta para acessar os servidores HSC.',
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
      status: 'Steam necessária',
      description: 'Vincule sua Steam em Conta e Segurança para habilitar o acesso.',
    },
    player_account_disabled: {
      status: 'Acesso indisponível',
      description: 'O acesso aos servidores não está disponível para esta conta.',
    },
    membership_required: {
      status: 'Membership HSC necessário',
      description: 'É necessário ter um Membership HSC efetivo para acessar os servidores.',
    },
    membership_inactive: {
      status: 'Membership inativo',
      description: 'Seu Membership HSC não está ativo para acesso aos servidores.',
    },
    membership_suspended: {
      status: 'Membership suspenso',
      description: 'Seu Membership HSC está suspenso para acesso aos servidores.',
    },
    membership_expired: {
      status: 'Membership expirado',
      description: 'Seu Membership HSC expirou e não libera acesso aos servidores.',
    },
    membership_cancelled: {
      status: 'Membership cancelado',
      description: 'Seu Membership HSC foi cancelado e não libera acesso aos servidores.',
    },
  };
  return { ...presentations[reason], authorized: false };
}
