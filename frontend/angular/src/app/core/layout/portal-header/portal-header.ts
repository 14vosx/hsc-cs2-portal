import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface PortalNavItem {
  label: string;
  path?: string;
}

@Component({
  selector: 'app-portal-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.css',
})
export class PortalHeader {
  protected readonly navItems: PortalNavItem[] = [
    { label: 'Visão Geral', path: '/' },
    { label: 'Ranking', path: '/ranking' },
    { label: 'Partidas', path: '/matches' },
    { label: 'Mapas' },
    { label: 'News' },
  ];
}
