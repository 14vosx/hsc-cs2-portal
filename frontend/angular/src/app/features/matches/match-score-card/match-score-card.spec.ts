import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import type { MatchSummary } from '../domain/match.model';
import { MatchScoreCard } from './match-score-card';

@Component({
  imports: [MatchScoreCard],
  template: `<app-match-score-card [match]="testMatch" [highlight]="isHighlight" [ctaText]="customCta" />`,
})
class TestHostComponent {
  testMatch: MatchSummary = {
    id: 101,
    startedAt: '2026-08-04T10:00:00Z',
    endedAt: '2026-08-04T11:00:00Z',
    winner: 'Team Alpha',
    seriesType: 'BO3',
    team1: { name: 'Team Alpha', score: 2 },
    team2: { name: 'Team Beta', score: 1 },
    serverIp: '127.0.0.1:27015',
    maps: [
      {
        mapNumber: 1,
        startedAt: '2026-08-04T10:05:00Z',
        endedAt: '2026-08-04T10:30:00Z',
        winner: 'Team Alpha',
        name: 'de_mirage',
        team1Score: 13,
        team2Score: 9,
      },
      {
        mapNumber: 2,
        startedAt: '2026-08-04T10:35:00Z',
        endedAt: '2026-08-04T11:00:00Z',
        winner: 'Team Beta',
        name: 'de_inferno',
        team1Score: 8,
        team2Score: 13,
      },
    ],
  };
  isHighlight = false;
  customCta = 'Abrir relatório e destaques →';
}

describe('MatchScoreCard', () => {
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

  it('renderiza o componente e exibe o ID da partida', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('#101');
    expect(el.textContent).toContain('Team Alpha');
    expect(el.textContent).toContain('Team Beta');
  });

  it('exibe placar do primeiro mapa quando disponível', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('13 x 9');
  });

  it('usa o placar da série como fallback quando o mapa não possui placar', () => {
    host.testMatch = {
      ...host.testMatch,
      maps: [
        {
          mapNumber: 1,
          startedAt: null,
          endedAt: null,
          winner: null,
          name: 'de_mirage',
          team1Score: null,
          team2Score: null,
        },
      ],
    };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('2 x 1');
  });

  it('exibe "— x —" quando nem mapa nem série possuem placar', () => {
    host.testMatch = {
      ...host.testMatch,
      team1: { name: 'Team Alpha', score: null },
      team2: { name: 'Team Beta', score: null },
      maps: [],
    };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('— x —');
  });

  it('trata campos nullable com fallbacks seguros', () => {
    host.testMatch = {
      id: 202,
      startedAt: null,
      endedAt: null,
      winner: null,
      seriesType: null,
      team1: { name: null, score: null },
      team2: { name: null, score: null },
      serverIp: null,
      maps: [],
    };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('#202');
    expect(el.textContent).toContain('Time não informado');
    expect(el.textContent).toContain('Sem vencedor');
    expect(el.textContent).toContain('Série não informada');
    expect(el.textContent).toContain('Sem data');
  });

  it('destaca a classe de vencedor para o time 1 quando winner coincide', () => {
    const team1El = fixture.nativeElement.querySelector('.match-card__team--1');
    expect(team1El.classList.contains('match-card__team--winner')).toBe(true);
  });

  it('destaca a classe de vencedor para o time 2 quando winner coincide', () => {
    host.testMatch = {
      ...host.testMatch,
      winner: 'Team Beta',
    };
    fixture.detectChanges();
    const team2El = fixture.nativeElement.querySelector('.match-card__team--2');
    expect(team2El.classList.contains('match-card__team--winner')).toBe(true);
  });

  it('não destaca nenhum time como vencedor quando o vencedor é desconhecido', () => {
    host.testMatch = {
      ...host.testMatch,
      winner: 'Team Unknown',
    };
    fixture.detectChanges();
    const winner1 = fixture.nativeElement.querySelector('.match-card__team--1.match-card__team--winner');
    const winner2 = fixture.nativeElement.querySelector('.match-card__team--2.match-card__team--winner');
    expect(winner1).toBeNull();
    expect(winner2).toBeNull();
  });

  it('não exibe lista expandida de mapas para partida BO1 com apenas 1 mapa', () => {
    host.testMatch = {
      ...host.testMatch,
      seriesType: 'BO1',
      maps: [
        {
          mapNumber: 1,
          startedAt: null,
          endedAt: null,
          winner: 'Team Alpha',
          name: 'de_mirage',
          team1Score: 13,
          team2Score: 9,
        },
      ],
    };
    fixture.detectChanges();
    const mapsSection = fixture.nativeElement.querySelector('.match-card__maps');
    expect(mapsSection).toBeNull();
  });

  it('preserva a ordem dos mapas na exibição de série', () => {
    const mapsLinks = fixture.nativeElement.querySelectorAll('.match-card__maps a');
    expect(mapsLinks.length).toBe(2);
    expect(mapsLinks[0].textContent).toContain('de_mirage');
    expect(mapsLinks[1].textContent).toContain('de_inferno');
  });

  it('renderiza span em vez de link quando o mapa possui name null', () => {
    host.testMatch = {
      ...host.testMatch,
      maps: [
        { mapNumber: 1, startedAt: null, endedAt: null, winner: null, name: null, team1Score: 10, team2Score: 10 },
        { mapNumber: 2, startedAt: null, endedAt: null, winner: null, name: 'de_dust2', team1Score: 13, team2Score: 5 },
      ],
    };
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.match-card__map-span');
    expect(span).not.toBeNull();
  });

  it('utiliza imagem de fundo conhecida quando disponível e "none" para mapa desconhecido', () => {
    const cardEl = fixture.nativeElement.querySelector('.match-card') as HTMLElement;
    expect(cardEl.style.getPropertyValue('--match-map-bg')).toContain('de_mirage.png');

    host.testMatch = {
      ...host.testMatch,
      maps: [{ mapNumber: 1, startedAt: null, endedAt: null, winner: null, name: 'de_custom_map', team1Score: 1, team2Score: 0 }],
    };
    fixture.detectChanges();
    expect(cardEl.style.getPropertyValue('--match-map-bg')).toBe('none');
  });

  it('não muta o objeto match recebido via input', () => {
    const originalJson = JSON.stringify(host.testMatch);
    fixture.detectChanges();
    expect(JSON.stringify(host.testMatch)).toBe(originalJson);
  });
});
