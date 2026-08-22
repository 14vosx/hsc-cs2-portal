import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import type {
  MatchRoomMapVetoAction,
  MatchRoomMapVetoSnapshot,
  MatchRoomMapVetoSource,
  MatchRoomParticipant,
} from '../../domain/match-room.model';

@Component({
  selector: 'app-match-room-map-veto-panel',
  imports: [TranslatePipe, StatusBadge],
  templateUrl: './match-room-map-veto-panel.html',
  styleUrl: './match-room-map-veto-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchRoomMapVetoPanel {
  readonly mapVeto = input.required<MatchRoomMapVetoSnapshot>();
  readonly participants = input<readonly MatchRoomParticipant[]>([]);
  readonly canMapVetoBan = input<boolean>(false);
  readonly formattedCountdown = input<string>('');
  readonly isWindowClosed = input<boolean>(false);
  readonly pendingMapKey = input<string | null>(null);

  readonly banMap = output<string>();

  protected readonly participantMap = computed(() => {
    const map = new Map<string, MatchRoomParticipant>();
    for (const p of this.participants()) {
      map.set(p.playerAccountId, p);
    }
    return map;
  });

  protected readonly sortedMaps = computed(() => {
    const maps = this.mapVeto().pool.maps.slice();
    return maps.sort((a, b) => a.position - b.position);
  });

  protected readonly actionMap = computed(() => {
    const map = new Map<string, MatchRoomMapVetoAction>();
    for (const action of this.mapVeto().actions) {
      map.set(action.mapKey, action);
    }
    return map;
  });

  protected readonly currentVetoerParticipant = computed(() => {
    const id = this.mapVeto().currentVetoerPlayerAccountId;
    if (!id) return null;
    return this.participantMap().get(id) ?? null;
  });

  protected readonly selectedMap = computed(() => {
    const selectedKey = this.mapVeto().selectedMapKey;
    if (!selectedKey) return null;
    return this.mapVeto().pool.maps.find((m) => m.key === selectedKey) ?? null;
  });

  protected getDisplayName(participant: MatchRoomParticipant | null): string {
    if (participant?.player?.steam.personaname) {
      return participant.player.steam.personaname;
    }
    return 'Jogador HSC';
  }

  protected getBanSourceKey(source: MatchRoomMapVetoSource): string {
    return `mix.mapVeto.sources.${source}`;
  }

  protected onBan(mapKey: string): void {
    if (
      !this.canMapVetoBan() ||
      this.mapVeto().phase !== 'BANNING' ||
      this.pendingMapKey() !== null ||
      !this.mapVeto().availableMapKeys.includes(mapKey)
    ) {
      return;
    }
    this.banMap.emit(mapKey);
  }
}
