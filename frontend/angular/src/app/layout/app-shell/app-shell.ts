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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

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
  ],
  templateUrl: './app-shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  protected readonly isDrawerOpen = signal<boolean>(false);

  private previousActiveElement: HTMLElement | null = null;
  private previousBodyOverflow = '';

  constructor() {
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
