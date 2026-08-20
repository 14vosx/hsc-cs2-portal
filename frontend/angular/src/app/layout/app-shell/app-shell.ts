import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, filter, of, switchMap, tap } from 'rxjs';
import { PlayerMembershipApiService } from '../../core/membership/player-membership-api.service';
import { PlayerSessionService } from '../../core/session/player-session.service';
import { PortalThemeService } from '../../core/theme/portal-theme.service';

import { AppFooter } from '../app-footer/app-footer';
import { AppHeader } from '../app-header/app-header';
import { AppSidebar } from '../app-sidebar/app-sidebar';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    AppHeader,
    AppSidebar,
    AppFooter,
    CdkTrapFocus,
    TranslatePipe,
  ],
  templateUrl: './app-shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);
  protected readonly playerSession = inject(PlayerSessionService);
  private readonly membershipApi = inject(PlayerMembershipApiService);
  private readonly portalTheme = inject(PortalThemeService);

  protected readonly isDrawerOpen = signal<boolean>(false);
  protected readonly canSelectTheme = signal(false);

  private previousActiveElement: HTMLElement | null = null;
  private previousBodyOverflow = '';

  constructor() {
    toObservable(this.playerSession.state)
      .pipe(
        tap(() => {
          this.canSelectTheme.set(false);
          this.portalTheme.applyDefaultTheme();
        }),
        switchMap((session) =>
          session.status === 'authenticated'
            ? this.membershipApi.getMembership().pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((membership) => {
        const canSelectTheme = membership?.status === 'active';
        this.canSelectTheme.set(canSelectTheme);

        if (canSelectTheme) {
          this.portalTheme.restorePreference();
        } else {
          this.portalTheme.applyDefaultTheme();
        }
      });

    this.playerSession.load();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.isDrawerOpen()) {
          this.closeDrawer();
        }
      });

    this.destroyRef.onDestroy(() => {
      this.restoreScroll();
    });
  }

  @HostListener('window:keydown.escape')
  protected onEscape(): void {
    if (this.isDrawerOpen()) {
      this.closeDrawer();
    }
  }

  protected toggleDrawer(): void {
    if (this.isDrawerOpen()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  protected logout(): void {
    this.portalTheme.applyDefaultTheme();
    this.playerSession.logout(() => {
      void this.router.navigateByUrl('/area-do-jogador', { replaceUrl: true });
    });
  }

  protected openDrawer(): void {
    this.previousActiveElement = document.activeElement as HTMLElement | null;
    if (typeof document !== 'undefined') {
      this.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    this.isDrawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.restoreScroll();

    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  private restoreScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.previousBodyOverflow;
    }
  }
}
