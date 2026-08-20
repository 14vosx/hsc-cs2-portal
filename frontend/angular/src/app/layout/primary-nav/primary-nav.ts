import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input,
} from '@angular/core';
import type { Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  LucideChartNoAxesColumnIncreasing,
  LucideCrosshair,
  LucideHouse,
  LucideMap,
  LucideNewspaper,
  LucideSwords,
  LucideTrophy,
  LucideUserRound,
} from '@lucide/angular';
import { TranslatePipe } from '@ngx-translate/core';

export type PrimaryNavOrientation = 'horizontal' | 'vertical';

export interface PrimaryNavItem {
  readonly id: string;
  readonly labelKey: string;
  readonly path: string;
  readonly icon: Type<unknown>;
}

@Component({
  selector: 'app-primary-nav',
  imports: [RouterLink, TranslatePipe, NgComponentOutlet],
  templateUrl: './primary-nav.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './primary-nav.css',
})
export class PrimaryNav {
  @Output() readonly itemSelected = new EventEmitter<void>();
  readonly orientation = input<PrimaryNavOrientation>('vertical');

  private readonly router = inject(Router);

  protected readonly navItems: readonly PrimaryNavItem[] = [
    { id: 'home', labelKey: 'nav.home', path: '/', icon: LucideHouse },
    { id: 'seasons', labelKey: 'nav.seasons', path: '/seasons', icon: LucideTrophy },
    { id: 'ranking', labelKey: 'nav.ranking', path: '/ranking', icon: LucideChartNoAxesColumnIncreasing },
    { id: 'mix', labelKey: 'nav.mix', path: '/mix', icon: LucideSwords },
    { id: 'matches', labelKey: 'nav.matches', path: '/matches', icon: LucideCrosshair },
    { id: 'maps', labelKey: 'nav.maps', path: '/maps', icon: LucideMap },
    { id: 'news', labelKey: 'nav.news', path: '/news', icon: LucideNewspaper },
    { id: 'player-area', labelKey: 'nav.playerArea', path: '/area-do-jogador', icon: LucideUserRound },
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
