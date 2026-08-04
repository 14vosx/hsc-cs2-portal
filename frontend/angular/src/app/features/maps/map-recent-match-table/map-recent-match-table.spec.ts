import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';

import type { MapRecentMatch } from '../domain/map.model';
import { MapRecentMatchTable } from './map-recent-match-table';

const createMockRecentMatch = (id = 101, overrides: Partial<MapRecentMatch> = {}): MapRecentMatch => ({
  matchId: id,
  seriesType: 'BO3',
  endedAt: '2026-08-04T12:00:00Z',
  winner: 'Team A',
  team1: { name: 'Team A', score: 2 },
  team2: { name: 'Team B', score: 1 },
  mapNumber: 1,
  mapScore: { team1: 13, team2: 7 },
  ...overrides,
});

@Component({
  imports: [MapRecentMatchTable],
  template: `<app-map-recent-match-table [recentMatches]="testMatches" />`,
})
class TestHostComponent {
  testMatches: readonly MapRecentMatch[] = [
    createMockRecentMatch(101, { winner: 'Team A' }),
    createMockRecentMatch(102, { winner: 'Team B' }),
  ];
}

describe('MapRecentMatchTable', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza os cabeçalhos acessíveis da tabela', () => {
    const headers = fixture.nativeElement.querySelectorAll('th');
    const texts = Array.from(headers).map((h) => (h as HTMLElement).textContent?.trim());
    expect(texts).toEqual([
      'Encerrado em',
      'Match',
      'Série',
      'Times',
      'Placar da série',
      'Número do mapa',
      'Placar do mapa',
      'Vencedor',
    ]);
  });

  it('renderiza as partidas recentes preservando a ordem do input', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const matchLink1 = rows[0].querySelector('.match-link').textContent.trim();
    const matchLink2 = rows[1].querySelector('.match-link').textContent.trim();

    expect(matchLink1).toBe('#101');
    expect(matchLink2).toBe('#102');
  });

  it('renderiza link correto para a rota de detalhe da partida /matches/:matchId', () => {
    const link = fixture.nativeElement.querySelector('.match-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/matches/101');
  });

  it('trata campos nulos com fallbacks adequados sem lançar erros', () => {
    host.testMatches = [
      createMockRecentMatch(201, {
        endedAt: null,
        seriesType: null,
        winner: null,
        team1: { name: null, score: null },
        team2: { name: null, score: null },
        mapNumber: null,
        mapScore: { team1: null, team2: null },
      }),
    ];
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tbody tr');
    expect(row.textContent).toContain('Sem data');
    expect(row.textContent).toContain('Série não informada');
    expect(row.textContent).toContain('Time não informado');
    expect(row.textContent).toContain('— x —');
    expect(row.textContent).toContain('Sem vencedor');
  });

  it('destaca visualmente o time vencedor somente quando houver correspondência exata', () => {
    const row = fixture.nativeElement.querySelector('tbody tr');
    const team1Span = row.querySelectorAll('td')[3].querySelectorAll('span')[0];
    const team2Span = row.querySelectorAll('td')[3].querySelectorAll('span')[1];

    expect(team1Span.classList.contains('team--winner')).toBe(true);
    expect(team2Span.classList.contains('team--winner')).toBe(false);
  });

  it('não infere vencedor pelo placar quando winner for nulo', () => {
    host.testMatches = [
      createMockRecentMatch(301, {
        winner: null,
        team1: { name: 'Alpha', score: 16 },
        team2: { name: 'Beta', score: 0 },
      }),
    ];
    fixture.detectChanges();

    const winnerSpans = fixture.nativeElement.querySelectorAll('.team--winner');
    expect(winnerSpans.length).toBe(0);
  });

  it('renderiza tabela vazia sem erros quando recentMatches for array vazio', () => {
    host.testMatches = [];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });

  it('não muta o array de recentMatches recebido no input', () => {
    const originalJson = JSON.stringify(host.testMatches);
    fixture.detectChanges();
    expect(JSON.stringify(host.testMatches)).toBe(originalJson);
  });
});
