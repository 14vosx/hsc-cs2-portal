import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import type {
  CompetitiveMatchSnapshot,
  MatchRoomParticipant,
} from '../../domain/match-room.model';
import { MatchRoomCompetitivePanel } from './match-room-competitive-panel';

function createParticipant(id: string, name: string | null): MatchRoomParticipant {
  return {
    playerAccountId: id,
    player: name
      ? {
        steam: {
          steamId64: `7656119800000000${id}`,
          personaname: name,
          avatarMediumUrl: `https://avatars.steamstatic.com/${id}.jpg`,
        },
        profile: { slug: `slug-${id}` },
      }
      : null,
    joinedAt: '2026-08-17T20:00:00Z',
    confirmation: { confirmed: true, confirmedAt: '2026-08-17T20:01:00Z' },
  };
}

function createCompetitiveMatch(): CompetitiveMatchSnapshot {
  return {
    id: 'match-101',
    runtimeMatchId: 101,
    map: {
      poolId: 'pool-1',
      poolKey: 'active-pool',
      poolVersion: 1,
      key: 'de_mirage',
      displayName: 'Mirage',
    },
    roster: [
      { playerAccountId: 'p1', steamid64: '76561198000000001', team: 'A' },
      { playerAccountId: 'p2', steamid64: '76561198000000002', team: 'A' },
      { playerAccountId: 'p3', steamid64: '76561198000000003', team: 'B' },
      { playerAccountId: 'p4', steamid64: '76561198000000004', team: 'B' },
    ],
  };
}

const TRANSLATIONS = {
  mix: {
    statuses: {
      READY: 'PRONTO',
      PROVISIONING: 'INICIANDO',
    },
    competitive: {
      readyTitle: 'PARTIDA DEFINIDA',
      provisioningTitle: 'PREPARANDO SERVIDOR',
      readyDesc: 'Times e mapa definidos.',
      readySubDesc: 'Preparando próxima etapa.',
      provisioningDesc: 'A configuração da partida está concluída. O servidor está sendo preparado.',
      autoUpdateNotice: 'Esta página será atualizada automaticamente.',
      readyFallback: 'Finalizando os dados da partida.',
      provisioningFallback: 'Preparando os dados da partida.',
      mapSelected: 'MAPA DEFINIDO',
      teamA: 'TIME A',
      teamB: 'TIME B',
      players: 'jogadores',
    },
  },
  shared: {
    playerAvatar: { alt: 'Avatar de {{displayName}}' },
  },
};

describe('MatchRoomCompetitivePanel', () => {
  let fixture: ComponentFixture<MatchRoomCompetitivePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchRoomCompetitivePanel],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    translate.use('pt-BR');
  });

  function setup(
    competitiveMatch: CompetitiveMatchSnapshot | null,
    participants: MatchRoomParticipant[],
    status: 'READY' | 'PROVISIONING',
  ): ComponentFixture<MatchRoomCompetitivePanel> {
    const fix = TestBed.createComponent(MatchRoomCompetitivePanel);
    fix.componentRef.setInput('competitiveMatch', competitiveMatch);
    fix.componentRef.setInput('participants', participants);
    fix.componentRef.setInput('status', status);
    fix.detectChanges();
    return fix;
  }

  it('1. READY renderiza mapa final com displayName e key', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'READY');

    expect(fixture.nativeElement.textContent).toContain('Mirage');
    expect(fixture.nativeElement.textContent).toContain('de_mirage');
  });

  it('2. READY renderiza Team A e Team B a partir de competitiveMatch.roster', () => {
    const match = createCompetitiveMatch();
    const participants = [
      createParticipant('p1', 'Player One'),
      createParticipant('p2', 'Player Two'),
      createParticipant('p3', 'Player Three'),
      createParticipant('p4', 'Player Four'),
    ];

    fixture = setup(match, participants, 'READY');

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('TIME A');
    expect(content).toContain('TIME B');
    expect(content).toContain('Player One');
    expect(content).toContain('Player Two');
    expect(content).toContain('Player Three');
    expect(content).toContain('Player Four');
  });

  it('3. apresentação do jogador é resolvida por playerAccountId', () => {
    const match = createCompetitiveMatch();
    const participants = [
      createParticipant('p1', 'Fallen'),
      createParticipant('p2', 'fer'),
      createParticipant('p3', 'coldzera'),
      createParticipant('p4', 'TACO'),
    ];

    fixture = setup(match, participants, 'READY');

    const teamACol = fixture.nativeElement.querySelector('.competitive-team-col--a');
    const teamBCol = fixture.nativeElement.querySelector('.competitive-team-col--b');

    expect(teamACol.textContent).toContain('Fallen');
    expect(teamACol.textContent).toContain('fer');
    expect(teamBCol.textContent).toContain('coldzera');
    expect(teamBCol.textContent).toContain('TACO');
  });

  it('4. Team A/B não é apresentado como CT/T ou Counter-Terrorist/Terrorist', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'READY');

    const host = fixture.nativeElement as HTMLElement;
    const teamTitles = Array.from(
      host.querySelectorAll<HTMLElement>('.competitive-team-col__title'),
    ).map((el) => (el.textContent ?? '').trim());

    expect(teamTitles).toContain('TIME A');
    expect(teamTitles).toContain('TIME B');

    expect(teamTitles).not.toContain('CT');
    expect(teamTitles).not.toContain('TR');
    expect(teamTitles).not.toContain('Counter-Terrorist');
    expect(teamTitles).not.toContain('Terrorist');
  });

  it('5. PROVISIONING mantém mapa e roster visíveis', () => {
    const match = createCompetitiveMatch();
    const participants = [
      createParticipant('p1', 'Player One'),
      createParticipant('p3', 'Player Three'),
    ];

    fixture = setup(match, participants, 'PROVISIONING');

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mirage');
    expect(text).toContain('TIME A');
    expect(text).toContain('TIME B');
    expect(text).toContain('Player One');
    expect(text).toContain('Player Three');
  });

  it('6. PROVISIONING mostra estado "preparando servidor" e aviso de atualização automática', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'PROVISIONING');

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PREPARANDO SERVIDOR');
    expect(text).toContain('A configuração da partida está concluída. O servidor está sendo preparado.');
    expect(text).toContain('Esta página será atualizada automaticamente.');
  });

  it('7. não existe CTA de conexão', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'READY');

    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(0);

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('ENTRAR NO SERVIDOR');
    expect(text).not.toContain('Conectar');
  });

  it('8. não exibe IP/porta/senha/connect string', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'PROVISIONING');

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('connect ');
    expect(text).not.toContain('127.0.0.1');
    expect(text).not.toContain('password');
  });

  it('9. fallback de apresentação funciona como "Jogador HSC" quando participant.player === null', () => {
    const match = createCompetitiveMatch();
    const participants = [
      createParticipant('p1', null), // player is null
    ];

    fixture = setup(match, participants, 'READY');

    expect(fixture.nativeElement.textContent).toContain('Jogador HSC');
  });

  it('10. competitiveMatch null exibe fallback seguro sem quebrar no READY e PROVISIONING', () => {
    const fixtureReady = setup(null, [], 'READY');
    expect(fixtureReady.nativeElement.textContent).toContain('Finalizando os dados da partida.');

    const fixtureProv = setup(null, [], 'PROVISIONING');
    expect(fixtureProv.nativeElement.textContent).toContain('Preparando os dados da partida.');
  });
});
