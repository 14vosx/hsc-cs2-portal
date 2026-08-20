import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import type { PlayerSession } from '../../core/session/player-session.model';
import { PlayerAvatar } from '../../shared/components/player-avatar/player-avatar';
import { LocaleSwitcher } from '../locale-switcher/locale-switcher';
import { PrimaryNav } from '../primary-nav/primary-nav';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslatePipe, PlayerAvatar, LocaleSwitcher, PrimaryNav],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AppHeader {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly isDrawerOpen = input(false);
  readonly session = input<PlayerSession>({ status: 'loading' });
  readonly toggleDrawer = output<void>();
  readonly logoutRequested = output<void>();
  protected readonly isAccountMenuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.isAccountMenuOpen.set(false);
    }
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    this.isAccountMenuOpen.set(false);
  }

  protected toggleAccountMenu(): void {
    this.isAccountMenuOpen.update((open) => !open);
  }

  protected closeAccountMenu(): void {
    this.isAccountMenuOpen.set(false);
  }

  protected logout(): void {
    this.closeAccountMenu();
    this.logoutRequested.emit();
  }

  protected onToggle(): void {
    this.toggleDrawer.emit();
  }
}
