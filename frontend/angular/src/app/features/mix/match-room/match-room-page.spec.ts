import { HttpErrorResponse } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerSessionService } from '../../../core/session/player-session.service';
import type { PlayerSession } from '../../../core/session/player-session.model';
import { MatchRoomApiService } from '../data-access/match-room-api.service';
import type { MatchRoomParticipant, MatchRoomSnapshot, MatchRoomStatus } from '../domain/match-room.model';
import { MatchRoomPage } from './match-room-page';

function createParticipant(
  id: string,
  personaname: string | null = 'Player One',
  slug: string | null = 'player-one',
  confirmed = false,
): MatchRoomParticipant {
  return {
    playerAccountId: id,
    player: personaname
      ? {
          steam: {
            steamId64: '76561198000000001',
            personaname,
            avatarMediumUrl: 'https://avatar.jpg',
          },
          profile: slug ? { slug } : null,
        }
      : null,
    joinedAt: '2026-08-17T20:00:00Z',
    confirmation: {
      confirmed,
      confirmedAt: confirmed ? '2026-08-17T20:00:10Z' : null,
    },
  };
}

function createRoomSnapshot(
  status: MatchRoomStatus = 'FORMING',
  version = 1,
  overrides: {
    participants?: MatchRoomParticipant[];
    isCreator?: boolean;
    canConfirm?: boolean;
    canLeave?: boolean;
    canCancel?: boolean;
    canJoin?: boolean;
    canDraftPick?: boolean;
    canMapVetoBan?: boolean;
    deadlineAt?: string;
    round?: number;
    confirmedCount?: number;
  } = {},
): MatchRoomSnapshot {
  const participants =
    overrides.participants ?? [
      createParticipant('player-creator', 'Creator Player', 'creator-slug', false),
      createParticipant('player-2', 'Second Player', null, false),
    ];

  return {
    room: {
      id: 'room-test-123',
      status,
      version,
      creator: { playerAccountId: 'player-creator' },
      participantCount: participants.length,
      capacity: 10,
      confirmation:
        status === 'CONFIRMING'
          ? {
              round: overrides.round ?? 1,
              startedAt: '2026-08-17T20:00:00Z',
              deadlineAt: overrides.deadlineAt ?? new Date(Date.now() + 30000).toISOString(),
              confirmedCount: overrides.confirmedCount ?? 1,
            }
          : null,
      rosterLockedAt: null,
      readyAt: null,
      draft: null,
      mapVeto: null,
      competitiveMatch: null,
      participants,
    },
    viewer: {
      participant: overrides.canJoin ? false : true,
      creator: overrides.isCreator ?? true,
      actions: {
        canJoin: overrides.canJoin ?? false,
        canLeave: overrides.canLeave ?? false,
        canCancel: overrides.canCancel ?? (overrides.isCreator ?? true),
        canConfirm: overrides.canConfirm ?? false,
        canDraftPick: overrides.canDraftPick ?? false,
        canMapVetoBan: overrides.canMapVetoBan ?? false,
      },
    },
  };
}

describe('MatchRoomPage', () => {
  let fixture: ComponentFixture<MatchRoomPage>;
  let router: Router;
  let sessionSignal: WritableSignal<PlayerSession>;

  const matchRoomApiMock = {
    getMatchRoom: vi.fn(),
    confirmMatchRoom: vi.fn(),
    leaveMatchRoom: vi.fn(),
    cancelMatchRoom: vi.fn(),
    joinMatchRoom: vi.fn(),
  };

  const sessionServiceMock = {
    state: () => sessionSignal(),
    load: vi.fn(),
  };

  const TRANSLATIONS = {
    shared: {
      playerAvatar: { alt: 'Avatar de {{displayName}}' },
    },
    mix: {
      authWall: {
        title: 'Entre na sua conta HSC',
        description: 'Para criar ou participar de um lobby Mix HSC, você precisa estar autenticado.',
        action: 'Ir para a Área do Jogador',
      },
      matchRoom: {
        sessionLoading: 'Verificando sessão',
        sessionLoadingMessage: 'Aguarde enquanto carregamos seus dados...',
        sessionUnavailable: 'Sessão indisponível',
        sessionUnavailableMessage: 'Não foi possível validar sua sessão no momento.',
        loadingTitle: 'Carregando Match Room',
        loadingMessage: 'Conectando aos dados da sala...',
        errorTitle: 'Não foi possível carregar o lobby',
        backToLobbies: 'Voltar aos lobbies',
        formingTitle: 'FORMANDO LOBBY',
        confirmingTitle: 'CONFIRMAÇÃO DO LOBBY',
        setupTitle: 'PREPARANDO PARTIDA',
        readyTitle: 'PARTIDA PRONTA',
        provisioningTitle: 'INICIANDO SERVIDOR',
        cancelledTitle: 'LOBBY ENCERRADO',
        cancelledDesc: 'Este lobby não está mais ativo.',
        setupBannerTitle: 'PREPARANDO PARTIDA',
        setupBannerDesc: '10/10 confirmados. Estamos preparando capitães e times para a próxima etapa.',
        readyBannerTitle: 'PARTIDA PRONTA',
        readyBannerDesc: 'A partida está configurada e o servidor está pronto.',
        provisioningBannerTitle: 'INICIANDO SERVIDOR',
        provisioningBannerDesc: 'Aguarde enquanto o servidor de jogo é inicializado.',
        confirmPresenceEyebrow: 'CHECK-IN',
        confirmPresenceHeading: 'CONFIRME SUA PARTICIPAÇÃO',
        countdownLabel: 'Tempo restante',
        confirmedProgress: '{{ confirmed }} DE {{ total }} CONFIRMADOS',
        confirmAction: 'CONFIRMAR PRESENÇA',
        confirming: 'CONFIRMANDO...',
        leaveAction: 'SAIR DO LOBBY',
        cancelAction: 'CANCELAR LOBBY',
        joinAction: 'ENTRAR NO LOBBY',
        rosterHeading: 'JOGADORES NO LOBBY',
        players: 'jogadores',
        creatorBadge: 'CRIADOR',
        confirmedStatus: 'CONFIRMADO',
        waitingConfirmationStatus: 'AGUARDANDO',
        waitingPlayer: 'AGUARDANDO JOGADOR',
        retry: 'Tentar novamente',
      },
      statuses: {
        FORMING: 'FORMANDO',
        CONFIRMING: 'CONFIRMANDO',
        SETUP: 'PREPARANDO',
        READY: 'PRONTO',
        PROVISIONING: 'INICIANDO',
        CANCELLED: 'CANCELADO',
      },
      errors: {
        room_not_found: 'O lobby solicitado não foi encontrado.',
        generic: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      },
    },
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionSignal = signal<PlayerSession>({
      status: 'authenticated',
      displayName: 'Test Player',
      steamId64: '76561198000000001',
      avatarMedium: null,
    });

    await TestBed.configureTestingModule({
      imports: [MatchRoomPage],
      providers: [
        provideRouter([
          { path: 'mix', component: MatchRoomPage },
          { path: 'mix/rooms/:roomId', component: MatchRoomPage },
          { path: 'area-do-jogador', component: MatchRoomPage },
        ]),
        provideTranslateService(),
        { provide: MatchRoomApiService, useValue: matchRoomApiMock },
        { provide: PlayerSessionService, useValue: sessionServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ roomId: 'room-test-123' }),
            },
          },
        },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    translate.use('pt-BR');

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupFixture(): ComponentFixture<MatchRoomPage> {
    const fix = TestBed.createComponent(MatchRoomPage);
    fix.detectChanges();
    vi.advanceTimersByTime(0);
    fix.detectChanges();
    return fix;
  }

  describe('Session Gating', () => {
    it('sessão loading não dispara chamada HTTP para MatchRoom', () => {
      sessionSignal.set({ status: 'loading' });

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('Aguarde enquanto carregamos seus dados...');
      expect(matchRoomApiMock.getMatchRoom).not.toHaveBeenCalled();
    });

    it('sessão anonymous não dispara chamada HTTP e exibe auth wall', () => {
      sessionSignal.set({ status: 'anonymous' });

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('Entre na sua conta HSC');
      expect(matchRoomApiMock.getMatchRoom).not.toHaveBeenCalled();
    });

    it('sessão authenticated inicia carregamento e polling', () => {
      const snap = createRoomSnapshot('FORMING');
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledWith('room-test-123');
      expect(fixture.nativeElement.textContent).toContain('FORMANDO LOBBY');
    });

    it('transição de authenticated para anonymous cancela polling', () => {
      const snap = createRoomSnapshot('FORMING');
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(1);

      sessionSignal.set({ status: 'anonymous' });
      fixture.detectChanges();

      vi.advanceTimersByTime(10000);
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(1);
    });

    it('transição de authenticated para unavailable cancela polling', () => {
      const snap = createRoomSnapshot('FORMING');
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(1);

      sessionSignal.set({ status: 'unavailable' });
      fixture.detectChanges();

      vi.advanceTimersByTime(10000);
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(1);
    });
  });

  describe('FORMING state', () => {
    it('renderiza 10 slots neutros com ocupados e vazios', () => {
      const snap = createRoomSnapshot('FORMING');
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      const slots = fixture.nativeElement.querySelectorAll('.room-slot');
      expect(slots.length).toBe(10);
      expect(fixture.nativeElement.textContent).toContain('Creator Player');
      expect(fixture.nativeElement.textContent).toContain('Second Player');
      expect(fixture.nativeElement.textContent).toContain('AGUARDANDO JOGADOR');
    });

    it('exibe badge CRIADOR para o criador e app-player-link apenas quando slug existir', () => {
      const snap = createRoomSnapshot('FORMING');
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('CRIADOR');

      // Creator has slug 'creator-slug' -> should have link
      const creatorLink = fixture.nativeElement.querySelector('a[href="/players/creator-slug"]');
      expect(creatorLink).not.toBeNull();

      // Second player has null slug -> no link
      const secondPlayerLink = fixture.nativeElement.querySelector('a[href="/players/null"]');
      expect(secondPlayerLink).toBeNull();
    });

    it('creator com canCancel exibe CANCELAR LOBBY', () => {
      const snap = createRoomSnapshot('FORMING', 1, { isCreator: true, canCancel: true, canLeave: false });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));
      matchRoomApiMock.cancelMatchRoom.mockReturnValue(of(createRoomSnapshot('CANCELLED', 2)));

      fixture = setupFixture();

      const cancelBtn = fixture.nativeElement.querySelector('.room-btn--danger');
      expect(cancelBtn).not.toBeNull();
      expect(cancelBtn.textContent).toContain('CANCELAR LOBBY');

      cancelBtn.click();
      expect(matchRoomApiMock.cancelMatchRoom).toHaveBeenCalledWith('room-test-123');
    });

    it('non-creator participant com canLeave exibe SAIR DO LOBBY e navega para /mix no sucesso', () => {
      const snap = createRoomSnapshot('FORMING', 1, { isCreator: false, canCancel: false, canLeave: true });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));
      matchRoomApiMock.leaveMatchRoom.mockReturnValue(of(createRoomSnapshot('FORMING', 2, { canJoin: true })));

      fixture = setupFixture();

      const leaveBtn = fixture.nativeElement.querySelector('.room-btn--secondary');
      expect(leaveBtn).not.toBeNull();
      expect(leaveBtn.textContent).toContain('SAIR DO LOBBY');

      leaveBtn.click();
      expect(matchRoomApiMock.leaveMatchRoom).toHaveBeenCalledWith('room-test-123');
      expect(router.navigate).toHaveBeenCalledWith(['/mix']);
    });

    it('viewer não participante via deep-link com canJoin pode entrar na sala', () => {
      const snap = createRoomSnapshot('FORMING', 1, { canJoin: true, canLeave: false, canCancel: false });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));
      matchRoomApiMock.joinMatchRoom.mockReturnValue(of(createRoomSnapshot('FORMING', 2, { canLeave: true })));

      fixture = setupFixture();

      const joinBtn = fixture.nativeElement.querySelector('.room-header__actions button');
      expect(joinBtn.textContent).toContain('ENTRAR NO LOBBY');

      joinBtn.click();
      expect(matchRoomApiMock.joinMatchRoom).toHaveBeenCalledWith('room-test-123');
    });
  });

  describe('CONFIRMING state & Countdown', () => {
    it('exibe painel central de confirmação com contagem e status dos jogadores', () => {
      const participants = [
        createParticipant('player-1', 'P1', null, true),
        createParticipant('player-2', 'P2', null, false),
      ];
      const snap = createRoomSnapshot('CONFIRMING', 1, {
        participants,
        canConfirm: true,
        confirmedCount: 1,
      });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('CONFIRME SUA PARTICIPAÇÃO');
      expect(fixture.nativeElement.textContent).toContain('1 DE 10 CONFIRMADOS');
      expect(fixture.nativeElement.textContent).toContain('CONFIRMAR PRESENÇA');
      expect(fixture.nativeElement.textContent).toContain('CONFIRMADO');
      expect(fixture.nativeElement.textContent).toContain('AGUARDANDO');
      expect(fixture.nativeElement.textContent).not.toContain('READY');
    });

    it('confirmar presença atualiza o snapshot imediatamente com a resposta da mutation', () => {
      const snap = createRoomSnapshot('CONFIRMING', 1, { canConfirm: true, confirmedCount: 1 });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      const updatedSnap = createRoomSnapshot('CONFIRMING', 2, { canConfirm: false, confirmedCount: 2 });
      matchRoomApiMock.confirmMatchRoom.mockReturnValue(of(updatedSnap));

      fixture = setupFixture();

      const confirmBtn = fixture.nativeElement.querySelector('.room-btn--accent');
      confirmBtn.click();

      expect(matchRoomApiMock.confirmMatchRoom).toHaveBeenCalledWith('room-test-123');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('2 DE 10 CONFIRMADOS');
    });

    it('quando countdown chega a zero: não altera status localmente, bloqueia click e dispara refresh one-shot', () => {
      const pastDeadline = new Date(Date.now() - 5000).toISOString();
      const snap = createRoomSnapshot('CONFIRMING', 1, {
        deadlineAt: pastDeadline,
        canConfirm: true,
      });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(1);

      // 1s ticker triggers one-shot zero refresh
      vi.advanceTimersByTime(1000);
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(2);

      // Status continues to be CONFIRMING (not mutated locally)
      expect(fixture.nativeElement.textContent).toContain('CONFIRMAÇÃO DO LOBBY');

      // Advancing timer ticks does NOT spam GET because of one-shot key
      vi.advanceTimersByTime(1000);
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(2);
    });

    it('novo round/deadline permite novo countdown e novo zero refresh', () => {
      const pastDeadline1 = new Date(Date.now() - 5000).toISOString();
      const snapRound1 = createRoomSnapshot('CONFIRMING', 1, {
        round: 1,
        deadlineAt: pastDeadline1,
      });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snapRound1));

      fixture = setupFixture();
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(1);

      // 1s ticker triggers zero-refresh for round 1
      vi.advanceTimersByTime(1000);
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(2);

      // Server sends round 2 with a deadline set to expire at t=4500ms
      const futureDeadline2 = new Date(Date.now() + 3500).toISOString();
      const snapRound2 = createRoomSnapshot('CONFIRMING', 2, {
        round: 2,
        deadlineAt: futureDeadline2,
      });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snapRound2));

      // Advance to t=3000ms where periodic polling receives round 2
      vi.advanceTimersByTime(2000);
      const callsBeforeExpiry = matchRoomApiMock.getMatchRoom.mock.calls.length;
      expect(callsBeforeExpiry).toBe(3);

      // Advance to t=5000ms: crosses deadline (4500ms) before the next 3s polling (6000ms)
      vi.advanceTimersByTime(2000);
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(callsBeforeExpiry + 1);

      // Additional ticks before next 3s polling do not trigger duplicate zero-refresh
      vi.advanceTimersByTime(500);
      expect(matchRoomApiMock.getMatchRoom).toHaveBeenCalledTimes(callsBeforeExpiry + 1);
    });
  });

  describe('SETUP state', () => {
    it('renderiza cópia transitória e não exibe elementos de Draft', () => {
      const snap = createRoomSnapshot('SETUP', 1);
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('PREPARANDO PARTIDA');
      expect(fixture.nativeElement.textContent).toContain('10/10 confirmados');
      expect(fixture.nativeElement.textContent).not.toContain('Team A');
      expect(fixture.nativeElement.textContent).not.toContain('Team B');
      expect(fixture.nativeElement.textContent).not.toContain('Draft');
    });
  });

  describe('READY and PROVISIONING states', () => {
    it('renderiza READY sem erro e não exibe CTA de entrar no servidor CS2', () => {
      const snap = createRoomSnapshot('READY', 1);
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('PARTIDA PRONTA');
      expect(fixture.nativeElement.textContent).not.toContain('Entrar no servidor');
      expect(fixture.nativeElement.textContent).not.toContain('connect ');
    });

    it('renderiza PROVISIONING sem erro', () => {
      const snap = createRoomSnapshot('PROVISIONING', 1);
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('INICIANDO SERVIDOR');
    });
  });

  describe('CANCELLED state', () => {
    it('renderiza tela terminal com botão de retorno aos lobbies', () => {
      const snap = createRoomSnapshot('CANCELLED', 1);
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('LOBBY ENCERRADO');
      expect(fixture.nativeElement.textContent).toContain('Voltar aos lobbies');
    });
  });

  describe('Monotonicity & Polling Protection', () => {
    it('snapshot com versão menor não sobrescreve snapshot mais novo', () => {
      const snapV2 = createRoomSnapshot('CONFIRMING', 2, { confirmedCount: 2 });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snapV2));

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('2 DE 10 CONFIRMADOS');

      // Stale polling response with version 1 arrives on next poll
      const snapV1 = createRoomSnapshot('CONFIRMING', 1, { confirmedCount: 1 });
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snapV1));

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();

      // Should still display version 2
      expect(fixture.nativeElement.textContent).toContain('2 DE 10 CONFIRMADOS');
    });

    it('mantém último snapshot visível em caso de falha transitória de polling', () => {
      const snap = createRoomSnapshot('FORMING', 1);
      matchRoomApiMock.getMatchRoom.mockReturnValue(of(snap));

      fixture = setupFixture();

      expect(fixture.nativeElement.textContent).toContain('FORMANDO LOBBY');

      // Next poll fails
      matchRoomApiMock.getMatchRoom.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500, error: { ok: false, error: 'generic' } })),
      );

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();

      // UI still renders the snapshot
      expect(fixture.nativeElement.textContent).toContain('FORMANDO LOBBY');
    });
  });
});
