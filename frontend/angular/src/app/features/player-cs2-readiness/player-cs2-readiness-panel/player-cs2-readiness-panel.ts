import { Component, computed, input } from '@angular/core';

import type { PlayerAccountSummary } from '../../player/domain/player-account.model';
import type { PlayerMembership } from '../../player/domain/player-membership.model';
import type { PlayerServerAccess } from '../../player/domain/player-server-access.model';
import type { PlayerServerAccessLoadState } from '../../player-server-access/player-server-access-panel/player-server-access-panel';
import { presentServerAccess } from '../../player-server-access/player-server-access-presentation';

export type PlayerCs2StatsState = 'ready' | 'unavailable' | 'error';

type ReadinessTone = 'positive' | 'attention' | 'neutral';

interface ReadinessItem {
  readonly label: string;
  readonly status: string;
  readonly tone: ReadinessTone;
  readonly href: string | null;
}

@Component({
  selector: 'app-player-cs2-readiness-panel',
  standalone: true,
  templateUrl: './player-cs2-readiness-panel.html',
  styleUrl: './player-cs2-readiness-panel.css',
})
export class PlayerCs2ReadinessPanel {
  readonly account = input.required<PlayerAccountSummary>();
  readonly membership = input.required<PlayerMembership | null>();
  readonly statsState = input.required<PlayerCs2StatsState>();
  readonly serverAccess = input.required<PlayerServerAccess | null>();
  readonly serverAccessState = input.required<PlayerServerAccessLoadState>();

  protected readonly items = computed<readonly ReadinessItem[]>(() => [
    this.accountItem(),
    this.steamItem(),
    this.statsItem(),
    this.membershipItem(),
    this.serverAccessItem(),
  ]);

  private accountItem(): ReadinessItem {
    const active = this.account().status === 'active';
    return {
      label: 'Conta HSC',
      status: active ? 'Ativa' : 'Indisponível',
      tone: active ? 'positive' : 'attention',
      href: null,
    };
  }

  private steamItem(): ReadinessItem {
    const linked = this.account().identities.steam.linked;
    return {
      label: 'Steam',
      status: linked ? 'Vinculada' : 'Não vinculada',
      tone: linked ? 'positive' : 'attention',
      href: '#conta-seguranca',
    };
  }

  private statsItem(): ReadinessItem {
    if (this.statsState() === 'error') {
      return {
        label: 'Estatísticas',
        status: 'Temporariamente indisponíveis',
        tone: 'attention',
        href: '#estatisticas',
      };
    }
    if (this.account().capabilities.personalizedStats.available) {
      return {
        label: 'Estatísticas',
        status: 'Disponíveis',
        tone: 'positive',
        href: '#estatisticas',
      };
    }
    return {
      label: 'Estatísticas',
      status: 'Steam necessária',
      tone: 'attention',
      href: '#estatisticas',
    };
  }

  private membershipItem(): ReadinessItem {
    const membership = this.membership();
    if (!membership) {
      return {
        label: 'Membership',
        status: 'Sem associação',
        tone: 'neutral',
        href: '#membro',
      };
    }
    const labels: Record<PlayerMembership['status'], string> = {
      inactive: 'Inativo',
      active: 'Ativo',
      suspended: 'Suspenso',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return {
      label: 'Membership',
      status: labels[membership.status],
      tone: membership.status === 'active' ? 'positive' : 'attention',
      href: '#membro',
    };
  }

  private serverAccessItem(): ReadinessItem {
    const access = this.serverAccess();
    if (this.serverAccessState() === 'unavailable' || !access) {
      return {
        label: 'Server Access',
        status: 'Não foi possível verificar agora',
        tone: 'attention',
        href: '#acesso-servidores',
      };
    }
    const presentation = presentServerAccess(access, true);
    return {
      label: 'Server Access',
      status: presentation.status,
      tone: presentation.authorized ? 'positive' : 'attention',
      href: '#acesso-servidores',
    };
  }
}
