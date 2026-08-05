import { Component, computed, input, output, signal } from '@angular/core';
import type { PlayerIdentity } from '../../../player/domain/player-identity.model';
import type { BunkerSummary } from '../../domain/bunker.model';
import { StatusBadge, type StatusBadgeVariant } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-bunker-player-header',
  standalone: true,
  imports: [StatusBadge],
  templateUrl: './bunker-player-header.html',
  styleUrl: './bunker-player-header.css',
})
export class BunkerPlayerHeader {
  readonly player = input.required<PlayerIdentity>();
  readonly summary = input.required<BunkerSummary>();
  readonly logoutPending = input(false);
  readonly logoutFailed = input(false);

  readonly logoutRequested = output<void>();

  readonly failedAvatarUrl = signal<string | null>(null);

  readonly playerName = computed(() => {
    const sName = this.summary().seasonPlayer?.name?.trim();
    if (sName) {
      return sName;
    }
    const cName = this.summary().competitiveProfile?.name?.trim();
    if (cName) {
      return cName;
    }
    const pName = this.player().displayName?.trim();
    if (pName) {
      return pName;
    }
    return 'Jogador HSC';
  });

  readonly steamId64 = computed(() => {
    const sSteamId = this.summary().seasonPlayer?.steamId64?.trim();
    if (sSteamId) {
      return sSteamId;
    }
    const cSteamId = this.summary().competitiveProfile?.steamId64?.trim();
    if (cSteamId) {
      return cSteamId;
    }
    const pSteamId = this.player().steamId64?.trim();
    if (pSteamId) {
      return pSteamId;
    }
    return '';
  });

  readonly avatarUrl = computed(() => {
    const cAvatar = this.summary().competitiveProfile?.avatarMedium?.trim();
    if (cAvatar) {
      return cAvatar;
    }
    const pAvatar = this.player().avatarMedium?.trim();
    if (pAvatar) {
      return pAvatar;
    }
    return null;
  });

  readonly showAvatar = computed(() => {
    const url = this.avatarUrl();
    return !!url && url !== this.failedAvatarUrl();
  });

  readonly steamProfileUrl = computed(() => {
    const cUrl = this.summary().competitiveProfile?.steamProfileUrl?.trim();
    if (cUrl) {
      return cUrl;
    }
    const pUrl = this.player().steamProfileUrl?.trim();
    if (pUrl) {
      return pUrl;
    }
    return null;
  });

  readonly monogram = computed(() => {
    const name = this.playerName();
    const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (words.length === 0) {
      return 'HSC';
    }
    const initials = words
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase();
    return initials || 'HSC';
  });

  readonly seasonFirstLabel = computed(() => {
    const val = this.summary().seasonFirst;
    if (val === true) {
      return 'sim';
    }
    if (val === false) {
      return 'não';
    }
    return 'aguardando';
  });

  readonly seasonFirstTone = computed<StatusBadgeVariant>(() => {
    const val = this.summary().seasonFirst;
    if (val === true) {
      return 'success';
    }
    if (val === false) {
      return 'info';
    }
    return 'neutral';
  });

  readonly statsAvailabilityLabel = computed(() => {
    const val = this.summary().statsAvailable;
    if (val === true) {
      return 'sim';
    }
    if (val === false) {
      return 'pendente';
    }
    return 'aguardando';
  });

  readonly statsAvailabilityTone = computed<StatusBadgeVariant>(() => {
    const val = this.summary().statsAvailable;
    if (val === true) {
      return 'success';
    }
    if (val === false) {
      return 'warning';
    }
    return 'neutral';
  });

  onAvatarError(): void {
    const current = this.avatarUrl();
    if (current) {
      this.failedAvatarUrl.set(current);
    }
  }

  onLogout(): void {
    if (!this.logoutPending()) {
      this.logoutRequested.emit();
    }
  }
}
