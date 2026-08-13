import { AsyncPipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  throwError,
} from 'rxjs';

import { BunkerApiService } from '../bunker/data-access/bunker-api.service';
import type { BunkerSummary } from '../bunker/domain/bunker.model';
import { PlayerAuthApiService } from '../player/data-access/player-auth-api.service';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import { PlayerSelfApiService } from '../player/data-access/player-self-api.service';
import { PlayerServerAccessApiService } from '../player/data-access/player-server-access-api.service';
import type { PlayerServerAccess } from '../player/domain/player-server-access.model';
import {
  mapPlayerProfileServerError,
  type MappedProfileError,
} from './player-profile-update-error';
import { mapPlayerProfileMediaError } from './player-profile-media-error';
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
import { PlayerProfileMediaEditor } from './player-profile-media-editor/player-profile-media-editor';
import { PlayerEmailAuthPanel } from '../player-auth/player-email-auth-panel/player-email-auth-panel';
import { PlayerAccountSecurityPanel } from '../player-account-security/player-account-security-panel/player-account-security-panel';
import type { PlayerCs2StatsState } from '../player-cs2-readiness/player-cs2-readiness-panel/player-cs2-readiness-panel';
import type { PlayerServerAccessLoadState } from '../player-server-access/player-server-access-panel/player-server-access-panel';
import { presentServerAccess } from '../player-server-access/player-server-access-presentation';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { UiCard } from '../../shared/components/card/card';
import { PlayerAvatar } from '../../shared/components/player-avatar/player-avatar';
import { PlayerSessionService } from '../../core/session/player-session.service';
import {
  StatusBadge,
  type StatusBadgeVariant,
} from '../../shared/components/status-badge/status-badge';

interface PlayerAreaReadyVm {
  readonly state: 'ready';
  readonly identity: PlayerIdentity;
  readonly account: PlayerAccountSummary;
  readonly profile: PlayerProfile;
  readonly membership: PlayerMembership | null;
  readonly serverAccessState: PlayerServerAccessLoadState;
  readonly serverAccess: PlayerServerAccess | null;
  readonly statsState: PlayerCs2StatsState;
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
    PlayerProfileMediaEditor,
    PlayerEmailAuthPanel,
    PlayerAccountSecurityPanel,
    PlayerAvatar,
    TranslatePipe,
  ],
  templateUrl: './player-area-page.html',
  styleUrl: './player-area-page.css',
})
export class PlayerAreaPage implements OnInit {
  private readonly identityApi = inject(PlayerIdentityApiService);
  private readonly selfApi = inject(PlayerSelfApiService);
  private readonly bunkerApi = inject(BunkerApiService);
  private readonly authApi = inject(PlayerAuthApiService);
  private readonly serverAccessApi = inject(PlayerServerAccessApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerSession = inject(PlayerSessionService);

  protected readonly steamLoginUrl = this.authApi.steamLoginUrl;
  protected readonly steamLinkUrl = this.authApi.steamLinkUrl;

  protected readonly logoutPending = signal(false);
  protected readonly logoutFailed = signal(false);
  protected readonly settingsOpen = signal(false);

  protected readonly isEditingProfile = signal(false);
  protected readonly savePending = signal(false);
  protected readonly saveError = signal<MappedProfileError | null>(null);
  protected readonly successNotice = signal<string | null>(null);
  protected readonly steamLinkNoticeKey = signal<string | null>(null);
  protected readonly updatedProfile = signal<PlayerProfile | null>(null);
  protected readonly avatarPending = signal(false);
  protected readonly bannerPending = signal(false);
  protected readonly avatarError = signal<string | null>(null);
  protected readonly bannerError = signal<string | null>(null);

  private readonly reload$ = new BehaviorSubject<PlayerAreaReloadAction>('load');

  protected readonly vm$: Observable<PlayerAreaVm> = this.reload$.pipe(
    switchMap((action) => this.loadVm(action)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    this.playerSession.signedOut$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleSuccessfulLogout(this.logoutPending()));
  }

  ngOnInit(): void {
    if (
      this.route.snapshot.fragment === 'perfil' ||
      this.route.snapshot.fragment === 'conta-seguranca'
    ) {
      this.settingsOpen.set(true);
    }

    const result = this.route.snapshot.queryParamMap.get('steamLink');
    if (result === null) return;
    const noticeKey = steamLinkResultKey(result);
    if (noticeKey) this.steamLinkNoticeKey.set(noticeKey);
    const queryParams = { ...this.route.snapshot.queryParams };
    delete queryParams['steamLink'];
    const query = new URLSearchParams(queryParams).toString();
    this.location.replaceState('/area-do-jogador', query);
    if (result === 'success') this.reload$.next('load');
  }

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
        this.successNotice.set('playerArea.notices.profileUpdated');
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

  protected onAvatarUpload(file: File): void {
    if (this.avatarPending()) {
      return;
    }

    this.avatarPending.set(true);
    this.avatarError.set(null);
    this.successNotice.set(null);

    this.selfApi.uploadAvatar(file).subscribe({
      next: (profile) => {
        this.updatedProfile.set(profile);
        this.avatarPending.set(false);
        this.successNotice.set('playerArea.notices.avatarUpdated');
      },
      error: (error: unknown) => {
        this.avatarPending.set(false);
        this.handleMediaError(error, this.avatarError);
      },
    });
  }

  protected onAvatarRemove(): void {
    if (this.avatarPending()) {
      return;
    }

    this.avatarPending.set(true);
    this.avatarError.set(null);
    this.successNotice.set(null);

    this.selfApi.removeAvatar().subscribe({
      next: (profile) => {
        this.updatedProfile.set(profile);
        this.avatarPending.set(false);
        this.successNotice.set('playerArea.notices.avatarRemoved');
      },
      error: (error: unknown) => {
        this.avatarPending.set(false);
        this.handleMediaError(error, this.avatarError);
      },
    });
  }

  protected onBannerUpload(file: File): void {
    if (this.bannerPending()) {
      return;
    }

    this.bannerPending.set(true);
    this.bannerError.set(null);
    this.successNotice.set(null);

    this.selfApi.uploadBanner(file).subscribe({
      next: (profile) => {
        this.updatedProfile.set(profile);
        this.bannerPending.set(false);
        this.successNotice.set('playerArea.notices.bannerUpdated');
      },
      error: (error: unknown) => {
        this.bannerPending.set(false);
        this.handleMediaError(error, this.bannerError);
      },
    });
  }

  protected onBannerRemove(): void {
    if (this.bannerPending()) {
      return;
    }

    this.bannerPending.set(true);
    this.bannerError.set(null);
    this.successNotice.set(null);

    this.selfApi.removeBanner().subscribe({
      next: (profile) => {
        this.updatedProfile.set(profile);
        this.bannerPending.set(false);
        this.successNotice.set('playerArea.notices.bannerRemoved');
      },
      error: (error: unknown) => {
        this.bannerPending.set(false);
        this.handleMediaError(error, this.bannerError);
      },
    });
  }

  protected clearMediaErrors(): void {
    this.avatarError.set(null);
    this.bannerError.set(null);
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

  protected logout(): void {
    if (this.logoutPending()) {
      return;
    }

    this.logoutPending.set(true);
    this.logoutFailed.set(false);

    this.playerSession.logout(undefined, () => {
      this.logoutFailed.set(true);
      this.logoutPending.set(false);
    });
  }

  protected onEmailAuthenticated(): void {
    this.playerSession.load(() => this.reload$.next('load'));
  }

  protected toggleSettings(): void {
    this.settingsOpen.update((open) => !open);
  }

  protected serverAccessLabel(
    access: PlayerServerAccess | null,
    state: PlayerServerAccessLoadState,
  ): string {
    return presentServerAccess(access, state === 'ready').status;
  }

  protected serverAccessAuthorized(
    access: PlayerServerAccess | null,
    state: PlayerServerAccessLoadState,
  ): boolean {
    return presentServerAccess(access, state === 'ready').authorized;
  }

  protected profileVisibilityLabel(visibility: PlayerProfileVisibility): string {
    return visibility === 'public'
      ? 'playerArea.profile.visibility.public'
      : 'playerArea.profile.visibility.private';
  }

  protected membershipLabel(membership: PlayerMembership | null): string {
    if (!membership) {
      return 'playerArea.membership.status.none';
    }

    const labels: Record<PlayerMembershipStatus, string> = {
      inactive: 'playerArea.membership.status.inactive',
      active: 'playerArea.membership.status.active',
      suspended: 'playerArea.membership.status.suspended',
      expired: 'playerArea.membership.status.expired',
      cancelled: 'playerArea.membership.status.cancelled',
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
      return 'playerArea.account.email.notLinked';
    }

    if (!account.identities.email.verified) {
      return 'playerArea.account.email.pendingVerification';
    }

    return 'playerArea.account.email.verified';
  }

  protected statsCapabilityLabel(account: PlayerAccountSummary): string {
    return account.capabilities.personalizedStats.available
      ? 'playerArea.competitive.available'
      : 'playerArea.competitive.steamRequired';
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

  protected formatDateTime(value: string | null | undefined): string {
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected formatInteger(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '—';
    }

    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected registeredMapsKey(value: number): string {
    return value === 1
      ? 'playerArea.competitive.registeredMaps.one'
      : 'playerArea.competitive.registeredMaps.other';
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

  private handleMediaError(
    error: unknown,
    target: { set(value: string | null): void },
  ): void {
    const mapped = mapPlayerProfileMediaError(error);

    if (mapped.unauthorized) {
      this.avatarPending.set(false);
      this.bannerPending.set(false);
      this.clearMediaErrors();
      this.updatedProfile.set(null);
      this.successNotice.set(null);
      this.reload$.next('signed-out');
      return;
    }

    target.set(mapped.message);
  }

  private handleSuccessfulLogout(navigate: boolean): void {
    this.settingsOpen.set(false);
    this.logoutPending.set(false);
    this.logoutFailed.set(false);
    this.isEditingProfile.set(false);
    this.savePending.set(false);
    this.saveError.set(null);
    this.successNotice.set(null);
    this.steamLinkNoticeKey.set(null);
    this.updatedProfile.set(null);
    this.avatarPending.set(false);
    this.bannerPending.set(false);
    this.clearMediaErrors();
    this.reload$.next('signed-out');

    if (navigate) {
      void this.router.navigateByUrl('/area-do-jogador', { replaceUrl: true });
    }
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

        this.syncGlobalSession();

        return forkJoin({
          account: this.selfApi.getAccount(),
          profile: this.selfApi.getProfile(),
          membership: this.selfApi.getMembership(),
          serverAccessResult: this.loadServerAccess(),
        }).pipe(
          switchMap(({ account, profile, membership, serverAccessResult }) =>
            this.loadStats(account).pipe(
              map(
                ({ statsState, statsSummary }): PlayerAreaVm => ({
                  state: 'ready',
                  identity,
                  account,
                  profile,
                  membership,
                  serverAccessState: serverAccessResult.state,
                  serverAccess: serverAccessResult.access,
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
    statsState: PlayerCs2StatsState;
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

  private syncGlobalSession(): void {
    const status = this.playerSession.state().status;
    if (status === 'anonymous' || status === 'unavailable') {
      this.playerSession.load();
    }
  }

  private loadServerAccess(): Observable<{
    state: PlayerServerAccessLoadState;
    access: PlayerServerAccess | null;
  }> {
    return this.serverAccessApi.getServerAccess().pipe(
      map((access) => ({ state: 'ready' as const, access })),
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          (error.status === 401 || error.status === 403)
        ) {
          return throwError(() => error);
        }
        return of({ state: 'unavailable' as const, access: null });
      }),
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

function steamLinkResultKey(result: string | null): string | null {
  const keys: Record<string, string> = {
    success: 'playerArea.steamLink.results.success',
    identity_conflict: 'playerArea.steamLink.results.identityConflict',
    already_linked: 'playerArea.steamLink.results.alreadyLinked',
    unavailable: 'playerArea.steamLink.results.unavailable',
    failed: 'playerArea.steamLink.results.failed',
  };
  return result ? keys[result] ?? null : null;
}
