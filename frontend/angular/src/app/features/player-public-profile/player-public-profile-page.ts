import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

import { PageState } from '../../shared/components/page-state/page-state';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import {
  PlayerPublicProfileApiService,
  PlayerPublicProfileContractError,
} from '../player/data-access/player-public-profile-api.service';
import type { PlayerPublicProfile } from '../player/domain/player-public-profile.model';
import {
  PREFERRED_MAPS,
  PREFERRED_ROLES,
  type PreferredMap,
  type PreferredRole,
} from '../player/domain/player-profile.model';

type PlayerPublicProfilePageState =
  | { readonly state: 'loading' }
  | { readonly state: 'ready'; readonly profile: PlayerPublicProfile }
  | { readonly state: 'unauthenticated' }
  | { readonly state: 'forbidden' }
  | { readonly state: 'unavailable' }
  | { readonly state: 'failure' };

@Component({
  selector: 'app-player-public-profile-page',
  imports: [AsyncPipe, PageState],
  templateUrl: './player-public-profile-page.html',
  styleUrl: './player-public-profile-page.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PlayerPublicProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly publicProfileApi = inject(PlayerPublicProfileApiService);
  private readonly playerAuthApi = inject(PlayerAuthApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly steamLoginUrl = this.playerAuthApi.steamLoginUrl;

  protected readonly vm$: Observable<PlayerPublicProfilePageState> = combineLatest([
    this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      distinctUntilChanged(),
    ),
    this.reload$.pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([slug]) => {
      if (!slug) {
        return of({ state: 'unavailable' } satisfies PlayerPublicProfilePageState);
      }

      return this.publicProfileApi.getProfile(slug).pipe(
        map((profile) => ({ state: 'ready', profile }) satisfies PlayerPublicProfilePageState),
        startWith({ state: 'loading' } satisfies PlayerPublicProfilePageState),
        catchError((error: unknown) => of(toFailureState(error))),
      );
    }),
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected preferredRoleLabel(role: PreferredRole): string {
    return PREFERRED_ROLES.find((candidate) => candidate.key === role)?.label ?? role;
  }

  protected preferredMapLabel(mapName: PreferredMap): string {
    return PREFERRED_MAPS.find((candidate) => candidate.key === mapName)?.label ?? mapName;
  }

  protected formatJoinedAt(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }
}

function toFailureState(error: unknown): PlayerPublicProfilePageState {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return { state: 'unauthenticated' };
    }
    if (error.status === 403) {
      return { state: 'forbidden' };
    }
    if (error.status === 404) {
      return { state: 'unavailable' };
    }
  }

  if (error instanceof PlayerPublicProfileContractError) {
    return { state: 'failure' };
  }

  return { state: 'failure' };
}
