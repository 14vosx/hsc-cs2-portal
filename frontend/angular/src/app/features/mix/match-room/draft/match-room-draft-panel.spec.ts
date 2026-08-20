import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';

import type {
  MatchRoomDraftSnapshot,
  MatchRoomParticipant,
} from '../../domain/match-room.model';
import { MatchRoomDraftPanel } from './match-room-draft-panel';

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

function createDraftSnapshot(overrides: Partial<MatchRoomDraftSnapshot> = {}): MatchRoomDraftSnapshot {
  return {
    phase: 'PICKING',
    captains: {
      teamAPlayerAccountId: 'p1',
      teamBPlayerAccountId: 'p2',
    },
    firstPickerPlayerAccountId: 'p1',
    currentPickerPlayerAccountId: 'p1',
    nextSelectionOrder: 1,
    pickDeadlineAt: '2026-08-17T20:05:00Z',
    availablePlayerAccountIds: ['p3', 'p4'],
    assignments: [
      {
        playerAccountId: 'p1',
        team: 'A',
        captain: true,
        selectionOrder: null,
        source: 'CAPTAIN',
        pickerPlayerAccountId: null,
        assignedAt: '2026-08-17T20:01:00Z',
      },
      {
        playerAccountId: 'p2',
        team: 'B',
        captain: true,
        selectionOrder: null,
        source: 'CAPTAIN',
        pickerPlayerAccountId: null,
        assignedAt: '2026-08-17T20:01:00Z',
      },
    ],
    ...overrides,
  };
}

const TRANSLATIONS = {
  mix: {
    matchRoom: {
      timerAccessibleLabel: 'Tempo restante: {{ time }}',
    },
    draft: {
      eyebrow: 'CAPTAIN DRAFT',
      title: 'Formação dos times',
      teamA: 'TIME A',
      teamB: 'TIME B',
      captain: 'CAPITÃO',
      currentPickerTurn: 'Vez de {{ name }}',
      yourTurn: 'SUA VEZ DE ESCOLHER',
      availablePool: 'JOGADORES DISPONÍVEIS',
      pickAction: 'ESCOLHER',
      pickPlayerAction: 'Escolher {{ name }}',
      pickOrder: 'Escolha #{{ order }}',
      picking: 'ESCOLHENDO...',
      completedTitle: 'DRAFT CONCLUÍDO',
      completedBanner: 'Times definidos. Preparando próxima etapa.',
      emptyAvailablePool: 'Nenhum jogador disponível no momento.',
      waitingForPick: 'Aguardando escolha...',
    },
  },
  shared: {
    playerAvatar: { alt: 'Avatar de {{displayName}}' },
  },
};

describe('MatchRoomDraftPanel', () => {
  let fixture: ComponentFixture<MatchRoomDraftPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchRoomDraftPanel],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRANSLATIONS);
    translate.use('pt-BR');
  });

  function setup(
    draft: MatchRoomDraftSnapshot,
    participants: MatchRoomParticipant[],
    canDraftPick = false,
    formattedCountdown = '00:30',
    isWindowClosed = false,
    pendingPlayerAccountId: string | null = null,
  ) {
    fixture = TestBed.createComponent(MatchRoomDraftPanel);
    fixture.componentRef.setInput('draft', draft);
    fixture.componentRef.setInput('participants', participants);
    fixture.componentRef.setInput('canDraftPick', canDraftPick);
    fixture.componentRef.setInput('formattedCountdown', formattedCountdown);
    fixture.componentRef.setInput('isWindowClosed', isWindowClosed);
    fixture.componentRef.setInput('pendingPlayerAccountId', pendingPlayerAccountId);
    fixture.detectChanges();
    return fixture;
  }

  const participants = [
    createParticipant('p1', 'Captain Alpha'),
    createParticipant('p2', 'Captain Beta'),
    createParticipant('p3', 'Player Three'),
    createParticipant('p4', 'Player Four'),
  ];

  it('1. renderiza título do draft e pool de disponíveis', () => {
    const draft = createDraftSnapshot();
    const fix = setup(draft, participants);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('Formação dos times');
    expect(text).toContain('JOGADORES DISPONÍVEIS');
  });

  it('2. renderiza countdown formatado no banner de turno', () => {
    const draft = createDraftSnapshot();
    const fix = setup(draft, participants, false, '00:45');

    const timer = fix.nativeElement.querySelector('.draft-turn-banner__timer');
    expect(timer.textContent).toContain('00:45');
  });

  it('3. mostra current picker quando viewer não pode escolher', () => {
    const draft = createDraftSnapshot({ currentPickerPlayerAccountId: 'p1' });
    const fix = setup(draft, participants, false);

    expect(fix.nativeElement.textContent).toContain('Vez de Captain Alpha');
  });

  it('4. mostra SUA VEZ DE ESCOLHER quando canDraftPick=true', () => {
    const draft = createDraftSnapshot({ currentPickerPlayerAccountId: 'p1' });
    const fix = setup(draft, participants, true);

    expect(fix.nativeElement.textContent).toContain('SUA VEZ DE ESCOLHER');
  });

  it('5. mostra available players no pool', () => {
    const draft = createDraftSnapshot();
    const fix = setup(draft, participants);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('Player Three');
    expect(text).toContain('Player Four');
  });

  it('6. oferece ação de pick apenas aos disponíveis quando canDraftPick=true e emite output ao clicar', () => {
    const draft = createDraftSnapshot();
    const fix = setup(draft, participants, true);

    const pickSpy = vi.fn();
    fix.componentInstance.pickPlayer.subscribe(pickSpy);

    const pickButtons = fix.nativeElement.querySelectorAll('.draft-btn--pick');
    expect(pickButtons.length).toBe(2);

    pickButtons[0].click();
    expect(pickSpy).toHaveBeenCalledWith('p3');
  });

  it('7. sem canDraftPick: pool permanece visível mas não há botões de pick ativos', () => {
    const draft = createDraftSnapshot();
    const fix = setup(draft, participants, false);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('Player Three');

    const pickButtons = fix.nativeElement.querySelectorAll('.draft-btn--pick');
    expect(pickButtons.length).toBe(0);
  });

  it('8. pending player fica desabilitado com feedback visual ESCOLHENDO...', () => {
    const draft = createDraftSnapshot();
    const fix = setup(draft, participants, true, '00:25', false, 'p3');

    const pickButtons = fix.nativeElement.querySelectorAll('.draft-btn--pick');
    expect(pickButtons[0].disabled).toBe(true);
    expect(pickButtons[0].textContent).toContain('ESCOLHENDO...');
  });

  it('9. phase COMPLETED: banner e badge de concluído aparecem, nenhuma ação de pick aparece', () => {
    const draft = createDraftSnapshot({ phase: 'COMPLETED' });
    const fix = setup(draft, participants, true);

    const text = fix.nativeElement.textContent;
    expect(text).toContain('DRAFT CONCLUÍDO');
    expect(text).toContain('Times definidos. Preparando próxima etapa.');

    const pickButtons = fix.nativeElement.querySelectorAll('.draft-btn--pick');
    expect(pickButtons.length).toBe(0);
  });

  it('10. mensagem de turno é aria-live="polite" e timer possui role="timer" sem live spam', () => {
    const draft = createDraftSnapshot({ currentPickerPlayerAccountId: 'p1' });
    const fix = setup(draft, participants, true);

    const turnLabel = fix.nativeElement.querySelector('.draft-turn-banner__badge');
    expect(turnLabel.getAttribute('aria-live')).toBe('polite');

    const timer = fix.nativeElement.querySelector('.draft-turn-banner__timer');
    expect(timer.getAttribute('role')).toBe('timer');
    expect(timer.getAttribute('aria-label')).toBe('Tempo restante: 00:30');
    expect(timer.getAttribute('aria-live')).toBeNull();
  });

  it('11. botão de pick possui nome acessível específico com nome do jogador', () => {
    const draft = createDraftSnapshot();
    const fix = setup(draft, participants, true);

    const pickButtons = fix.nativeElement.querySelectorAll('.draft-btn--pick');
    expect(pickButtons[0].getAttribute('aria-label')).toBe('Escolher Player Three');
    expect(pickButtons[1].getAttribute('aria-label')).toBe('Escolher Player Four');
  });

  it('12. candidato pending define aria-busy="true"', () => {
    const draft = createDraftSnapshot();
    const fix = setup(draft, participants, true, '00:25', false, 'p3');

    const pendingCard = fix.nativeElement.querySelector('.draft-candidate-card--pending');
    expect(pendingCard.getAttribute('aria-busy')).toBe('true');
  });
});
