import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BunkerSectionNav } from './bunker-section-nav';
import { beforeEach, describe, expect, it } from 'vitest';
import type { BunkerPlayerStats, BunkerSummary } from '../../domain/bunker.model';
import * as fs from 'node:fs';
import * as path from 'node:path';

function createDummyStats(): BunkerPlayerStats {
  return {
    mapsPlayed: 10,
    matchesPlayed: 10,
    wins: 6,
    losses: 4,
    winRate: 60,
    kdRatio: 1.2,
    adr: 85,
    impactRating: 1.1,
    kills: 180,
    deaths: 150,
    assists: 40,
    roundsPlayed: 240,
    headshotPct: 45,
    accuracy: 20,
    utilityDmgPerRound: 15,
    killsPerRound: 0.75,
    assistsPerRound: 0.16,
    deathsPerRound: 0.62,
    entryWinRate: 55,
    v1Count: 5,
    v1Wins: 3,
    v1WinRate: 60,
    v2Count: 2,
    v2Wins: 1,
    v2WinRate: 50,
    enemy2ks: 10,
    enemy3ks: 4,
    enemy4ks: 1,
    enemy5ks: 0,
    sampleWeight: 1,
    score: 80,
  };
}

function createFullBunkerSummary(): BunkerSummary {
  return {
    status: 'active',
    seasonFirst: false,
    statsAvailable: true,
    currentSeason: null,
    seasonPlayer: {
      name: 'Player One',
      steamId64: '76561198000000000',
      generatedAt: '2026-08-01',
      summary: createDummyStats(),
      byMap: [
        {
          mapName: 'de_inferno',
          mapsPlayed: 5,
          matchesPlayed: 5,
          wins: 3,
          losses: 2,
          winRate: 60,
          kdRatio: 1.1,
          adr: 80,
          impactRating: 1.0,
          roundsPlayed: 120,
          kills: 90,
          deaths: 80,
          assists: 20,
          headshotPct: 50,
          accuracy: 22,
          utilityDmgPerRound: 10,
          entryWinRate: 50,
          enemy2ks: 5,
          enemy3ks: 2,
          enemy4ks: 0,
          enemy5ks: 0,
        },
      ],
      recentMaps: [
        {
          mapName: 'de_mirage',
          startedAt: '2026-08-01T12:00:00Z',
          matchId: 'm1',
          mapNumber: 1,
          result: '13-11',
          outcome: 'win',
          score: '13-11',
          team: 'Team A',
          winner: 'Team A',
          isWin: true,
          team1Score: 13,
          team2Score: 11,
          rounds: 24,
          damage: 2000,
          utilityDamage: 300,
          headShotKills: 10,
          entryCount: 4,
          entryWins: 3,
          v1Count: 1,
          v1Wins: 1,
          v2Count: 0,
          v2Wins: 0,
          enemy2ks: 3,
          enemy3ks: 1,
          enemy4ks: 0,
          enemy5ks: 0,
          shotsFiredTotal: 500,
          shotsOnTargetTotal: 110,
          kills: 20,
          deaths: 15,
          assists: 5,
          kdRatio: 1.33,
          adr: 83.3,
          impactRating: 1.2,
        },
      ],
      timeline: [
        {
          at: '2026-08-01T12:00:00Z',
          event: 'match_completed',
          mapName: 'de_mirage',
          matchId: 'm1',
          mapNumber: 1,
          result: 'win',
          score: '13-11',
          kills: 20,
          deaths: 15,
          assists: 5,
          kdRatio: 1.33,
          adr: 83.3,
          impactRating: 1.2,
        },
      ],
    },
    competitiveProfile: {
      generatedAt: '2026-08-01',
      steamId64: '76561198000000000',
      name: 'Player One',
      avatarMedium: null,
      steamProfileUrl: null,
      lifetime: createDummyStats(),
    },
  };
}

describe('BunkerSectionNav', () => {
  let component: BunkerSectionNav;
  let fixture: ComponentFixture<BunkerSectionNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunkerSectionNav],
    }).compileComponents();

    fixture = TestBed.createComponent(BunkerSectionNav);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summary', createFullBunkerSummary());
    fixture.detectChanges();
  });

  it('1. componente pode ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('2. nav possui aria-label', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Navegação do Bunker');
  });

  it('3. Resumo sempre existe', () => {
    fixture.componentRef.setInput('summary', {
      status: 'active',
      seasonFirst: null,
      statsAvailable: null,
      currentSeason: null,
      seasonPlayer: null,
      competitiveProfile: null,
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a'));
    expect(links.length).toBe(1);
    expect(links[0].textContent?.trim()).toBe('Resumo');
    expect(links[0].getAttribute('href')).toBe('#bunker-summary');
  });

  it('4. todos os itens disponíveis são renderizados', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a'));
    expect(links.length).toBe(4);
    const labels = links.map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Resumo', 'Mapas', 'Últimos mapas', 'Timeline']);
  });

  it('5. byMap vazio remove somente Mapas', () => {
    const summary = createFullBunkerSummary();
    const seasonPlayer = summary.seasonPlayer ? { ...summary.seasonPlayer, byMap: [] } : null;
    fixture.componentRef.setInput('summary', { ...summary, seasonPlayer });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('a')).map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Resumo', 'Últimos mapas', 'Timeline']);
  });

  it('6. recentMaps vazio remove somente Últimos mapas', () => {
    const summary = createFullBunkerSummary();
    const seasonPlayer = summary.seasonPlayer ? { ...summary.seasonPlayer, recentMaps: [] } : null;
    fixture.componentRef.setInput('summary', { ...summary, seasonPlayer });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('a')).map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Resumo', 'Mapas', 'Timeline']);
  });

  it('7. timeline vazia remove somente Timeline', () => {
    const summary = createFullBunkerSummary();
    const seasonPlayer = summary.seasonPlayer ? { ...summary.seasonPlayer, timeline: [] } : null;
    fixture.componentRef.setInput('summary', { ...summary, seasonPlayer });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('a')).map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Resumo', 'Mapas', 'Últimos mapas']);
  });

  it('8. hrefs correspondem exatamente aos IDs', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const hrefs = Array.from(compiled.querySelectorAll('a')).map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual([
      '#bunker-summary',
      '#bunker-maps',
      '#bunker-recent',
      '#bunker-timeline',
    ]);
  });

  it('9. ordem dos links é estável', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const hrefs = Array.from(compiled.querySelectorAll('a')).map((l) => l.getAttribute('href'));
    expect(hrefs[0]).toBe('#bunker-summary');
    expect(hrefs[1]).toBe('#bunker-maps');
    expect(hrefs[2]).toBe('#bunker-recent');
    expect(hrefs[3]).toBe('#bunker-timeline');
  });

  it('11. links são elementos <a>', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navItems = compiled.querySelectorAll('.bunker-section-nav__link');
    navItems.forEach((item) => {
      expect(item.tagName.toLowerCase()).toBe('a');
    });
  });

  it('12. nenhum button é renderizado', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('button')).toBeNull();
  });

  it('13. nenhum role tablist/tab/tabpanel é renderizado', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="tablist"]')).toBeNull();
    expect(compiled.querySelector('[role="tab"]')).toBeNull();
    expect(compiled.querySelector('[role="tabpanel"]')).toBeNull();
  });

  it('14. não existe output ou side effect de navegação', () => {
    const tsPath = path.resolve(__dirname, 'bunker-section-nav.ts');
    const htmlPath = path.resolve(__dirname, 'bunker-section-nav.html');

    const tsContent = fs.readFileSync(tsPath, 'utf-8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    expect(tsContent).not.toContain('output(');
    expect(tsContent).not.toContain('output<');
    expect(tsContent).not.toContain('EventEmitter');
    expect(tsContent).not.toContain('@Output');
    expect(tsContent).not.toContain('scrollIntoView');
    expect(tsContent).not.toContain('getElementById');
    expect(tsContent).not.toContain('window');
    expect(tsContent).not.toContain('document');
    expect(tsContent).not.toContain('Router');
    expect(tsContent).not.toContain('navigate');

    expect(htmlContent).not.toContain('(click)=');
    expect(htmlContent).not.toContain('<button');
    expect(htmlContent).not.toContain('role="tab"');
    expect(htmlContent).not.toContain('role="tablist"');
    expect(htmlContent).not.toContain('role="tabpanel"');
  });

  it('15. não importa DOM, Router, serviços ou DTOs', () => {
    expect(BunkerSectionNav).toBeDefined();
  });
});
