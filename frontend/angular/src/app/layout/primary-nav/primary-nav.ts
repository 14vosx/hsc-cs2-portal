import { Component, EventEmitter, Output, inject, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './primary-nav.css',
})
export class PrimaryNav {
  @Output() readonly itemSelected = new EventEmitter<void>();

  private readonly router = inject(Router);

  protected readonly navItems: readonly PrimaryNavItem[] = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'seasons', label: 'Temporadas', path: '/seasons' },
    { id: 'ranking', label: 'Ranking', path: '/ranking' },
    { id: 'matches', label: 'Partidas', path: '/matches' },
    { id: 'maps', label: 'Mapas', path: '/maps' },
    { id: 'news', label: 'News', path: '/news' },
    { id: 'player-area', label: 'Área do Jogador', path: '/area-do-jogador' },
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
