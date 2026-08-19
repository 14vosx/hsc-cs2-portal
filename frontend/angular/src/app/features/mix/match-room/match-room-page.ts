import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY, of, switchMap, timer } from 'rxjs';

import { PlayerSessionService } from '../../../core/session/player-session.service';
import { PageState } from '../../../shared/components/page-state/page-state';
import { PlayerAvatar } from '../../../shared/components/player-avatar/player-avatar';
import { PlayerLink } from '../../../shared/components/player-link/player-link';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import {
  mapMatchRoomErrorToI18nKey,
  MatchRoomApiService,
} from '../data-access/match-room-api.service';
import type {
  MatchRoomParticipant,
  MatchRoomSnapshot,
  MatchRoomStatus,
} from '../domain/match-room.model';

@Component({
  selector: 'app-match-room-page',
  imports: [
    RouterLink,
    TranslatePipe,
    PageState,
    StatusBadge,
    PlayerAvatar,
    PlayerLink,
  ],
  templateUrl: './match-room-page.html',
  styleUrl: './match-room-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchRoomPage implements OnInit {
  protected readonly sessionService = inject(PlayerSessionService);
  private readonly matchRoomApi = inject(MatchRoomApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionState$ = toObservable(this.sessionService.state);

  protected readonly snapshot = signal<MatchRoomSnapshot | null>(null);
  protected readonly isInitialLoading = signal(true);
  protected readonly initialError = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly isPerformingAction = signal(false);

  // Countdown and one-shot refresh tracking
  protected readonly nowTimestamp = signal(Date.now());
  private lastRefreshedWindowKey: string | null = null;

  protected readonly remainingSeconds = computed(() => {
    const snap = this.snapshot();
    if (!snap || snap.room.status !== 'CONFIRMING' || !snap.room.confirmation) {
      return null;
    }
    const deadline = Date.parse(snap.room.confirmation.deadlineAt);
    if (isNaN(deadline)) return 0;
    const diff = Math.floor((deadline - this.nowTimestamp()) / 1000);
    return Math.max(0, diff);
  });

  protected readonly formattedCountdown = computed(() => {
    const seconds = this.remainingSeconds();
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  protected readonly isConfirmBlocked = computed(() => {
    const seconds = this.remainingSeconds();
    return seconds !== null && seconds <= 0;
  });

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (!roomId) {
      this.initialError.set('mix.errors.room_not_found');
      this.isInitialLoading.set(false);
      return;
    }

    // 1-second presentation ticker for countdown
    timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.nowTimestamp.set(Date.now());
        this.checkZeroCountdownRefresh(roomId);
      });

    // 3-second bounded polling
    this.sessionState$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((session) => {
          if (session.status !== 'authenticated') {
            return EMPTY;
          }

          return timer(0, 3000).pipe(
            switchMap(() =>
              this.matchRoomApi.getMatchRoom(roomId).pipe(
                catchError((err: unknown) => {
                  if (this.snapshot() === null) {
                    this.initialError.set(mapMatchRoomErrorToI18nKey(err));
                    this.isInitialLoading.set(false);
                  }
                  return of(null);
                }),
              ),
            ),
          );
        }),
      )
      .subscribe((incoming) => {
        if (incoming) {
          this.applySnapshotSafely(incoming);
          this.initialError.set(null);
          this.isInitialLoading.set(false);
        }
      });
  }

  private applySnapshotSafely(incoming: MatchRoomSnapshot): void {
    const current = this.snapshot();
    if (!current || incoming.room.id !== current.room.id) {
      this.snapshot.set(incoming);
      return;
    }

    // Monotonicity check: do not let older versions overwrite newer versions
    if (incoming.room.version >= current.room.version) {
      this.snapshot.set(incoming);
    }
  }

  private checkZeroCountdownRefresh(roomId: string): void {
    const snap = this.snapshot();
    if (!snap || snap.room.status !== 'CONFIRMING' || !snap.room.confirmation) {
      return;
    }

    const seconds = this.remainingSeconds();
    if (seconds !== null && seconds <= 0) {
      const windowKey = `${snap.room.id}:${snap.room.confirmation.round}:${snap.room.confirmation.deadlineAt}`;
      if (this.lastRefreshedWindowKey !== windowKey) {
        this.lastRefreshedWindowKey = windowKey;
        this.refetchRoom(roomId);
      }
    }
  }

  protected getSlots(): Array<MatchRoomParticipant | null> {
    const snap = this.snapshot();
    const participants = snap ? snap.room.participants : [];
    const capacity = snap ? snap.room.capacity : 10;
    const slots: Array<MatchRoomParticipant | null> = [];

    for (let i = 0; i < capacity; i++) {
      slots.push(participants[i] ?? null);
    }

    return slots;
  }

  protected isCreator(participant: MatchRoomParticipant): boolean {
    const snap = this.snapshot();
    if (!snap) return false;
    return participant.playerAccountId === snap.room.creator.playerAccountId;
  }

  protected getDisplayName(participant: MatchRoomParticipant): string {
    return participant.player?.steam.personaname || 'Jogador HSC';
  }

  protected getStatusBadgeVariant(
    status: MatchRoomStatus,
  ): 'active' | 'warning' | 'info' | 'closed' {
    switch (status) {
      case 'FORMING':
        return 'info';
      case 'CONFIRMING':
        return 'warning';
      case 'SETUP':
      case 'READY':
        return 'active';
      case 'PROVISIONING':
        return 'info';
      case 'CANCELLED':
        return 'closed';
    }
  }

  protected onConfirmPresence(): void {
    const snap = this.snapshot();
    if (
      !snap ||
      !snap.viewer.actions.canConfirm ||
      this.isConfirmBlocked() ||
      this.isPerformingAction()
    ) {
      return;
    }

    this.isPerformingAction.set(true);
    this.actionError.set(null);

    this.matchRoomApi.confirmMatchRoom(snap.room.id).subscribe({
      next: (updated) => {
        this.isPerformingAction.set(false);
        this.applySnapshotSafely(updated);
      },
      error: (err: unknown) => {
        this.isPerformingAction.set(false);
        this.actionError.set(mapMatchRoomErrorToI18nKey(err));
        this.refetchRoom(snap.room.id);
      },
    });
  }

  protected onLeaveLobby(): void {
    const snap = this.snapshot();
    if (!snap || !snap.viewer.actions.canLeave || this.isPerformingAction()) {
      return;
    }

    this.isPerformingAction.set(true);
    this.actionError.set(null);

    this.matchRoomApi.leaveMatchRoom(snap.room.id).subscribe({
      next: () => {
        this.isPerformingAction.set(false);
        this.router.navigate(['/mix']);
      },
      error: (err: unknown) => {
        this.isPerformingAction.set(false);
        this.actionError.set(mapMatchRoomErrorToI18nKey(err));
        this.refetchRoom(snap.room.id);
      },
    });
  }

  protected onCancelLobby(): void {
    const snap = this.snapshot();
    if (!snap || !snap.viewer.actions.canCancel || this.isPerformingAction()) {
      return;
    }

    this.isPerformingAction.set(true);
    this.actionError.set(null);

    this.matchRoomApi.cancelMatchRoom(snap.room.id).subscribe({
      next: (updated) => {
        this.isPerformingAction.set(false);
        this.applySnapshotSafely(updated);
      },
      error: (err: unknown) => {
        this.isPerformingAction.set(false);
        this.actionError.set(mapMatchRoomErrorToI18nKey(err));
        this.refetchRoom(snap.room.id);
      },
    });
  }

  protected onJoinLobby(): void {
    const snap = this.snapshot();
    if (!snap || !snap.viewer.actions.canJoin || this.isPerformingAction()) {
      return;
    }

    this.isPerformingAction.set(true);
    this.actionError.set(null);

    this.matchRoomApi.joinMatchRoom(snap.room.id).subscribe({
      next: (updated) => {
        this.isPerformingAction.set(false);
        this.applySnapshotSafely(updated);
      },
      error: (err: unknown) => {
        this.isPerformingAction.set(false);
        this.actionError.set(mapMatchRoomErrorToI18nKey(err));
        this.refetchRoom(snap.room.id);
      },
    });
  }

  protected onRetrySession(): void {
    this.sessionService.load();
  }

  protected refetchRoom(roomId: string): void {
    if (this.sessionService.state().status !== 'authenticated') return;
    this.matchRoomApi.getMatchRoom(roomId).subscribe({
      next: (incoming) => {
        this.applySnapshotSafely(incoming);
        this.initialError.set(null);
      },
      error: (err: unknown) => {
        if (this.snapshot() === null) {
          this.initialError.set(mapMatchRoomErrorToI18nKey(err));
        }
      },
    });
  }
}
