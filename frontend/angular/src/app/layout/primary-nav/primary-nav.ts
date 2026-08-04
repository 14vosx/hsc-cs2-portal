import { Component, EventEmitter, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

export interface PrimaryNavItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

@Component({
  selector: 'app-primary-nav',
  imports: [RouterLink],
  templateUrl: './primary-nav.html',
  styleUrl: './primary-nav.css',
})
export class PrimaryNav {
  @Output() readonly itemSelected = new EventEmitter<void>();

  constructor(private readonly router: Router) {}

  protected readonly navItems: readonly PrimaryNavItem[] = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'seasons', label: 'Temporadas', path: '/seasons/current' },
    { id: 'ranking', label: 'Ranking', path: '/seasons/current/ranking' },
    { id: 'matches', label: 'Partidas', path: '/matches' },
    { id: 'maps', label: 'Mapas', path: '/maps' },
    { id: 'news', label: 'News', path: '/news' },
    { id: 'bunker', label: 'Bunker', path: '/bunker' },
  ];

  protected isActive(item: PrimaryNavItem): boolean {
    const url = this.router.url.split(/[?#]/)[0];

    if (item.id === 'home') {
      return url === '/';
    }

    if (item.id === 'seasons') {
      return url === '/seasons' || (/^\/seasons\/[^/]+$/.test(url) && !url.endsWith('/ranking'));
    }

    if (item.id === 'ranking') {
      return url === '/ranking' || /^\/seasons\/[^/]+\/ranking$/.test(url);
    }

    return url === item.path || url.startsWith(`${item.path}/`);
  }

  protected onLinkClick(): void {
    this.itemSelected.emit();
  }
}
