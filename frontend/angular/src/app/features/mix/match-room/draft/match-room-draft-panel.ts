import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { PlayerAvatar } from '../../../../shared/components/player-avatar/player-avatar';
import { PlayerLink } from '../../../../shared/components/player-link/player-link';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import type {
  MatchRoomDraftSnapshot,
  MatchRoomParticipant,
} from '../../domain/match-room.model';

@Component({
  selector: 'app-match-room-draft-panel',
  imports: [TranslatePipe, PlayerAvatar, PlayerLink, StatusBadge],
  templateUrl: './match-room-draft-panel.html',
  styleUrl: './match-room-draft-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchRoomDraftPanel {
  readonly draft = input.required<MatchRoomDraftSnapshot>();
  readonly participants = input<readonly MatchRoomParticipant[]>([]);
  readonly canDraftPick = input<boolean>(false);
  readonly formattedCountdown = input<string>('');
  readonly isWindowClosed = input<boolean>(false);
  readonly pendingPlayerAccountId = input<string | null>(null);

  readonly pickPlayer = output<string>();

  protected readonly participantMap = computed(() => {
    const map = new Map<string, MatchRoomParticipant>();
    for (const p of this.participants()) {
      map.set(p.playerAccountId, p);
    }
    return map;
  });

  protected readonly teamAAssignments = computed(() => {
    return this.draft().assignments.filter((a) => a.team === 'A');
  });

  protected readonly teamBAssignments = computed(() => {
    return this.draft().assignments.filter((a) => a.team === 'B');
  });

  protected readonly currentPickerParticipant = computed(() => {
    const id = this.draft().currentPickerPlayerAccountId;
    if (!id) return null;
    return this.participantMap().get(id) ?? null;
  });

  protected getDisplayName(participant: MatchRoomParticipant | null): string {
    if (participant?.player?.steam.personaname) {
      return participant.player.steam.personaname;
    }
    return 'Jogador HSC';
  }

  protected onPick(playerAccountId: string): void {
    if (
      !this.canDraftPick() ||
      this.draft().phase !== 'PICKING' ||
      this.isWindowClosed() ||
      this.pendingPlayerAccountId() !== null
    ) {
      return;
    }
    this.pickPlayer.emit(playerAccountId);
  }
}
