import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface PortalNavItem {
  label: string;
  path?: string;
  href?: string;
}

@Component({
  selector: 'app-portal-header',
  imports: [RouterLink],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.css',
})
export class PortalHeader {
  constructor(private readonly router: Router) {}

  protected readonly navItems: PortalNavItem[] = [
    { label: 'Portal CS2', path: '/' },
    { label: 'Temporada', path: '/seasons/current' },
    { label: 'Ranking', path: '/seasons/current/ranking' },
    { label: 'Partidas', path: '/matches' },
    { label: 'Mapas', path: '/maps' },
    { label: 'News', path: '/news' },
  ];

  protected isActive(item: PortalNavItem): boolean {
    const path = item.path;
    const url = this.router.url.split(/[?#]/)[0];

    if (!path) {
      return false;
    }

    if (path === '/') {
      return url === '/';
    }

    if (path === '/seasons/current') {
      return url === '/seasons' || /^\/seasons\/[^/]+$/.test(url);
    }

    if (path === '/seasons/current/ranking') {
      return url === '/ranking' || /^\/seasons\/[^/]+\/ranking$/.test(url);
    }

    return url === path || url.startsWith(`${path}/`);
  }
}
