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
import { catchError, EMPTY, of, switchMap, timer } from 'rxjs';

import { PlayerSessionService } from '../../../core/session/player-session.service';
import { PageState } from '../../../shared/components/page-state/page-state';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
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
  private readonly matchRoomApi = inject(MatchRoomApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionState$ = toObservable(this.sessionService.state);

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
            return EMPTY;
          }

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
      )
      .subscribe((rooms) => {
        if (rooms !== null) {
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
  ): 'active' | 'warning' | 'info' | 'closed' {
    switch (status) {
      case 'FORMING':
        return 'info';
      case 'CONFIRMING':
        return 'warning';
      case 'SETUP':
        return 'active';
      case 'CANCELLED':
        return 'closed';
    }
  }

  protected onCreateLobby(): void {
    if (this.isCreating() || this.getCurrentRoom() !== null) {
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
    if (!room.viewer.actions.canJoin || this.joiningRoomId() !== null) {
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

  protected refetchList(): void {
    if (this.sessionService.state().status !== 'authenticated') return;
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
