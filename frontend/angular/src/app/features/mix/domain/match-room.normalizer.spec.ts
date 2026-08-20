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
  const { actions: actionsOverrideRaw, ...viewerOverrides } = overrides;
  const actionsOverride = (actionsOverrideRaw as Record<string, unknown> | undefined) || {};
  return {
    participant: true,
    creator: true,
    actions: {
      canJoin: false,
      canLeave: false,
      canCancel: true,
      canConfirm: false,
      canDraftPick: false,
      canMapVetoBan: false,
      canJoinServer: false,
      ...actionsOverride,
    },
    join: null,
    ...viewerOverrides,
  };
}

function createValidDraftSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    phase: 'PICKING',
    captains: {
      teamAPlayerAccountId: 'player-1',
      teamBPlayerAccountId: 'player-2',
    },
    firstPickerPlayerAccountId: 'player-1',
    currentPickerPlayerAccountId: 'player-1',
    nextSelectionOrder: 1,
    pickDeadlineAt: '2026-08-17T20:05:00Z',
    availablePlayerAccountIds: ['player-3', 'player-4'],
    assignments: [
      {
        playerAccountId: 'player-1',
        team: 'A',
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

function createValidMapVetoSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    phase: 'BANNING',
    pool: {
      id: 'pool-1',
      key: 'active_duty',
      version: 1,
      maps: [
        { key: 'de_mirage', displayName: 'Mirage', position: 1 },
        { key: 'de_inferno', displayName: 'Inferno', position: 2 },
      ],
    },
    firstVetoerPlayerAccountId: 'player-1',
    currentVetoerPlayerAccountId: 'player-1',
    nextActionOrder: 1,
    actionDeadlineAt: '2026-08-17T20:10:00Z',
    availableMapKeys: ['de_mirage', 'de_inferno'],
    selectedMapKey: null,
    actions: [
      {
        actionOrder: 1,
        mapKey: 'de_nuke',
        actorPlayerAccountId: 'player-2',
        source: 'MANUAL_BAN',
        actedAt: '2026-08-17T20:08:00Z',
      },
    ],
    ...overrides,
  };
}

function createValidCompetitiveMatchSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cm-123',
    runtimeMatchId: 456,
    map: {
      poolId: 'pool-1',
      poolKey: 'active_duty',
      poolVersion: 1,
      key: 'de_mirage',
      displayName: 'Mirage',
    },
    roster: [
      {
        playerAccountId: 'player-1',
        steamid64: '76561198000000001',
        team: 'A',
      },
    ],
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
    expect(normalized.viewer.actions.canDraftPick).toBe(false);
    expect(normalized.viewer.actions.canMapVetoBan).toBe(false);
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
          canDraftPick: false,
          canMapVetoBan: false,
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

  it('1. normaliza snapshot SETUP com Draft válido e preserve o Draft', () => {
    const raw = createValidSnapshot({
      status: 'SETUP',
      draft: createValidDraftSnapshot(),
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.status).toBe('SETUP');
    expect(normalized.room.draft?.phase).toBe('PICKING');
    expect(normalized.room.draft?.captains.teamAPlayerAccountId).toBe('player-1');
  });

  it('2. normaliza Draft assignment completo', () => {
    const draft = createValidDraftSnapshot({
      assignments: [
        {
          playerAccountId: 'player-3',
          team: 'B',
          captain: false,
          selectionOrder: 1,
          source: 'MANUAL_PICK',
          pickerPlayerAccountId: 'player-2',
          assignedAt: '2026-08-17T20:02:00Z',
        },
      ],
    });
    const raw = createValidSnapshot({ draft });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.draft?.assignments[0].source).toBe('MANUAL_PICK');
    expect(normalized.room.draft?.assignments[0].team).toBe('B');
  });

  it('3. normaliza Draft assignment com TIMEOUT_AUTO_PICK e LAST_REMAINING', () => {
    const draft = createValidDraftSnapshot({
      assignments: [
        {
          playerAccountId: 'player-4',
          team: 'A',
          captain: false,
          selectionOrder: 2,
          source: 'TIMEOUT_AUTO_PICK',
          pickerPlayerAccountId: null,
          assignedAt: '2026-08-17T20:03:00Z',
        },
        {
          playerAccountId: 'player-5',
          team: 'B',
          captain: false,
          selectionOrder: 3,
          source: 'LAST_REMAINING',
          pickerPlayerAccountId: null,
          assignedAt: '2026-08-17T20:04:00Z',
        },
      ],
    });
    const raw = createValidSnapshot({ draft });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.draft?.assignments[0].source).toBe('TIMEOUT_AUTO_PICK');
    expect(normalized.room.draft?.assignments[1].source).toBe('LAST_REMAINING');
  });

  it('4. normaliza snapshot com Map Veto válido', () => {
    const raw = createValidSnapshot({
      status: 'SETUP',
      mapVeto: createValidMapVetoSnapshot(),
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.mapVeto?.phase).toBe('BANNING');
    expect(normalized.room.mapVeto?.pool.key).toBe('active_duty');
  });

  it('5. normaliza Veto action completa', () => {
    const raw = createValidSnapshot({
      mapVeto: createValidMapVetoSnapshot({
        actions: [
          {
            actionOrder: 1,
            mapKey: 'de_nuke',
            actorPlayerAccountId: 'player-2',
            source: 'MANUAL_BAN',
            actedAt: '2026-08-17T20:08:00Z',
          },
        ],
      }),
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.mapVeto?.actions[0].mapKey).toBe('de_nuke');
  });

  it('6. normaliza TIMEOUT_AUTO_BAN', () => {
    const raw = createValidSnapshot({
      mapVeto: createValidMapVetoSnapshot({
        actions: [
          {
            actionOrder: 1,
            mapKey: 'de_dust2',
            actorPlayerAccountId: 'player-1',
            source: 'TIMEOUT_AUTO_BAN',
            actedAt: '2026-08-17T20:09:00Z',
          },
        ],
      }),
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.mapVeto?.actions[0].source).toBe('TIMEOUT_AUTO_BAN');
  });

  it('7. normaliza selectedMapKey no Map Veto', () => {
    const raw = createValidSnapshot({
      mapVeto: createValidMapVetoSnapshot({
        phase: 'COMPLETED',
        selectedMapKey: 'de_mirage',
      }),
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.mapVeto?.selectedMapKey).toBe('de_mirage');
  });

  it('8. normaliza snapshot READY com CompetitiveMatch e readyAt', () => {
    const raw = createValidSnapshot({
      status: 'READY',
      readyAt: '2026-08-17T20:15:00Z',
      competitiveMatch: createValidCompetitiveMatchSnapshot(),
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.status).toBe('READY');
    expect(normalized.room.readyAt).toBe('2026-08-17T20:15:00Z');
    expect(normalized.room.competitiveMatch?.runtimeMatchId).toBe(456);
    expect(normalized.room.competitiveMatch?.map.key).toBe('de_mirage');
  });

  it('9. normaliza snapshot PROVISIONING', () => {
    const raw = createValidSnapshot({
      status: 'PROVISIONING',
      readyAt: '2026-08-17T20:15:00Z',
    });
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.room.status).toBe('PROVISIONING');
  });

  it('10. normaliza viewer actions canDraftPick e canMapVetoBan', () => {
    const raw = createValidSnapshot(
      {},
      {
        actions: {
          canJoin: false,
          canLeave: true,
          canCancel: false,
          canConfirm: false,
          canDraftPick: true,
          canMapVetoBan: true,
        },
      },
    );
    const normalized = normalizeMatchRoomSnapshot(raw);
    expect(normalized.viewer.actions.canDraftPick).toBe(true);
    expect(normalized.viewer.actions.canMapVetoBan).toBe(true);
  });

  it('11. rejeita phase, source e team inválidos em Draft e Veto', () => {
    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot({ draft: createValidDraftSnapshot({ phase: 'INVALID' }) }),
      ),
    ).toThrow(MatchRoomContractError);

    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot({
          draft: createValidDraftSnapshot({
            assignments: [
              {
                playerAccountId: 'player-1',
                team: 'C',
                captain: true,
                selectionOrder: null,
                source: 'CAPTAIN',
                pickerPlayerAccountId: null,
                assignedAt: '2026-08-17T20:00:00Z',
              },
            ],
          }),
        }),
      ),
    ).toThrow(MatchRoomContractError);

    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot({
          mapVeto: createValidMapVetoSnapshot({
            actions: [
              {
                actionOrder: 1,
                mapKey: 'de_mirage',
                actorPlayerAccountId: 'player-1',
                source: 'UNKNOWN_BAN',
                actedAt: '2026-08-17T20:00:00Z',
              },
            ],
          }),
        }),
      ),
    ).toThrow(MatchRoomContractError);
  });

  it('12. rejeita CompetitiveMatch malformed', () => {
    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot({
          competitiveMatch: createValidCompetitiveMatchSnapshot({
            runtimeMatchId: 'not-a-number',
          }),
        }),
      ),
    ).toThrow(MatchRoomContractError);

    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot({
          competitiveMatch: createValidCompetitiveMatchSnapshot({
            roster: [{ playerAccountId: 'p1', steamid64: '123', team: 'INVALID' }],
          }),
        }),
      ),
    ).toThrow(MatchRoomContractError);
  });

  it('13. aceita status JOINABLE e FAILED', () => {
    const joinable = normalizeMatchRoomSnapshot(
      createValidSnapshot(
        { status: 'JOINABLE' },
        createValidViewer({
          actions: { canJoinServer: true },
          join: {
            serverKey: 'srv-1',
            reference: 'connect ops.haxixesmokeclub.com:27015',
            launchUri: 'steam://connect/ops.haxixesmokeclub.com:27015',
          },
        }),
      ),
    );
    expect(joinable.room.status).toBe('JOINABLE');
    expect(joinable.viewer.actions.canJoinServer).toBe(true);

    const failed = normalizeMatchRoomSnapshot(
      createValidSnapshot({ status: 'FAILED' }),
    );
    expect(failed.room.status).toBe('FAILED');
    expect(failed.viewer.actions.canJoinServer).toBe(false);
  });

  it('14. preserva literalmente serverKey, reference e launchUri no join valido', () => {
    const reference = 'connect ops.haxixesmokeclub.com:27015';
    const launchUri = 'steam://connect/ops.haxixesmokeclub.com:27015';
    const snapshot = normalizeMatchRoomSnapshot(
      createValidSnapshot(
        { status: 'JOINABLE' },
        createValidViewer({
          actions: { canJoinServer: true },
          join: {
            serverKey: 'srv-key-99',
            reference,
            launchUri,
          },
        }),
      ),
    );

    expect(snapshot.viewer.join).toEqual({
      serverKey: 'srv-key-99',
      reference: 'connect ops.haxixesmokeclub.com:27015',
      launchUri: 'steam://connect/ops.haxixesmokeclub.com:27015',
    });
  });

  it('15. rejeita join com missing reference (A), missing launchUri (B) e blank launchUri (C)', () => {
    // A. missing reference
    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot(
          { status: 'JOINABLE' },
          createValidViewer({
            actions: { canJoinServer: true },
            join: {
              serverKey: 'srv-1',
              launchUri: 'steam://connect/ops.haxixesmokeclub.com:27015',
            },
          }),
        ),
      ),
    ).toThrow(MatchRoomContractError);

    // B. missing launchUri
    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot(
          { status: 'JOINABLE' },
          createValidViewer({
            actions: { canJoinServer: true },
            join: {
              serverKey: 'srv-1',
              reference: 'connect ops.haxixesmokeclub.com:27015',
            },
          }),
        ),
      ),
    ).toThrow(MatchRoomContractError);

    // C. blank launchUri
    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot(
          { status: 'JOINABLE' },
          createValidViewer({
            actions: { canJoinServer: true },
            join: {
              serverKey: 'srv-1',
              reference: 'connect ops.haxixesmokeclub.com:27015',
              launchUri: '   ',
            },
          }),
        ),
      ),
    ).toThrow(MatchRoomContractError);

    // Blank reference
    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot(
          { status: 'JOINABLE' },
          createValidViewer({
            actions: { canJoinServer: true },
            join: {
              serverKey: 'srv-1',
              reference: '   ',
              launchUri: 'steam://connect/ops.haxixesmokeclub.com:27015',
            },
          }),
        ),
      ),
    ).toThrow(MatchRoomContractError);
  });

  it('16. rejeita canJoinServer=true com join=null (D)', () => {
    expect(() =>
      normalizeMatchRoomSnapshot(
        createValidSnapshot(
          { status: 'JOINABLE' },
          createValidViewer({
            actions: { canJoinServer: true },
            join: null,
          }),
        ),
      ),
    ).toThrow(MatchRoomContractError);
  });
});
