import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface PortalNavItem {
  label: string;
  path?: string;
  href?: string;
}

@Component({
  selector: 'app-portal-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.css',
})
export class PortalHeader {
  protected readonly navItems: PortalNavItem[] = [
    { label: 'Portal CS2', path: '/' },
    { label: 'Ranking', path: '/ranking' },
    { label: 'Partidas', path: '/matches' },
    { label: 'Mapas', path: '/maps' },
    { label: 'News', href: '/portal/cs2/news/' },
  ];
}
