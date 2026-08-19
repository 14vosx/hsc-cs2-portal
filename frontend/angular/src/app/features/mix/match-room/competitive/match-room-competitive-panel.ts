import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayerAvatar } from '../../../../shared/components/player-avatar/player-avatar';
import { PlayerLink } from '../../../../shared/components/player-link/player-link';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import type {
  CompetitiveMatchRosterEntry,
  CompetitiveMatchSnapshot,
  MatchRoomParticipant,
} from '../../domain/match-room.model';

@Component({
  selector: 'app-match-room-competitive-panel',
  imports: [TranslatePipe, PlayerAvatar, PlayerLink, StatusBadge],
  templateUrl: './match-room-competitive-panel.html',
  styleUrl: './match-room-competitive-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchRoomCompetitivePanel {
  readonly competitiveMatch = input<CompetitiveMatchSnapshot | null>(null);
  readonly participants = input<readonly MatchRoomParticipant[]>([]);
  readonly status = input.required<'READY' | 'PROVISIONING'>();

  protected readonly participantMap = computed(() => {
    const map = new Map<string, MatchRoomParticipant>();
    for (const p of this.participants()) {
      map.set(p.playerAccountId, p);
    }
    return map;
  });

  protected readonly teamARoster = computed<readonly CompetitiveMatchRosterEntry[]>(() => {
    const match = this.competitiveMatch();
    if (!match) return [];
    return match.roster.filter((r) => r.team === 'A');
  });

  protected readonly teamBRoster = computed<readonly CompetitiveMatchRosterEntry[]>(() => {
    const match = this.competitiveMatch();
    if (!match) return [];
    return match.roster.filter((r) => r.team === 'B');
  });

  protected getDisplayName(playerAccountId: string): string {
    const participant = this.participantMap().get(playerAccountId);
    if (participant?.player?.steam?.personaname) {
      return participant.player.steam.personaname;
    }
    return 'Jogador HSC';
  }

  protected getProfileSlug(playerAccountId: string): string | null {
    const participant = this.participantMap().get(playerAccountId);
    return participant?.player?.profile?.slug ?? null;
  }

  protected getAvatarUrl(playerAccountId: string): string | null {
    const participant = this.participantMap().get(playerAccountId);
    return participant?.player?.steam?.avatarMediumUrl ?? null;
  }
}
