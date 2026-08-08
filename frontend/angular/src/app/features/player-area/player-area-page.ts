import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  firstValueFrom,
  forkJoin,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

import { BunkerApiService } from '../bunker/data-access/bunker-api.service';
import type { BunkerSummary } from '../bunker/domain/bunker.model';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import { PlayerSelfApiService } from '../player/data-access/player-self-api.service';
import {
  mapPlayerProfileServerError,
  type MappedProfileError,
} from './player-profile-update-error';
import type { PlayerAccountSummary } from '../player/domain/player-account.model';
import type { PlayerIdentity } from '../player/domain/player-identity.model';
import type {
  PlayerMembership,
  PlayerMembershipStatus,
} from '../player/domain/player-membership.model';
import {
  PREFERRED_MAPS,
  PREFERRED_ROLES,
  type PlayerProfile,
  type PlayerProfilePatch,
  type PlayerProfileVisibility,
  type PreferredMap,
  type PreferredRole,
} from '../player/domain/player-profile.model';
import { PlayerProfileEditor } from './player-profile-editor/player-profile-editor';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { UiCard } from '../../shared/components/card/card';
import {
  StatusBadge,
  type StatusBadgeVariant,
} from '../../shared/components/status-badge/status-badge';

type PlayerAreaStatsState = 'ready' | 'unavailable' | 'error';

interface PlayerAreaReadyVm {
  readonly state: 'ready';
  readonly identity: PlayerIdentity;
  readonly account: PlayerAccountSummary;
  readonly profile: PlayerProfile;
  readonly membership: PlayerMembership | null;
  readonly statsState: PlayerAreaStatsState;
  readonly statsSummary: BunkerSummary | null;
}

type PlayerAreaVm =
  | PlayerAreaReadyVm
  | { readonly state: 'loading' }
  | { readonly state: 'unauthenticated' }
  | { readonly state: 'error' };

type PlayerAreaReloadAction = 'load' | 'signed-out';

@Component({
  selector: 'app-player-area-page',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    EmptyState,
    PageHeader,
    UiCard,
    StatusBadge,
    PlayerProfileEditor,
  ],
  templateUrl: './player-area-page.html',
  styleUrl: './player-area-page.css',
})
export class PlayerAreaPage {
  private readonly identityApi = inject(PlayerIdentityApiService);
  private readonly selfApi = inject(PlayerSelfApiService);
  private readonly bunkerApi = inject(BunkerApiService);
  private readonly authApi = inject(PlayerAuthApiService);

  protected readonly steamLoginUrl = this.authApi.steamLoginUrl;
  protected readonly steamLinkUrl = this.authApi.steamLinkUrl;

  protected readonly logoutPending = signal(false);
  protected readonly logoutFailed = signal(false);

  protected readonly isEditingProfile = signal(false);
  protected readonly savePending = signal(false);
  protected readonly saveError = signal<MappedProfileError | null>(null);
  protected readonly successNotice = signal<string | null>(null);
  protected readonly updatedProfile = signal<PlayerProfile | null>(null);

  private readonly reload$ = new BehaviorSubject<PlayerAreaReloadAction>('load');

  protected readonly vm$: Observable<PlayerAreaVm> = this.reload$.pipe(
    switchMap((action) => this.loadVm(action)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected startEditProfile(): void {
    this.saveError.set(null);
    this.successNotice.set(null);
    this.isEditingProfile.set(true);
  }

  protected cancelEditProfile(): void {
    this.saveError.set(null);
    this.isEditingProfile.set(false);
  }

  protected clearProfileSaveError(): void {
    if (this.saveError()) {
      this.saveError.set(null);
    }
  }

  protected onSaveProfile(patch: PlayerProfilePatch): void {
    if (this.savePending()) {
      return;
    }

    this.savePending.set(true);
    this.saveError.set(null);

    this.selfApi.updateProfile(patch).subscribe({
      next: (updated) => {
        this.updatedProfile.set(updated);
        this.isEditingProfile.set(false);
        this.savePending.set(false);
        this.successNotice.set('Perfil atualizado.');
      },
      error: (error: unknown) => {
        this.savePending.set(false);
        const mapped = mapPlayerProfileServerError(error);

        if (mapped.code === 'unauthorized') {
          this.isEditingProfile.set(false);
          this.updatedProfile.set(null);
          this.successNotice.set(null);
          this.saveError.set(null);
          this.reload$.next('signed-out');
          return;
        }

        this.saveError.set(mapped);
      },
    });
  }

  protected preferredRoleLabel(role: PreferredRole | null): string {
    if (!role) return '—';
    const found = PREFERRED_ROLES.find((r) => r.key === role);
    return found ? found.label : role;
  }

  protected preferredMapLabel(map: PreferredMap | null): string {
    if (!map) return '—';
    const found = PREFERRED_MAPS.find((m) => m.key === map);
    return found ? found.label : map;
  }

  protected async logout(): Promise<void> {
    if (this.logoutPending()) {
      return;
    }

    this.logoutPending.set(true);
    this.logoutFailed.set(false);

    try {
      await firstValueFrom(this.authApi.logout());
      this.reload$.next('signed-out');
    } catch {
      this.logoutFailed.set(true);
    } finally {
      this.logoutPending.set(false);
    }
  }

  protected profileVisibilityLabel(visibility: PlayerProfileVisibility): string {
    return visibility === 'public' ? 'Visível para membros HSC' : 'Privado';
  }

  protected membershipLabel(membership: PlayerMembership | null): string {
    if (!membership) {
      return 'Sem associação HSC';
    }

    const labels: Record<PlayerMembershipStatus, string> = {
      inactive: 'Associação inativa',
      active: 'Associação ativa',
      suspended: 'Associação suspensa',
      expired: 'Associação expirada',
      cancelled: 'Associação cancelada',
    };

    return labels[membership.status];
  }

  protected membershipTone(membership: PlayerMembership | null): StatusBadgeVariant {
    if (!membership) {
      return 'neutral';
    }

    const tones: Record<PlayerMembershipStatus, StatusBadgeVariant> = {
      inactive: 'neutral',
      active: 'success',
      suspended: 'warning',
      expired: 'danger',
      cancelled: 'danger',
    };

    return tones[membership.status];
  }

  protected emailIdentityLabel(account: PlayerAccountSummary): string {
    if (!account.identities.email.linked) {
      return 'Não vinculado';
    }

    if (!account.identities.email.verified) {
      return 'Vinculado · verificação pendente';
    }

    return 'Vinculado e verificado';
  }

  protected steamIdentityLabel(account: PlayerAccountSummary): string {
    return account.identities.steam.linked ? 'Vinculada e verificada' : 'Não vinculada';
  }

  protected statsCapabilityLabel(account: PlayerAccountSummary): string {
    return account.capabilities.personalizedStats.available
      ? 'Disponíveis'
      : 'Vínculo Steam necessário';
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  protected formatDecimal(value: number | null | undefined, digits = 2): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '—';
    }

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  protected formatInteger(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '—';
    }

    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected formatRate(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '—';
    }

    const normalized = value > 1 ? value / 100 : value;

    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(normalized);
  }

  protected textOrFallback(value: string | null | undefined): string {
    return value?.trim() || '—';
  }

  private loadVm(action: PlayerAreaReloadAction): Observable<PlayerAreaVm> {
    if (action === 'signed-out') {
      return of({ state: 'unauthenticated' } satisfies PlayerAreaVm);
    }

    return this.identityApi.getCurrentIdentity().pipe(
      switchMap((identity) => {
        if (!identity) {
          return of({ state: 'unauthenticated' } satisfies PlayerAreaVm);
        }

        return forkJoin({
          account: this.selfApi.getAccount(),
          profile: this.selfApi.getProfile(),
          membership: this.selfApi.getMembership(),
        }).pipe(
          switchMap(({ account, profile, membership }) =>
            this.loadStats(account).pipe(
              map(
                ({ statsState, statsSummary }): PlayerAreaVm => ({
                  state: 'ready',
                  identity,
                  account,
                  profile,
                  membership,
                  statsState,
                  statsSummary,
                }),
              ),
            ),
          ),
        );
      }),
      startWith({ state: 'loading' } satisfies PlayerAreaVm),
      catchError((error: unknown) => of(this.errorVm(error))),
    );
  }

  private loadStats(
    account: PlayerAccountSummary,
  ): Observable<{
    statsState: PlayerAreaStatsState;
    statsSummary: BunkerSummary | null;
  }> {
    if (!account.capabilities.personalizedStats.available) {
      return of({
        statsState: 'unavailable',
        statsSummary: null,
      });
    }

    return this.bunkerApi.getSummary().pipe(
      map((statsSummary) => ({
        statsState: 'ready' as const,
        statsSummary,
      })),
      catchError(() =>
        of({
          statsState: 'error' as const,
          statsSummary: null,
        }),
      ),
    );
  }

  private errorVm(error: unknown): PlayerAreaVm {
    if (
      error instanceof HttpErrorResponse &&
      (error.status === 401 || error.status === 403)
    ) {
      return { state: 'unauthenticated' };
    }

    return { state: 'error' };
  }
}
