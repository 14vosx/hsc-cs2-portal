import { Component, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
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

  it('renderiza um feed acessível sem duplicar markup responsivo', () => {
    expect(fixture.nativeElement.querySelector('[role="list"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.match-feed__item')).toHaveLength(2);
  });

  it('renderiza as partidas recentes preservando a ordem do input', () => {
    const rows = fixture.nativeElement.querySelectorAll('.match-feed__item');
    expect(rows.length).toBe(2);

    const matchLink1 = rows[0].querySelector('.match-feed__id').textContent.trim();
    const matchLink2 = rows[1].querySelector('.match-feed__id').textContent.trim();

    expect(matchLink1).toBe('Match #101');
    expect(matchLink2).toBe('Match #102');
  });

  it('renderiza link correto para a rota de detalhe da partida /matches/:matchId', () => {
    const link = fixture.nativeElement.querySelector('.match-feed__link') as HTMLAnchorElement;
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

    const row = fixture.nativeElement.querySelector('.match-feed__item');
    expect(row.textContent).toContain('Sem data');
    expect(row.textContent).toContain('Série não informada');
    expect(row.textContent).toContain('Time não informado');
    expect(row.textContent).toContain('— – —');
    expect(row.textContent).toContain('Sem vencedor');
  });

  it('destaca visualmente o time vencedor somente quando houver correspondência exata', () => {
    const row = fixture.nativeElement.querySelector('.match-feed__item');
    const teams = row.querySelectorAll('.match-feed__team');

    expect(teams[0].classList.contains('is-winner')).toBe(true);
    expect(teams[1].classList.contains('is-winner')).toBe(false);
    expect(teams[0].textContent).toContain('Vencedor');
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

    const winnerSpans = fixture.nativeElement.querySelectorAll('.is-winner');
    expect(winnerSpans.length).toBe(0);
  });

  it('renderiza tabela vazia sem erros quando recentMatches for array vazio', () => {
    host.testMatches = [];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.match-feed__item');
    expect(rows.length).toBe(0);
  });

  it('preserva team1 e team2 mesmo quando team2 é vencedor e diferencia os dois placares', () => {
    host.testMatches = [createMockRecentMatch(401, {
      winner: 'Team B',
      team1: { name: 'Team A', score: 0 },
      team2: { name: 'Team B', score: 1 },
      mapScore: { team1: 2, team2: 13 },
      mapNumber: 0,
    })];
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('.match-feed__item') as HTMLElement;
    const teams = row.querySelectorAll('.match-feed__team');
    const scores = row.querySelectorAll('.match-feed__map-score');
    expect(teams[0].textContent).toContain('Team A');
    expect(teams[1].textContent).toContain('Team B');
    expect(scores[0].textContent?.trim()).toBe('2');
    expect(scores[1].textContent?.trim()).toBe('13');
    expect(teams[1].classList.contains('is-winner')).toBe(true);
    expect(row.querySelector('.match-feed__footer')?.textContent).toContain('0 – 1');
    expect(row.querySelector('.match-feed__footer')?.textContent).not.toContain('Mapa');
    expect(row.textContent).not.toContain('#0');
  });

  it('preserva data inválida como texto recebido', () => {
    host.testMatches = [createMockRecentMatch(501, { endedAt: 'data-custom' })];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('data-custom');
  });

  it('não muta o array de recentMatches recebido no input', () => {
    const originalJson = JSON.stringify(host.testMatches);
    fixture.detectChanges();
    expect(JSON.stringify(host.testMatches)).toBe(originalJson);
  });
});
