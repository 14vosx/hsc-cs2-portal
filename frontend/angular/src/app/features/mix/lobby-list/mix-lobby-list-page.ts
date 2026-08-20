import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY, merge, of, Subject, switchMap, timer } from 'rxjs';

import { PlayerSessionService } from '../../../core/session/player-session.service';
import { PageState } from '../../../shared/components/page-state/page-state';
import { StatusBadge, type StatusBadgeVariant } from '../../../shared/components/status-badge/status-badge';
import { PlayerSelfApiService } from '../../player/data-access/player-self-api.service';
import type { PlayerMembership, PlayerMembershipStatus } from '../../player/domain/player-membership.model';
import {
  mapMatchRoomErrorToI18nKey,
  MatchRoomApiService,
} from '../data-access/match-room-api.service';
import type { MatchRoomSnapshot, MatchRoomStatus } from '../domain/match-room.model';

@Component({
  selector: 'app-mix-lobby-list-page',
  imports: [RouterLink, TranslatePipe, PageState, StatusBadge],
  templateUrl: './mix-lobby-list-page.html',
  styleUrl: './mix-lobby-list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixLobbyListPage implements OnInit {
  protected readonly sessionService = inject(PlayerSessionService);
  private readonly playerSelfApi = inject(PlayerSelfApiService);
  private readonly matchRoomApi = inject(MatchRoomApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly sessionState$ = toObservable(this.sessionService.state);
  private readonly membershipReloadSubject = new Subject<void>();

  protected readonly membership = signal<PlayerMembership | null>(null);
  protected readonly isMembershipLoading = signal(false);
  protected readonly isMembershipError = signal(false);

  protected readonly matchRooms = signal<readonly MatchRoomSnapshot[] | null>(null);
  protected readonly isInitialLoading = signal(true);
  protected readonly initialError = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly isCreating = signal(false);
  protected readonly joiningRoomId = signal<string | null>(null);

  ngOnInit(): void {
    this.sessionState$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((session) => {
          if (session.status !== 'authenticated') {
            this.membership.set(null);
            this.isMembershipLoading.set(false);
            this.isMembershipError.set(false);
            this.matchRooms.set(null);
            this.initialError.set(null);
            this.isInitialLoading.set(false);
            return EMPTY;
          }

          return merge(of(null), this.membershipReloadSubject).pipe(
            switchMap(() => {
              this.isMembershipLoading.set(true);
              this.isMembershipError.set(false);

              return this.playerSelfApi.getMembership().pipe(
                catchError(() => {
                  this.isMembershipLoading.set(false);
                  this.isMembershipError.set(true);
                  this.membership.set(null);
                  this.matchRooms.set(null);
                  this.isInitialLoading.set(false);
                  return of('MEMBERSHIP_ERROR' as const);
                }),
                switchMap((result) => {
                  if (result === 'MEMBERSHIP_ERROR') {
                    return EMPTY;
                  }

                  const mem = result;
                  this.membership.set(mem);
                  this.isMembershipLoading.set(false);
                  this.isMembershipError.set(false);

                  if (mem?.status !== 'active') {
                    this.matchRooms.set(null);
                    this.isInitialLoading.set(false);
                    return EMPTY;
                  }

                  this.isInitialLoading.set(true);
                  this.initialError.set(null);

                  return timer(0, 5000).pipe(
                    switchMap(() =>
                      this.matchRoomApi.listMatchRooms().pipe(
                        catchError((err: unknown) => {
                          if (this.matchRooms() === null) {
                            this.initialError.set(mapMatchRoomErrorToI18nKey(err));
                            this.isInitialLoading.set(false);
                          }
                          return of(null);
                        }),
                      ),
                    ),
                  );
                }),
              );
            }),
          );
        }),
      )
      .subscribe((rooms) => {
        if (rooms !== null && rooms !== undefined) {
          this.matchRooms.set(rooms);
          this.initialError.set(null);
          this.isInitialLoading.set(false);
        }
      });
  }

  protected getCurrentRoom(): MatchRoomSnapshot | null {
    const rooms = this.matchRooms();
    if (!rooms) return null;
    return rooms.find((r) => r.viewer.participant) ?? null;
  }

  protected getOpenRooms(): readonly MatchRoomSnapshot[] {
    const rooms = this.matchRooms();
    if (!rooms) return [];
    const current = this.getCurrentRoom();
    return rooms.filter((r) => r.room.status === 'FORMING' && r.room.id !== current?.room.id);
  }

  protected getStatusBadgeVariant(
    status: MatchRoomStatus,
  ): StatusBadgeVariant {
    switch (status) {
      case 'FORMING':
        return 'info';
      case 'CONFIRMING':
        return 'warning';
      case 'SETUP':
      case 'READY':
        return 'active';
      case 'JOINABLE':
        return 'success';
      case 'PROVISIONING':
        return 'info';
      case 'CANCELLED':
        return 'closed';
      case 'FAILED':
        return 'danger';
    }
  }

  protected getMembershipBadgeVariant(status: PlayerMembershipStatus | null): StatusBadgeVariant {
    if (!status) return 'neutral';
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'neutral';
      case 'expired':
        return 'warning';
      case 'suspended':
        return 'danger';
      case 'cancelled':
        return 'closed';
    }
  }

  protected onCreateLobby(): void {
    if (
      this.isCreating() ||
      this.getCurrentRoom() !== null ||
      this.membership()?.status !== 'active'
    ) {
      return;
    }

    this.isCreating.set(true);
    this.actionError.set(null);

    this.matchRoomApi.createMatchRoom().subscribe({
      next: (snapshot) => {
        this.isCreating.set(false);
        this.router.navigate(['/mix/rooms', snapshot.room.id]);
      },
      error: (err: unknown) => {
        this.isCreating.set(false);
        this.actionError.set(mapMatchRoomErrorToI18nKey(err));
        this.refetchList();
      },
    });
  }

  protected onJoinLobby(room: MatchRoomSnapshot): void {
    if (
      !room.viewer.actions.canJoin ||
      this.joiningRoomId() !== null ||
      this.membership()?.status !== 'active'
    ) {
      return;
    }

    this.joiningRoomId.set(room.room.id);
    this.actionError.set(null);

    this.matchRoomApi.joinMatchRoom(room.room.id).subscribe({
      next: (snapshot) => {
        this.joiningRoomId.set(null);
        this.router.navigate(['/mix/rooms', snapshot.room.id]);
      },
      error: (err: unknown) => {
        this.joiningRoomId.set(null);
        this.actionError.set(mapMatchRoomErrorToI18nKey(err));
        this.refetchList();
      },
    });
  }

  protected onRetrySession(): void {
    this.sessionService.load();
  }

  protected onRetryMembership(): void {
    this.membershipReloadSubject.next();
  }

  protected refetchList(): void {
    if (
      this.sessionService.state().status !== 'authenticated' ||
      this.membership()?.status !== 'active'
    ) {
      return;
    }
    this.matchRoomApi.listMatchRooms().subscribe({
      next: (rooms) => {
        this.matchRooms.set(rooms);
        this.initialError.set(null);
      },
      error: (err) => {
        if (this.matchRooms() === null) {
          this.initialError.set(mapMatchRoomErrorToI18nKey(err));
        }
      },
    });
  }
}
