import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  MatchRoomMapVetoSnapshot,
  MatchRoomParticipant,
} from '../../domain/match-room.model';
import { MatchRoomMapVetoPanel } from './match-room-map-veto-panel';

function createParticipant(id: string, name: string): MatchRoomParticipant {
  return {
    playerAccountId: id,
    player: {
      steam: {
        steamId64: `7656119800000000${id}`,
        personaname: name,
        avatarMediumUrl: null,
      },
      profile: { slug: `slug-${id}` },
    },
    joinedAt: '2026-08-17T20:00:00Z',
    confirmation: { confirmed: true, confirmedAt: '2026-08-17T20:01:00Z' },
  };
}

function createMapVetoSnapshot(
  overrides: Partial<MatchRoomMapVetoSnapshot> = {},
): MatchRoomMapVetoSnapshot {
  return {
    phase: 'BANNING',
    pool: {
      id: 'pool-1',
      key: 'active-pool',
      version: 1,
      maps: [
        { key: 'de_mirage', displayName: 'Mirage', position: 2 },
        { key: 'de_inferno', displayName: 'Inferno', position: 1 },
        { key: 'de_nuke', displayName: 'Nuke', position: 3 },
      ],
    },
    firstVetoerPlayerAccountId: 'p1',
    currentVetoerPlayerAccountId: 'p1',
    nextActionOrder: 1,
    actionDeadlineAt: '2026-08-17T20:05:00Z',
    availableMapKeys: ['de_inferno', 'de_mirage', 'de_nuke'],
    selectedMapKey: null,
    actions: [],
    ...overrides,
  };
}

const TRANSLATIONS = {
  mix: {
    matchRoom: {
      timerAccessibleLabel: 'Tempo restante: {{ time }}',
    },
    mapVeto: {
      eyebrow: 'MAP VETO',
      title: 'Escolha do mapa',
      banningTitle: 'VETO EM ANDAMENTO',
      yourTurn: 'SUA VEZ DE BANIR',
      currentVetoerTurn: 'Vez de {{ name }}',
      waitingForVeto: 'Aguardando veto...',
      availablePool: 'MAPAS DISPONÍVEIS',
      banAction: 'BANIR',
      banMapAction: 'Banir {{ map }}',
      banning: 'BANINDO...',
      bannedBadge: 'BANIDO',
      selectedBadge: 'MAPA SELECIONADO',
      completedTitle: 'VETO CONCLUÍDO',
      completedBanner: 'Mapa definido. Preparando a partida.',
      windowExpired: 'Janela expirada',
      updatingWindow: 'Aguardando atualização...',
      sources: {
        MANUAL_BAN: 'Ban manual',
        TIMEOUT_AUTO_BAN: 'Ban automático',
      },
    },
  },
  shared: {
    playerAvatar: { alt: 'Avatar de {{displayName}}' },
  },
};

describe('MatchRoomMapVetoPanel', () => {
  let fixture: ComponentFixture<MatchRoomMapVetoPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchRoomMapVetoPanel],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    translate.use('pt-BR');
  });

  function setup(
    mapVeto: MatchRoomMapVetoSnapshot,
    participants: MatchRoomParticipant[],
    canMapVetoBan = false,
    formattedCountdown = '00:30',
    isWindowClosed = false,
    pendingMapKey: string | null = null,
  ) {
    fixture = TestBed.createComponent(MatchRoomMapVetoPanel);
    fixture.componentRef.setInput('mapVeto', mapVeto);
    fixture.componentRef.setInput('participants', participants);
    fixture.componentRef.setInput('canMapVetoBan', canMapVetoBan);
    fixture.componentRef.setInput('formattedCountdown', formattedCountdown);
    fixture.componentRef.setInput('isWindowClosed', isWindowClosed);
    fixture.componentRef.setInput('pendingMapKey', pendingMapKey);
    fixture.detectChanges();
    return fixture;
  }

  const participants = [
    createParticipant('p1', 'Captain Alpha'),
    createParticipant('p2', 'Captain Beta'),
  ];

  it('1. renderiza mapas do pool', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('Mirage');
    expect(text).toContain('Inferno');
    expect(text).toContain('Nuke');
  });

  it('2. respeita ordenação por position', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants);

    const host = fix.nativeElement as HTMLElement;
    const cardNames = Array.from(
      host.querySelectorAll<HTMLElement>('.veto-card__name'),
    ).map((el) => (el.textContent ?? '').trim());

    // Inferno has position 1, Mirage position 2, Nuke position 3
    expect(cardNames).toEqual(['Inferno', 'Mirage', 'Nuke']);
  });

  it('3. mostra current vetoer quando viewer não pode banir', () => {
    const veto = createMapVetoSnapshot({ currentVetoerPlayerAccountId: 'p1' });
    const fix = setup(veto, participants, false);

    expect(fix.nativeElement.textContent).toContain('Vez de Captain Alpha');
  });

  it('4. mostra SUA VEZ DE BANIR quando canMapVetoBan=true', () => {
    const veto = createMapVetoSnapshot({ currentVetoerPlayerAccountId: 'p1' });
    const fix = setup(veto, participants, true);

    expect(fix.nativeElement.textContent).toContain('SUA VEZ DE BANIR');
  });

  it('5. mapas disponíveis possuem ação quando autorizado e emite banMap output', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants, true);

    const banSpy = vi.fn();
    fix.componentInstance.banMap.subscribe(banSpy);

    const banButtons = fix.nativeElement.querySelectorAll('.veto-btn--ban');
    expect(banButtons.length).toBe(3);

    banButtons[0].click(); // Clicking first card (Inferno)
    expect(banSpy).toHaveBeenCalledWith('de_inferno');
  });

  it('6. sem canMapVetoBan: pool continua visível mas sem botões de ban utilizáveis', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants, false);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('Inferno');
    expect(text).toContain('Mirage');

    const banButtons = fix.nativeElement.querySelectorAll('.veto-btn--ban');
    expect(banButtons.length).toBe(0);
  });

  it('7. mapa já presente em actions aparece BANNED', () => {
    const veto = createMapVetoSnapshot({
      availableMapKeys: ['de_mirage', 'de_nuke'],
      actions: [
        {
          actionOrder: 1,
          mapKey: 'de_inferno',
          actorPlayerAccountId: 'p1',
          source: 'MANUAL_BAN',
          actedAt: '2026-08-17T20:01:00Z',
        },
      ],
    });
    const fix = setup(veto, participants, true);

    const bannedBadges = fix.nativeElement.querySelectorAll('.veto-status-badge--banned');
    expect(bannedBadges.length).toBe(1);
    expect(bannedBadges[0].textContent).toContain('BANIDO');
  });

  it('8. action mostra ator e source (MANUAL_BAN)', () => {
    const veto = createMapVetoSnapshot({
      availableMapKeys: ['de_mirage', 'de_nuke'],
      actions: [
        {
          actionOrder: 1,
          mapKey: 'de_inferno',
          actorPlayerAccountId: 'p1',
          source: 'MANUAL_BAN',
          actedAt: '2026-08-17T20:01:00Z',
        },
      ],
    });
    const fix = setup(veto, participants, false);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('Captain Alpha');
    expect(text).toContain('Ban manual');
  });

  it('9. TIMEOUT_AUTO_BAN é distinguido de MANUAL_BAN', () => {
    const veto = createMapVetoSnapshot({
      availableMapKeys: ['de_mirage', 'de_nuke'],
      actions: [
        {
          actionOrder: 1,
          mapKey: 'de_inferno',
          actorPlayerAccountId: 'p1',
          source: 'TIMEOUT_AUTO_BAN',
          actedAt: '2026-08-17T20:01:00Z',
        },
      ],
    });
    const fix = setup(veto, participants, false);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('Captain Alpha');
    expect(text).toContain('Ban automático');
  });

  it('10. pending map mostra feedback e bloqueia nova ação', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants, true, '00:25', false, 'de_inferno');

    const banButtons = fix.nativeElement.querySelectorAll('.veto-btn--ban');
    expect(banButtons[0].disabled).toBe(true);
    expect(banButtons[0].textContent).toContain('BANINDO...');
  });

  it('11. selectedMapKey aparece destacado', () => {
    const veto = createMapVetoSnapshot({
      phase: 'COMPLETED',
      availableMapKeys: [],
      selectedMapKey: 'de_nuke',
      actions: [
        {
          actionOrder: 1,
          mapKey: 'de_inferno',
          actorPlayerAccountId: 'p1',
          source: 'MANUAL_BAN',
          actedAt: '2026-08-17T20:01:00Z',
        },
        {
          actionOrder: 2,
          mapKey: 'de_mirage',
          actorPlayerAccountId: 'p2',
          source: 'MANUAL_BAN',
          actedAt: '2026-08-17T20:02:00Z',
        },
      ],
    });
    const fix = setup(veto, participants, false);

    const selectedBadge = fix.nativeElement.querySelector('.veto-status-badge--selected');
    expect(selectedBadge).not.toBeNull();
    expect(selectedBadge.textContent).toContain('MAPA SELECIONADO');
  });

  it('12. phase COMPLETED: selected map visível, bans permanecem visíveis, nenhuma ação de ban', () => {
    const veto = createMapVetoSnapshot({
      phase: 'COMPLETED',
      availableMapKeys: [],
      selectedMapKey: 'de_nuke',
      actions: [
        {
          actionOrder: 1,
          mapKey: 'de_inferno',
          actorPlayerAccountId: 'p1',
          source: 'MANUAL_BAN',
          actedAt: '2026-08-17T20:01:00Z',
        },
        {
          actionOrder: 2,
          mapKey: 'de_mirage',
          actorPlayerAccountId: 'p2',
          source: 'MANUAL_BAN',
          actedAt: '2026-08-17T20:02:00Z',
        },
      ],
    });
    const fix = setup(veto, participants, true);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('VETO CONCLUÍDO');
    expect(text).toContain('Mapa definido. Preparando a partida.');
    expect(text).toContain('Nuke');

    const bannedBadges = fix.nativeElement.querySelectorAll('.veto-status-badge--banned');
    expect(bannedBadges.length).toBe(2);

    const banButtons = fix.nativeElement.querySelectorAll('.veto-btn--ban');
    expect(banButtons.length).toBe(0);
  });

  it('13. mapa fora de availableMapKeys mas sem action NÃO aparece como BANNED', () => {
    const veto = createMapVetoSnapshot({
      availableMapKeys: ['de_inferno'],
      actions: [], // no actions executed yet
      selectedMapKey: null,
    });
    const fix = setup(veto, participants, true);

    const bannedBadges = fix.nativeElement.querySelectorAll('.veto-status-badge--banned');
    expect(bannedBadges.length).toBe(0);

    // Only 1 available map button (Inferno)
    const banButtons = fix.nativeElement.querySelectorAll('.veto-btn--ban');
    expect(banButtons.length).toBe(1);

    // Cards for Mirage and Nuke exist but have no banned class or badge
    const bannedCards = fix.nativeElement.querySelectorAll('.veto-card--banned');
    expect(bannedCards.length).toBe(0);
  });

  it('14. selectedMapKey aparece como SELECTED mesmo se não estiver em availableMapKeys', () => {
    const veto = createMapVetoSnapshot({
      phase: 'COMPLETED',
      availableMapKeys: [],
      selectedMapKey: 'de_nuke',
      actions: [
        {
          actionOrder: 1,
          mapKey: 'de_inferno',
          actorPlayerAccountId: 'p1',
          source: 'MANUAL_BAN',
          actedAt: '2026-08-17T20:01:00Z',
        },
      ],
    });
    const fix = setup(veto, participants, false);

    const selectedCard = fix.nativeElement.querySelector('.veto-card--selected');
    expect(selectedCard).not.toBeNull();
    expect(selectedCard.textContent).toContain('Nuke');
    expect(selectedCard.textContent).toContain('MAPA SELECIONADO');

    // Nuke card must not have banned class
    expect(selectedCard.classList.contains('veto-card--banned')).toBe(false);
  });

  it('15. mensagem de turno é aria-live="polite" e timer possui role="timer" sem live spam', () => {
    const veto = createMapVetoSnapshot({ currentVetoerPlayerAccountId: 'p1' });
    const fix = setup(veto, participants, true);

    const turnBadge = fix.nativeElement.querySelector('.veto-turn-banner__badge');
    expect(turnBadge.getAttribute('aria-live')).toBe('polite');

    const timer = fix.nativeElement.querySelector('.veto-turn-banner__timer');
    expect(timer.getAttribute('role')).toBe('timer');
    expect(timer.getAttribute('aria-label')).toBe('Tempo restante: 00:30');
    expect(timer.getAttribute('aria-live')).toBeNull();
  });

  it('16. botão de ban possui nome acessível contendo o displayName do mapa', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants, true);

    const banButtons = fix.nativeElement.querySelectorAll('.veto-btn--ban');
    expect(banButtons[0].getAttribute('aria-label')).toBe('Banir Inferno');
    expect(banButtons[1].getAttribute('aria-label')).toBe('Banir Mirage');
    expect(banButtons[2].getAttribute('aria-label')).toBe('Banir Nuke');
  });

  it('17. mapa pending define aria-busy="true"', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants, true, '00:25', false, 'de_inferno');

    const pendingCard = fix.nativeElement.querySelector('.veto-card--pending');
    expect(pendingCard.getAttribute('aria-busy')).toBe('true');
  });

  it('18. aplica background image real usando map-images/<mapKey>.png nos cards de mapa', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants);

    const host = fix.nativeElement as HTMLElement;
    const cards = host.querySelectorAll<HTMLElement>('.veto-card');
    expect(cards[0].style.backgroundImage).toContain('map-images/de_inferno.png');
    expect(cards[1].style.backgroundImage).toContain('map-images/de_mirage.png');
    expect(cards[2].style.backgroundImage).toContain('map-images/de_nuke.png');
  });

  it('19. com canMapVetoBan=true e isWindowClosed=true, botões de ban continuam habilitados e emitem banMap (clock skew)', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants, true, '00:00', true);

    const banSpy = vi.fn();
    fix.componentInstance.banMap.subscribe(banSpy);

    const banButtons = fix.nativeElement.querySelectorAll('.veto-btn--ban');
    expect(banButtons.length).toBe(3);
    expect(banButtons[0].disabled).toBe(false);

    banButtons[0].click();
    expect(banSpy).toHaveBeenCalledWith('de_inferno');
  });

  it('20. com canMapVetoBan=false mesmo com isWindowClosed=false, não renderiza botões de ban', () => {
    const veto = createMapVetoSnapshot();
    const fix = setup(veto, participants, false, '00:30', false);

    const banButtons = fix.nativeElement.querySelectorAll('.veto-btn--ban');
    expect(banButtons.length).toBe(0);
  });
});

