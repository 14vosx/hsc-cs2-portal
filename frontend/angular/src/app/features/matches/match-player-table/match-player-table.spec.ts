import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { MatchPlayer } from '../domain/match.model';
import { MatchPlayerTable } from './match-player-table';

const createMockPlayer = (overrides: Partial<MatchPlayer> = {}): MatchPlayer => ({
  matchId: 101,
  mapNumber: 1,
  steamId64: '76561198000000001',
  team: 'Team A',
  name: 'Fallen',
  kills: 20,
  deaths: 10,
  damage: 1800,
  assists: 5,
  enemy5Ks: 0,
  enemy4Ks: 0,
  enemy3Ks: 1,
  enemy2Ks: 2,
  utilityCount: 8,
  utilityDamage: 120,
  utilitySuccesses: 5,
  utilityEnemies: 3,
  flashCount: 10,
  flashSuccesses: 4,
  healthPointsRemovedTotal: 1800,
  healthPointsDealtTotal: 1900,
  shotsFiredTotal: 300,
  shotsOnTargetTotal: 90,
  v1Count: 1,
  v1Wins: 1,
  v2Count: 0,
  v2Wins: 0,
  entryCount: 3,
  entryWins: 2,
  equipmentValue: 35000,
  moneySaved: 8000,
  killReward: 6000,
  liveTime: 1200,
  headShotKills: 10,
  cashEarned: 25000,
  enemiesFlashed: 7,
  ...overrides,
});

@Component({
  imports: [MatchPlayerTable],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<app-match-player-table [players]="testPlayers" [roundCount]="rounds" />`,
})
class TestHostComponent {
  testPlayers: readonly MatchPlayer[] = [
    createMockPlayer({ name: 'Player B', kills: 15, damage: 1500, steamId64: '102' }),
    createMockPlayer({ name: 'Player A', kills: 25, damage: 2200, steamId64: '101' }),
    createMockPlayer({ name: 'Player C', kills: 15, damage: 1600, steamId64: '103' }),
  ];
  rounds: number | undefined = 22;
}

describe('MatchPlayerTable', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza os cabeçalhos da tabela acessíveis', () => {
    const headers = fixture.nativeElement.querySelectorAll('th');
    const texts = Array.from(headers).map((h) => (h as HTMLElement).textContent?.trim());
    expect(texts).toEqual([
      'Player',
      'K',
      'D',
      'A',
      'K/D',
      'ADR',
      'DMG',
      'HS%',
      'Entry',
      'UD',
      'Flash',
      'SteamID64',
    ]);
  });

  it('ordena os jogadores por kills desc e desempata por damage desc', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    const firstPlayerName = rows[0].querySelector('.cell-player strong').textContent.trim();
    const secondPlayerName = rows[1].querySelector('.cell-player strong').textContent.trim();
    const thirdPlayerName = rows[2].querySelector('.cell-player strong').textContent.trim();

    expect(firstPlayerName).toBe('Player A'); // 25 kills
    expect(secondPlayerName).toBe('Player C'); // 15 kills, 1600 dmg
    expect(thirdPlayerName).toBe('Player B'); // 15 kills, 1500 dmg
  });

  it('não muta a lista de jogadores recebida no input', () => {
    const originalFirstPlayerName = host.testPlayers[0].name;
    fixture.detectChanges();
    expect(host.testPlayers[0].name).toBe(originalFirstPlayerName);
  });

  it('preserva SteamID64 como string e exibe "—" quando null', () => {
    host.testPlayers = [
      createMockPlayer({ name: 'Player Safe', steamId64: '76561198000000099' }),
      createMockPlayer({ name: 'Player No ID', steamId64: null }),
    ];
    fixture.detectChanges();

    const ids = fixture.nativeElement.querySelectorAll('.cell-steamid');
    expect(ids[0].textContent.trim()).toBe('76561198000000099');
    expect(ids[1].textContent.trim()).toBe('—');
  });

  it('exibe "Sem nome" quando o nome do jogador for null ou vazio', () => {
    host.testPlayers = [createMockPlayer({ name: null })];
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('.cell-player strong');
    expect(nameEl.textContent.trim()).toBe('Sem nome');
  });

  it('calcula K/D corretamente com mortes e sem mortes', () => {
    host.testPlayers = [
      createMockPlayer({ name: 'With Deaths', kills: 20, deaths: 10 }),
      createMockPlayer({ name: 'Zero Deaths', kills: 15, deaths: 0 }),
    ];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    const kd1 = rows[0].querySelectorAll('td')[4].textContent.trim();
    const kd2 = rows[1].querySelectorAll('td')[4].textContent.trim();

    expect(kd1).toBe('2.00');
    expect(kd2).toBe('15.00');
  });

  it('calcula ADR corretamente, lidando com 0 rounds e roundCount ausente', () => {
    host.testPlayers = [createMockPlayer({ damage: 2200 })];
    host.rounds = 20;
    fixture.detectChanges();

    let adrTd = fixture.nativeElement.querySelector('tbody td:nth-child(6)');
    expect(adrTd.textContent.trim()).toBe('110.0');

    host.rounds = 0;
    fixture.detectChanges();
    adrTd = fixture.nativeElement.querySelector('tbody td:nth-child(6)');
    expect(adrTd.textContent.trim()).toBe('0.0');

    host.rounds = undefined;
    fixture.detectChanges();
    adrTd = fixture.nativeElement.querySelector('tbody td:nth-child(6)');
    expect(adrTd.textContent.trim()).toBe('—');
  });

  it('calcula HS% e Entry de forma defensiva', () => {
    host.testPlayers = [
      createMockPlayer({ kills: 10, headShotKills: 5, entryCount: 4, entryWins: 2 }),
      createMockPlayer({ kills: 0, headShotKills: 0, entryCount: 0, entryWins: 0 }),
    ];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    const hs1 = rows[0].querySelectorAll('td')[7].textContent.trim();
    const entry1 = rows[0].querySelectorAll('td')[8].textContent.trim();
    const hs2 = rows[1].querySelectorAll('td')[7].textContent.trim();
    const entry2 = rows[1].querySelectorAll('td')[8].textContent.trim();

    expect(hs1).toBe('50%');
    expect(entry1).toBe('2/4');
    expect(hs2).toBe('0%');
    expect(entry2).toBe('—');
  });

  it('renderiza tabela vazia sem erros quando players for um array vazio', () => {
    host.testPlayers = [];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });
});
