import { HttpErrorResponse } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlayerSessionService } from '../../../core/session/player-session.service';
import type { PlayerSession } from '../../../core/session/player-session.model';
import { PlayerSelfApiService } from '../../player/data-access/player-self-api.service';
import type { PlayerMembership, PlayerMembershipStatus } from '../../player/domain/player-membership.model';
import { MatchRoomApiService } from '../data-access/match-room-api.service';
import type { MatchRoomSnapshot, MatchRoomStatus } from '../domain/match-room.model';
import { MixLobbyListPage } from './mix-lobby-list-page';

function createSnapshot(
  id: string,
  status: MatchRoomStatus = 'FORMING',
  participant = false,
  canJoin = true,
  participantCount = 1,
): MatchRoomSnapshot {
  return {
    room: {
      id,
      status,
      version: 1,
      creator: { playerAccountId: 'creator-1' },
      participantCount,
      capacity: 10,
      confirmation:
        status === 'CONFIRMING'
          ? {
              round: 1,
              startedAt: '2026-08-17T20:00:00Z',
              deadlineAt: '2026-08-17T20:00:30Z',
              confirmedCount: 1,
            }
          : null,
      rosterLockedAt: null,
      readyAt: null,
      draft: null,
      mapVeto: null,
      competitiveMatch: null,
      participants: [
        {
          playerAccountId: 'player-secret-id',
          player: {
            steam: {
              steamId64: '76561198000000001',
              personaname: 'SecretPlayerName',
              avatarMediumUrl: null,
            },
            profile: null,
          },
          joinedAt: '2026-08-17T20:00:00Z',
          confirmation: { confirmed: false, confirmedAt: null },
        },
      ],
    },
    viewer: {
      participant,
      creator: participant,
      actions: {
        canJoin,
        canLeave: participant,
        canCancel: participant,
        canConfirm: false,
        canDraftPick: false,
        canMapVetoBan: false,
        canJoinServer: false,
      },
      join: null,
    },
  };
}

function createMembership(status: PlayerMembershipStatus = 'active'): PlayerMembership {
  return {
    status,
    planCode: 'PRO',
    startedAt: '2026-01-01T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    suspendedAt: null,
    cancelledAt: null,
  };
}

describe('MixLobbyListPage', () => {
  let fixture: ComponentFixture<MixLobbyListPage>;
  let router: Router;
  let sessionSignal: WritableSignal<PlayerSession>;

  const matchRoomApiMock = {
    listMatchRooms: vi.fn(),
    createMatchRoom: vi.fn(),
    joinMatchRoom: vi.fn(),
  };

  const playerSelfApiMock = {
    getMembership: vi.fn(),
  };

  const sessionServiceMock = {
    state: () => sessionSignal(),
    load: vi.fn(),
  };

  const TRANSLATIONS = {
    shared: {
      playerAvatar: { alt: 'Avatar de {{displayName}}' },
    },
    playerArea: {
      membership: {
        status: {
          active: 'Ativo',
          inactive: 'Inativo',
          suspended: 'Suspenso',
          expired: 'Expirado',
          cancelled: 'Cancelado',
        },
      },
    },
    mix: {
      hero: {
        eyebrow: 'HSC COMPETITIVO',
        title: 'LOBBY HSC 5v5',
        subtitle: 'Partidas 5v5 organizadas do lobby ao servidor, com uma experiência competitiva construída para a comunidade HSC.',
        createLobby: 'CRIAR LOBBY',
        creating: 'CRIANDO LOBBY...',
      },
      landing: {
        eyebrow: 'HSC COMPETITIVO',
        title: 'LOBBIES EXCLUSIVOS PARA MEMBROS HSC',
        subtitle: 'Partidas 5v5 organizadas do lobby ao servidor, com uma experiência competitiva construída para a comunidade HSC.',
        ctaPrimary: 'ENTRAR NA ÁREA DO JOGADOR',
        ctaSecondary: 'CONHECER BENEFÍCIOS',
        featuresTitle: 'EXPERIÊNCIA COMPETITIVA COMPLETA',
        features: {
          lobby: { title: 'Lobby 5v5 Exclusivo', description: 'Partidas estruturadas com capacidade para 10 jogadores.' },
          draft: { title: 'Captain Draft', description: 'Formação equilibrada de times com escolha alternada de capitães.' },
          veto: { title: 'Veto de Mapas', description: 'Sistema de banimento de mapas competitivo antes de cada confronto.' },
          server: { title: 'Servidor Dedicado', description: 'Entrada direta e integração automática com servidor de jogo.' },
          community: { title: 'Comunidade HSC', description: 'Ambiente exclusivo para membros com perfil e histórico integrado.' },
        },
      },
      membershipWall: {
        eyebrow: 'MEMBERSHIP HSC',
        title: 'SEU PRÓXIMO LOBBY COMEÇA COM A MEMBERSHIP HSC',
        description: 'Os Lobbies HSC são exclusivos para membros ativos. Ative ou regularize sua membership na Área do Jogador para participar de partidas e criar lobbies.',
        cta: 'IR PARA A ÁREA DO JOGADOR',
        statusNotice: {
          inactive: 'Sua Membership está inativa.',
          expired: 'Sua Membership expirou.',
          suspended: 'Sua Membership está suspensa.',
          cancelled: 'Sua Membership foi cancelada.',
          none: 'Você ainda não possui uma Membership ativa.',
        },
      },
      membershipStates: {
        loadingTitle: 'Verificando Membership',
        loadingMessage: 'Aguarde enquanto validamos seu status de membro...',
        errorTitle: 'Membership temporariamente indisponível',
        errorMessage: 'Não foi possível validar seu status de membership no momento.',
        retry: 'Tentar novamente',
      },
      authWall: {
        title: 'Entre na sua conta HSC',
        description: 'Para criar ou participar de um lobby HSC, você precisa estar autenticado.',
        action: 'Ir para a Área do Jogador',
      },
      lobbyList: {
        loadingTitle: 'Carregando lobbies',
        loadingMessage: 'Buscando partidas e salas abertas...',
        errorTitle: 'Não foi possível carregar os lobbies',
        retry: 'Tentar novamente',
        sessionLoading: 'Verificando sessão',
        sessionLoadingMessage: 'Aguarde enquanto verificamos sua conta...',
        sessionUnavailable: 'Sessão indisponível',
        sessionUnavailableMessage: 'Não foi possível validar sua sessão no momento.',
      },
      currentLobby: {
        heading: 'SEU LOBBY ATUAL',
        returnAction: 'VOLTAR AO LOBBY',
        hints: {
          FORMING: 'Aguardando jogadores para completar 10 vagas.',
          CONFIRMING: 'Lobby completo! Confirmação de presença em andamento.',
          SETUP: 'Todos os jogadores confirmados. Preparando a partida.',
          READY: 'Partida pronta! Servidor sendo configurado.',
          PROVISIONING: 'Servidor em inicialização. Aguarde as instruções.',
          JOINABLE: 'Servidor pronto! Entre na partida agora.',
          CANCELLED: 'Este lobby foi encerrado.',
          FAILED: 'Não foi possível preparar o servidor de jogo.',
        },
      },
      openLobbies: {
        heading: 'LOBBIES ABERTOS',
        cardTitle: 'LOBBY HSC 5V5',
        slotsAvailable: '{{ count }} VAGAS DISPONÍVEIS',
        joinAction: 'ENTRAR',
        joining: 'ENTRANDO...',
        empty: 'Nenhum lobby aberto agora.',
      },
      statuses: {
        FORMING: 'FORMANDO',
        CONFIRMING: 'CONFIRMANDO',
        SETUP: 'PREPARANDO',
        READY: 'PRONTO',
        PROVISIONING: 'INICIANDO',
        CANCELLED: 'CANCELADO',
        JOINABLE: 'SERVIDOR PRONTO',
        FAILED: 'FALHA NO SERVIDOR',
      },
      errors: {
        already_in_active_room: 'Você já possui uma sala ativa no momento.',
        already_in_room: 'Você já está participando desta sala.',
        room_not_found: 'O lobby solicitado não foi encontrado.',
        room_not_joinable: 'Não é possível entrar neste lobby.',
        room_full: 'Este lobby já atingiu a capacidade máxima de jogadores.',
        not_room_participant: 'Você não é participante deste lobby.',
        creator_must_cancel_room: 'O criador da sala deve utilizar o cancelamento.',
        not_room_creator: 'Apenas o criador do lobby pode realizar esta ação.',
        room_not_cancellable: 'Este lobby não pode ser cancelado.',
        room_not_confirmable: 'Este lobby não está na fase de confirmação.',
        confirmation_window_closed: 'O tempo para confirmação de presença expirou.',
        steam_identity_not_linked: 'É necessário ter uma conta Steam vinculada para participar. Acesse a Área do Jogador.',
        player_account_disabled: 'Sua conta de jogador está desativada.',
        membership_required: 'É necessária uma associação ativa para jogar no Lobby. Acesse a Área do Jogador.',
        membership_inactive: 'Sua associação está inativa.',
        membership_suspended: 'Sua associação está suspensa.',
        membership_expired: 'Sua associação expirou. Renove na Área do Jogador.',
        membership_cancelled: 'Sua associação foi cancelada.',
        match_room_operation_failed: 'Não foi possível concluir a operação na sala.',
        generic: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      },
    },
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionSignal = signal<PlayerSession>({
      status: 'authenticated',
      displayName: 'Test Athlete',
      steamId64: '76561198000000001',
      avatarMedium: null,
    });

    playerSelfApiMock.getMembership.mockReturnValue(of(createMembership('active')));

    await TestBed.configureTestingModule({
      imports: [MixLobbyListPage],
      providers: [
        provideRouter([
          { path: 'mix', component: MixLobbyListPage },
          { path: 'mix/rooms/:roomId', component: MixLobbyListPage },
          { path: 'area-do-jogador', component: MixLobbyListPage },
        ]),
        provideTranslateService(),
        { provide: MatchRoomApiService, useValue: matchRoomApiMock },
        { provide: PlayerSelfApiService, useValue: playerSelfApiMock },
        { provide: PlayerSessionService, useValue: sessionServiceMock },
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

  function setupFixture(): ComponentFixture<MixLobbyListPage> {
    const fix = TestBed.createComponent(MixLobbyListPage);
    fix.detectChanges();
    vi.advanceTimersByTime(0);
    fix.detectChanges();
    return fix;
  }

  it('1. exibe estado de loading quando sessão está carregando e não consulta Match Rooms', () => {
    sessionSignal.set({ status: 'loading' });
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('Aguarde enquanto verificamos sua conta...');
    expect(matchRoomApiMock.listMatchRooms).not.toHaveBeenCalled();
    expect(playerSelfApiMock.getMembership).not.toHaveBeenCalled();
  });

  it('2. exibe landing exclusiva quando a sessão é anonymous e não consulta Match Rooms', () => {
    sessionSignal.set({ status: 'anonymous' });

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('LOBBIES EXCLUSIVOS PARA MEMBROS HSC');
    expect(fixture.nativeElement.textContent).toContain('ENTRAR NA ÁREA DO JOGADOR');
    expect(fixture.nativeElement.textContent).toContain('Captain Draft');
    expect(fixture.nativeElement.textContent).toContain('Veto de Mapas');
    expect(matchRoomApiMock.listMatchRooms).not.toHaveBeenCalled();
    expect(playerSelfApiMock.getMembership).not.toHaveBeenCalled();
  });

  it('2a. exibe estado de loading de Membership quando autenticado e membership está carregando', () => {
    const membership$ = new Subject<PlayerMembership | null>();
    playerSelfApiMock.getMembership.mockReturnValue(membership$);

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('Aguarde enquanto validamos seu status de membro...');
    expect(matchRoomApiMock.listMatchRooms).not.toHaveBeenCalled();
  });

  it('2b. exibe landing contextual quando usuário autenticado não possui Membership ativa (null)', () => {
    playerSelfApiMock.getMembership.mockReturnValue(of(null));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU PRÓXIMO LOBBY COMEÇA COM A MEMBERSHIP HSC');
    expect(fixture.nativeElement.textContent).toContain('Você ainda não possui uma Membership ativa.');
    expect(fixture.nativeElement.textContent).toContain('IR PARA A ÁREA DO JOGADOR');
    expect(matchRoomApiMock.listMatchRooms).not.toHaveBeenCalled();
  });

  it('2c. exibe landing contextual com status expirado quando membership está expirada', () => {
    playerSelfApiMock.getMembership.mockReturnValue(of(createMembership('expired')));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU PRÓXIMO LOBBY COMEÇA COM A MEMBERSHIP HSC');
    expect(fixture.nativeElement.textContent).toContain('Sua Membership expirou.');
    expect(matchRoomApiMock.listMatchRooms).not.toHaveBeenCalled();
  });

  it('2d. exibe landing contextual com status suspenso quando membership está suspensa', () => {
    playerSelfApiMock.getMembership.mockReturnValue(of(createMembership('suspended')));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU PRÓXIMO LOBBY COMEÇA COM A MEMBERSHIP HSC');
    expect(fixture.nativeElement.textContent).toContain('Sua Membership está suspensa.');
    expect(matchRoomApiMock.listMatchRooms).not.toHaveBeenCalled();
  });

  it('2e. exibe estado de indisponibilidade quando consulta de Membership falha com erro e não assume não-membro', () => {
    playerSelfApiMock.getMembership.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: 'service_unavailable' })),
    );

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('Membership temporariamente indisponível');
    expect(fixture.nativeElement.textContent).not.toContain('SEU PRÓXIMO LOBBY COMEÇA COM A MEMBERSHIP HSC');
    expect(matchRoomApiMock.listMatchRooms).not.toHaveBeenCalled();
  });

  it('2f. retry em erro de Membership recarrega membership e inicia polling se membro ativo', () => {
    playerSelfApiMock.getMembership.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: 'service_unavailable' })),
    );
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));

    fixture = setupFixture();
    expect(fixture.nativeElement.textContent).toContain('Membership temporariamente indisponível');

    playerSelfApiMock.getMembership.mockReturnValue(of(createMembership('active')));
    const retryBtn = fixture.nativeElement.querySelector('button');
    retryBtn.click();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();

    expect(playerSelfApiMock.getMembership).toHaveBeenCalledTimes(2);
    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('LOBBIES ABERTOS');
  });

  it('3. carrega lista de lobbies quando sessão é authenticated e membership é active', () => {
    const rooms = [createSnapshot('room-1', 'FORMING', false, true)];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    expect(playerSelfApiMock.getMembership).toHaveBeenCalled();
    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('LOBBY HSC 5v5');
    expect(fixture.nativeElement.textContent).toContain('LOBBIES ABERTOS');
  });

  it('4. exibe current room separada em SEU LOBBY ATUAL com hint e CTA de retorno', () => {
    const rooms = [
      createSnapshot('my-room', 'FORMING', true, false),
      createSnapshot('other-room', 'FORMING', false, true),
    ];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU LOBBY ATUAL');
    expect(fixture.nativeElement.textContent).toContain('VOLTAR AO LOBBY');
    expect(fixture.nativeElement.textContent).toContain('Aguardando jogadores para completar 10 vagas.');
  });

  it('5. lista apenas FORMING rooms em LOBBIES ABERTOS', () => {
    const rooms = [
      createSnapshot('open-1', 'FORMING', false, true),
      createSnapshot('open-2', 'FORMING', false, true),
    ];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    const cards = fixture.nativeElement.querySelectorAll('.mix-card');
    expect(cards.length).toBe(2);
  });

  it('6. current room em CONFIRMING aparece em SEU LOBBY ATUAL', () => {
    const rooms = [createSnapshot('my-confirming', 'CONFIRMING', true, false)];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU LOBBY ATUAL');
    expect(fixture.nativeElement.textContent).toContain('CONFIRMANDO');
    expect(fixture.nativeElement.textContent).toContain('Lobby completo! Confirmação de presença em andamento.');
  });

  it('7. current room em SETUP aparece em SEU LOBBY ATUAL', () => {
    const rooms = [createSnapshot('my-setup', 'SETUP', true, false)];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU LOBBY ATUAL');
    expect(fixture.nativeElement.textContent).toContain('PREPARANDO');
    expect(fixture.nativeElement.textContent).toContain('Todos os jogadores confirmados. Preparando a partida.');
  });

  it('7a. current room em READY aparece em SEU LOBBY ATUAL', () => {
    const rooms = [createSnapshot('my-ready', 'READY', true, false)];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU LOBBY ATUAL');
    expect(fixture.nativeElement.textContent).toContain('PRONTO');
    expect(fixture.nativeElement.textContent).toContain('Partida pronta! Servidor sendo configurado.');
  });

  it('7b. current room em PROVISIONING aparece em SEU LOBBY ATUAL', () => {
    const rooms = [createSnapshot('my-provisioning', 'PROVISIONING', true, false)];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU LOBBY ATUAL');
    expect(fixture.nativeElement.textContent).toContain('INICIANDO');
    expect(fixture.nativeElement.textContent).toContain('Servidor em inicialização. Aguarde as instruções.');
  });

  it('7c. current room em JOINABLE aparece em SEU LOBBY ATUAL com hint traduzido', () => {
    const rooms = [createSnapshot('my-joinable', 'JOINABLE', true, false)];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU LOBBY ATUAL');
    expect(fixture.nativeElement.textContent).toContain('Servidor pronto! Entre na partida agora.');
    expect(fixture.nativeElement.textContent).not.toContain('mix.currentLobby.hints.JOINABLE');
    expect(fixture.nativeElement.textContent).toContain('VOLTAR AO LOBBY');
  });

  it('7d. current room em FAILED aparece em SEU LOBBY ATUAL com hint traduzido', () => {
    const rooms = [createSnapshot('my-failed', 'FAILED', true, false)];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('SEU LOBBY ATUAL');
    expect(fixture.nativeElement.textContent).toContain('Não foi possível preparar o servidor de jogo.');
    expect(fixture.nativeElement.textContent).not.toContain('mix.currentLobby.hints.FAILED');
  });

  it('8 & 9. criar lobby com sucesso navega para a Match Room', () => {
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));
    const createdRoom = createSnapshot('created-room-1', 'FORMING', true, false);
    matchRoomApiMock.createMatchRoom.mockReturnValue(of(createdRoom));

    fixture = setupFixture();

    const createBtn = fixture.nativeElement.querySelector('.mix-hero__actions button');
    createBtn.click();

    expect(matchRoomApiMock.createMatchRoom).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/mix/rooms', 'created-room-1']);
  });

  it('10 & 11. entrar em lobby com sucesso navega para a Match Room', () => {
    const openRoom = createSnapshot('room-target', 'FORMING', false, true);
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([openRoom]));
    matchRoomApiMock.joinMatchRoom.mockReturnValue(of(createSnapshot('room-target', 'FORMING', true, false)));

    fixture = setupFixture();

    const joinBtn = fixture.nativeElement.querySelector('.mix-card button');
    joinBtn.click();

    expect(matchRoomApiMock.joinMatchRoom).toHaveBeenCalledWith('room-target');
    expect(router.navigate).toHaveBeenCalledWith(['/mix/rooms', 'room-target']);
  });

  it('12. canJoin false desabilita o botão de entrar', () => {
    const openRoom = createSnapshot('room-target', 'FORMING', false, false);
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([openRoom]));

    fixture = setupFixture();

    const joinBtn = fixture.nativeElement.querySelector('.mix-card button');
    expect(joinBtn.disabled).toBe(true);
  });

  it('13. active room impede o botão de CRIAR LOBBY na hero', () => {
    const rooms = [createSnapshot('my-active', 'FORMING', true, false)];
    matchRoomApiMock.listMatchRooms.mockReturnValue(of(rooms));

    fixture = setupFixture();

    const createBtn = fixture.nativeElement.querySelector('.mix-hero__actions button');
    expect(createBtn).toBeNull();
  });

  it('14. empty state é renderizado quando não há salas abertas e nem sala atual', () => {
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('Nenhum lobby aberto agora.');
  });

  it('15. falha inicial de carregamento de lobbies exibe estado de erro com retry', () => {
    matchRoomApiMock.listMatchRooms.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: { ok: false, error: 'generic' } })),
    );

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os lobbies');
  });

  it('16. polling periódico recarrega lista para membro ativo', () => {
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));

    fixture = setupFixture();

    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalledTimes(2);
  });

  it('17. previne double submit durante criação de lobby', () => {
    const pending$ = new Subject<MatchRoomSnapshot>();
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));
    matchRoomApiMock.createMatchRoom.mockReturnValue(pending$);

    fixture = setupFixture();

    const createBtn = fixture.nativeElement.querySelector('.mix-hero__actions button');
    createBtn.click();
    fixture.detectChanges();

    expect(createBtn.disabled).toBe(true);
    expect(matchRoomApiMock.createMatchRoom).toHaveBeenCalledTimes(1);

    // Segundo click não deve disparar nova chamada
    createBtn.click();
    expect(matchRoomApiMock.createMatchRoom).toHaveBeenCalledTimes(1);
  });

  it('18. erro de domínio/elegibilidade em criação vira mensagem humana e dispara refetch', () => {
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));
    matchRoomApiMock.createMatchRoom.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { ok: false, error: 'already_in_active_room' } })),
    );

    fixture = setupFixture();

    const createBtn = fixture.nativeElement.querySelector('.mix-hero__actions button');
    createBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Você já possui uma sala ativa no momento.');
    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalledTimes(2);
  });

  it('19. nenhum roster ou player name aparece nos cards da listagem', () => {
    const openRoom = createSnapshot('room-with-secret-player', 'FORMING', false, true);
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([openRoom]));

    fixture = setupFixture();

    expect(fixture.nativeElement.textContent).not.toContain('SecretPlayerName');
    expect(fixture.nativeElement.textContent).not.toContain('player-secret-id');
  });

  it('20. Lobby List nunca chama endpoint current', () => {
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));

    fixture = setupFixture();

    expect('getCurrentMatchRoom' in MatchRoomApiService.prototype).toBe(false);
  });

  it('21. transição de authenticated para anonymous cancela polling imediatamente', () => {
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));

    fixture = setupFixture();
    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalledTimes(1);

    // Sessão muda para anonymous
    sessionSignal.set({ status: 'anonymous' });
    fixture.detectChanges();

    // Avançar tempo de polling
    vi.advanceTimersByTime(15000);
    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalledTimes(1);
  });

  it('22. transição de authenticated para unavailable cancela polling imediatamente', () => {
    matchRoomApiMock.listMatchRooms.mockReturnValue(of([]));

    fixture = setupFixture();
    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalledTimes(1);

    // Sessão muda para unavailable
    sessionSignal.set({ status: 'unavailable' });
    fixture.detectChanges();

    // Avançar tempo de polling
    vi.advanceTimersByTime(15000);
    expect(matchRoomApiMock.listMatchRooms).toHaveBeenCalledTimes(1);
  });
});
