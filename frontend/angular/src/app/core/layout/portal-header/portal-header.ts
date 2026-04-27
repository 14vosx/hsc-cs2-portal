import { Component } from '@angular/core';

@Component({
  selector: 'app-portal-header',
  templateUrl: './portal-header.html',
  styleUrl: './portal-header.css',
})
export class PortalHeader {
  protected readonly navItems = ['Visão Geral', 'Ranking', 'Partidas', 'Mapas', 'News'];
}