import { Component, EventEmitter, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface PrimaryNavItem {
  readonly id: string;
  readonly labelKey: string;
  readonly path: string;
}

@Component({
  selector: 'app-primary-nav',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './primary-nav.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './primary-nav.css',
})
export class PrimaryNav {
  @Output() readonly itemSelected = new EventEmitter<void>();

  private readonly router = inject(Router);

  protected readonly navItems: readonly PrimaryNavItem[] = [
    { id: 'home', labelKey: 'nav.home', path: '/' },
    { id: 'seasons', labelKey: 'nav.seasons', path: '/seasons' },
    { id: 'ranking', labelKey: 'nav.ranking', path: '/ranking' },
    { id: 'matches', labelKey: 'nav.matches', path: '/matches' },
    { id: 'maps', labelKey: 'nav.maps', path: '/maps' },
    { id: 'news', labelKey: 'nav.news', path: '/news' },
    { id: 'player-area', labelKey: 'nav.playerArea', path: '/area-do-jogador' },
  ];

  protected isActive(item: PrimaryNavItem): boolean {
    const url = this.router.url.split(/[?#]/)[0];

    if (item.id === 'home') {
      return url === '/';
    }

    if (item.id === 'seasons') {
      return url === '/seasons' || url.startsWith('/seasons/');
    }

    if (item.id === 'ranking') {
      return url === '/ranking' || url.startsWith('/ranking/');
    }

    return url === item.path || url.startsWith(`${item.path}/`);
  }

  protected onLinkClick(): void {
    this.itemSelected.emit();
  }
}
