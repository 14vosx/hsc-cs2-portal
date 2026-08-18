import { describe, expect, it } from 'vitest';
import {
  MatchRoomContractError,
  normalizeMatchRoomCurrentEnvelope,
  normalizeMatchRoomListEnvelope,
  normalizeMatchRoomSingleEnvelope,
  normalizeMatchRoomSnapshot,
} from './match-room.normalizer';

function createValidParticipant(id = 'player-1', confirmed = false, hasPlayer = true) {
  return {
    playerAccountId: id,
    player: hasPlayer
      ? {
          steam: {
            steamId64: '76561198000000001',
            personaname: 'Player One',
            avatarMediumUrl: 'https://avatar.jpg',
          },
          profile: {
            slug: 'player-one',
          },
        }
      : null,
    joinedAt: '2026-08-17T20:00:00Z',
    confirmation: {
      confirmed,
      confirmedAt: confirmed ? '2026-08-17T20:01:00Z' : null,
    },
  };
}

function createValidRoom(overrides: Record<string, unknown> = {}) {
  return {
    id: 'room-123',
    status: 'FORMING',
    version: 1,
    creator: {
      playerAccountId: 'player-1',
    },
    participantCount: 1,
    capacity: 10,
    confirmation: null,
    rosterLockedAt: null,
    participants: [createValidParticipant('player-1')],
    ...overrides,
  };
}

function createValidViewer(overrides: Record<string, unknown> = {}) {
  return {
    participant: true,
    creator: true,
    actions: {
      canJoin: false,
      canLeave: false,
      canCancel: true,
      canConfirm: false,
    },
    ...overrides,
  };
}

function createValidSnapshot(
  roomOverrides: Record<string, unknown> = {},
  viewerOverrides: Record<string, unknown> = {},
) {
  return {
    room: createValidRoom(roomOverrides),
    viewer: createValidViewer(viewerOverrides),
  };
}

describe('MatchRoom Normalizer', () => {
  it('normaliza com sucesso um snapshot válido com player presentation preenchido', () => {
    const raw = createValidSnapshot();
    const normalized = normalizeMatchRoomSnapshot(raw);

    expect(normalized.room.id).toBe('room-123');
    expect(normalized.room.status).toBe('FORMING');
    expect(normalized.room.version).toBe(1);
    expect(normalized.room.capacity).toBe(10);
    expect(normalized.room.creator.playerAccountId).toBe('player-1');
    expect(normalized.room.participants[0].player?.steam.personaname).toBe('Player One');
    expect(normalized.room.participants[0].player?.profile?.slug).toBe('player-one');
    expect(normalized.viewer.actions.canCancel).toBe(true);
  });

  it('aceita player: null sem erros de contrato', () => {
    const raw = createValidSnapshot({
      participants: [createValidParticipant('player-1', false, false)],
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.participants[0].player).toBeNull();
  });

  it('falha com MatchRoomContractError se player for um objeto malformed e NÃO converte em null', () => {
    const raw = createValidSnapshot({
      participants: [
        {
          playerAccountId: 'player-1',
          player: {
            steam: {
              steamId64: 'invalid-steam-id',
              personaname: 'Invalid',
              avatarMediumUrl: null,
            },
            profile: null,
          },
          joinedAt: '2026-08-17T20:00:00Z',
          confirmation: { confirmed: false, confirmedAt: null },
        },
      ],
    });

    expect(() => normalizeMatchRoomSnapshot(raw)).toThrow(MatchRoomContractError);
  });

  it('normaliza envelope de lista (matchRooms)', () => {
    const envelope = {
      ok: true,
      matchRooms: [createValidSnapshot({ id: 'room-1' }), createValidSnapshot({ id: 'room-2' })],
    };

    const list = normalizeMatchRoomListEnvelope(envelope);
    expect(list.length).toBe(2);
    expect(list[0].room.id).toBe('room-1');
    expect(list[1].room.id).toBe('room-2');
  });

  it('normaliza envelope de snapshot único (matchRoom)', () => {
    const envelope = {
      ok: true,
      matchRoom: createValidSnapshot({ id: 'room-abc' }),
    };

    const result = normalizeMatchRoomSingleEnvelope(envelope);
    expect(result.room.id).toBe('room-abc');
  });

  it('normaliza envelope de current com snapshot ou null', () => {
    const envelopeWithRoom = {
      ok: true,
      matchRoom: createValidSnapshot({ id: 'current-room' }),
    };
    expect(normalizeMatchRoomCurrentEnvelope(envelopeWithRoom)?.room.id).toBe('current-room');

    const envelopeNull = {
      ok: true,
      matchRoom: null,
    };
    expect(normalizeMatchRoomCurrentEnvelope(envelopeNull)).toBeNull();
  });

  it('falha se envelope ok !== true', () => {
    expect(() => normalizeMatchRoomSingleEnvelope({ ok: false })).toThrow(MatchRoomContractError);
    expect(() => normalizeMatchRoomListEnvelope({ ok: false, matchRooms: [] })).toThrow(
      MatchRoomContractError,
    );
  });

  it('falha se status for inválido', () => {
    const raw = createValidSnapshot({ status: 'INVALID_STATUS' });
    expect(() => normalizeMatchRoomSnapshot(raw)).toThrow(MatchRoomContractError);
  });

  it('falha se capacity for diferente de 10', () => {
    const raw = createValidSnapshot({ capacity: 8 });
    expect(() => normalizeMatchRoomSnapshot(raw)).toThrow(MatchRoomContractError);
  });

  it('falha se participantCount for incoerente com o tamanho do array participants', () => {
    const raw = createValidSnapshot({
      participantCount: 2,
      participants: [createValidParticipant('player-1')],
    });
    expect(() => normalizeMatchRoomSnapshot(raw)).toThrow(MatchRoomContractError);
  });

  it('falha se houver participantes duplicados por playerAccountId', () => {
    const raw = createValidSnapshot({
      participantCount: 2,
      participants: [createValidParticipant('player-1'), createValidParticipant('player-1')],
    });
    expect(() => normalizeMatchRoomSnapshot(raw)).toThrow(MatchRoomContractError);
  });

  it('falha se viewer actions não forem booleanas', () => {
    const raw = createValidSnapshot(
      {},
      {
        actions: {
          canJoin: 'true',
          canLeave: false,
          canCancel: false,
          canConfirm: false,
        },
      },
    );
    expect(() => normalizeMatchRoomSnapshot(raw)).toThrow(MatchRoomContractError);
  });

  it('normaliza estado CONFIRMING com objeto confirmation válido', () => {
    const raw = createValidSnapshot({
      status: 'CONFIRMING',
      confirmation: {
        round: 1,
        startedAt: '2026-08-17T20:00:00Z',
        deadlineAt: '2026-08-17T20:00:30Z',
        confirmedCount: 1,
      },
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.status).toBe('CONFIRMING');
    expect(normalized.room.confirmation?.round).toBe(1);
    expect(normalized.room.confirmation?.confirmedCount).toBe(1);
  });

  it('falha se confirmation for malformed', () => {
    const raw = createValidSnapshot({
      status: 'CONFIRMING',
      confirmation: {
        round: 'first',
        startedAt: '2026-08-17T20:00:00Z',
        deadlineAt: '',
        confirmedCount: 15,
      },
    });
    expect(() => normalizeMatchRoomSnapshot(raw)).toThrow(MatchRoomContractError);
  });
});
