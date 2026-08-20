import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  CompetitiveMatchSnapshot,
  MatchRoomParticipant,
  MatchRoomViewerJoin,
} from '../../domain/match-room.model';
import {
  CompetitivePanelStatus,
  MatchRoomCompetitivePanel,
} from './match-room-competitive-panel';



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
      JOINABLE: 'Servidor pronto',
      FAILED: 'Partida falhou',
    },
    competitive: {
      readyTitle: 'PARTIDA DEFINIDA',
      provisioningTitle: 'PREPARANDO SERVIDOR',
      joinableTitle: 'SERVIDOR PRONTO',
      failedTitle: 'PARTIDA NÃO PÔDE SER PREPARADA',
      readyDesc: 'Times e mapa definidos.',
      readySubDesc: 'Preparando próxima etapa.',
      provisioningDesc: 'A configuração da partida está concluída. O servidor está sendo preparado.',
      joinableDesc: 'O servidor de jogo está pronto para a conexão.',
      failedDesc: 'Não foi possível preparar o servidor de jogo para esta partida.',
      autoUpdateNotice: 'Esta página será atualizada automaticamente.',
      readyFallback: 'Finalizando os dados da partida.',
      provisioningFallback: 'Preparando os dados da partida.',
      mapSelected: 'MAPA DEFINIDO',
      teamA: 'TIME A',
      teamB: 'TIME B',
      players: 'jogadores',
      joinServer: 'ENTRAR NO SERVIDOR',
      copyConnection: 'COPIAR CONEXÃO',
      copied: 'COPIADO',
      backToLobbies: 'VOLTAR AOS LOBBIES',
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
    status: CompetitivePanelStatus,
    canJoinServer = false,
    join: MatchRoomViewerJoin | null = null,
    copySuccess = false,
  ): ComponentFixture<MatchRoomCompetitivePanel> {
    const fix = TestBed.createComponent(MatchRoomCompetitivePanel);
    fix.componentRef.setInput('competitiveMatch', competitiveMatch);
    fix.componentRef.setInput('participants', participants);
    fix.componentRef.setInput('status', status);
    fix.componentRef.setInput('canJoinServer', canJoinServer);
    fix.componentRef.setInput('join', join);
    fix.componentRef.setInput('copySuccess', copySuccess);
    fix.detectChanges();
    return fix;
  }

  it('1. READY renderiza mapa final com displayName e key', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'READY');

    expect(fixture.nativeElement.textContent).toContain('Mirage');
    expect(fixture.nativeElement.textContent).toContain('de_mirage');
  });

  it('2. PROVISIONING mostra estado "preparando servidor" e aviso de atualização automática', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'PROVISIONING');

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PREPARANDO SERVIDOR');
    expect(text).toContain('A configuração da partida está concluída. O servidor está sendo preparado.');
    expect(text).toContain('Esta página será atualizada automaticamente.');
  });

  it('3. JOINABLE com canJoinServer=true exibe referência literal, botão de cópia e CTA de conexão', () => {
    const match = createCompetitiveMatch();
    const join: MatchRoomViewerJoin = {
      serverKey: 'srv-101',
      reference: 'connect 127.0.0.1:27015',
      launchUri: 'steam://connect/127.0.0.1:27015',
    };
    fixture = setup(match, [], 'JOINABLE', true, join);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('connect 127.0.0.1:27015');
    expect(text).toContain('COPIAR CONEXÃO');
    expect(text).toContain('ENTRAR NO SERVIDOR');

    const ctaLink = fixture.nativeElement.querySelector('a[href="steam://connect/127.0.0.1:27015"]');
    expect(ctaLink).not.toBeNull();
  });

  it('4. clicar em copiar conexão emite output copyConnection com reference literal', () => {
    const match = createCompetitiveMatch();
    const join: MatchRoomViewerJoin = {
      serverKey: 'srv-101',
      reference: 'connect 127.0.0.1:27015',
      launchUri: 'steam://connect/127.0.0.1:27015',
    };
    fixture = setup(match, [], 'JOINABLE', true, join);

    const copySpy = vi.fn();
    fixture.componentInstance.copyConnection.subscribe(copySpy);

    const btn = fixture.nativeElement.querySelector('button');
    btn.click();

    expect(copySpy).toHaveBeenCalledWith('connect 127.0.0.1:27015');
  });

  it('5. exibe feedback visual COPIADO quando copySuccess=true', () => {
    const match = createCompetitiveMatch();
    const join: MatchRoomViewerJoin = {
      serverKey: 'srv-101',
      reference: 'connect 127.0.0.1:27015',
      launchUri: 'steam://connect/127.0.0.1:27015',
    };
    fixture = setup(match, [], 'JOINABLE', true, join, true);

    expect(fixture.nativeElement.textContent).toContain('COPIADO');
  });

  it('6. FAILED exibe mensagem de erro e CTA VOLTAR AOS LOBBIES sem detalhes de servidor', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'FAILED');

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PARTIDA NÃO PÔDE SER PREPARADA');
    expect(text).toContain('Não foi possível preparar o servidor de jogo para esta partida.');
    expect(text).toContain('VOLTAR AOS LOBBIES');

    expect(text).not.toContain('connect ');
    expect(text).not.toContain('ENTRAR NO SERVIDOR');

    const backSpy = vi.fn();
    fixture.componentInstance.backToLobbies.subscribe(backSpy);

    const btn = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(backSpy).toHaveBeenCalled();
  });

  it('7. competitiveMatch null exibe fallback seguro sem quebrar no READY e PROVISIONING', () => {
    const fixtureReady = setup(null, [], 'READY');
    expect(fixtureReady.nativeElement.textContent).toContain('Finalizando os dados da partida.');

    const fixtureProv = setup(null, [], 'PROVISIONING');
    expect(fixtureProv.nativeElement.textContent).toContain('Preparando os dados da partida.');
  });

  it('8. JOINABLE com canJoinServer=false (não autorizado) não expõe referência, botão de cópia ou CTA steam://', () => {
    const match = createCompetitiveMatch();
    fixture = setup(match, [], 'JOINABLE', false, null);

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('connect ');
    expect(text).not.toContain('COPIAR CONEXÃO');
    expect(text).not.toContain('ENTRAR NO SERVIDOR');

    const steamLink = fixture.nativeElement.querySelector('a[href^="steam://"]');
    expect(steamLink).toBeNull();
  });

  it('9. READY e PROVISIONING não expõem CTA de servidor ou referência de conexão', () => {
    const match = createCompetitiveMatch();

    const readyFix = setup(match, [], 'READY');
    expect(readyFix.nativeElement.textContent).not.toContain('COPIAR CONEXÃO');
    expect(readyFix.nativeElement.textContent).not.toContain('ENTRAR NO SERVIDOR');
    expect(readyFix.nativeElement.textContent).not.toContain('connect ');

    const provFix = setup(match, [], 'PROVISIONING');
    expect(provFix.nativeElement.textContent).not.toContain('COPIAR CONEXÃO');
    expect(provFix.nativeElement.textContent).not.toContain('ENTRAR NO SERVIDOR');
    expect(provFix.nativeElement.textContent).not.toContain('connect ');
  });
});
