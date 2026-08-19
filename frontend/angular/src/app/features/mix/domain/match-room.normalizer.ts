import { PlayerPresentationReference } from '../../../core/player-presentation/player-presentation-reference.model';
import {
  normalizePlayerPresentationReference,
} from '../../../core/player-presentation/player-presentation-reference.normalizer';
import type {
  CompetitiveMatchRosterEntry,
  CompetitiveMatchSnapshot,
  MatchRoomConfirmation,
  MatchRoomDraftAssignment,
  MatchRoomDraftAssignmentSource,
  MatchRoomDraftPhase,
  MatchRoomDraftSnapshot,
  MatchRoomEntity,
  MatchRoomMapVetoAction,
  MatchRoomMapVetoPhase,
  MatchRoomMapVetoPool,
  MatchRoomMapVetoPoolMap,
  MatchRoomMapVetoSnapshot,
  MatchRoomMapVetoSource,
  MatchRoomParticipant,
  MatchRoomParticipantConfirmation,
  MatchRoomSnapshot,
  MatchRoomStatus,
  MatchRoomViewer,
  MatchRoomViewerActions,
} from './match-room.model';

export class MatchRoomContractError extends Error {
  constructor(message = 'Invalid match room response contract') {
    super(message);
    this.name = 'MatchRoomContractError';
  }
}

const VALID_STATUSES: ReadonlySet<string> = new Set<MatchRoomStatus>([
  'FORMING',
  'CONFIRMING',
  'SETUP',
  'READY',
  'PROVISIONING',
  'CANCELLED',
]);

const VALID_DRAFT_PHASES = new Set<MatchRoomDraftPhase>(['PICKING', 'COMPLETED']);
const VALID_DRAFT_SOURCES = new Set<MatchRoomDraftAssignmentSource>([
  'CAPTAIN',
  'MANUAL_PICK',
  'TIMEOUT_AUTO_PICK',
  'LAST_REMAINING',
]);

const VALID_VETO_PHASES = new Set<MatchRoomMapVetoPhase>(['BANNING', 'COMPLETED']);
const VALID_VETO_SOURCES = new Set<MatchRoomMapVetoSource>(['MANUAL_BAN', 'TIMEOUT_AUTO_BAN']);

export function normalizeMatchRoomSingleEnvelope(payload: unknown): MatchRoomSnapshot {
  if (!isRecord(payload) || payload['ok'] !== true) {
    throw new MatchRoomContractError('Expected envelope with ok: true');
  }

  const matchRoom = payload['matchRoom'];
  return normalizeMatchRoomSnapshot(matchRoom);
}

export function normalizeMatchRoomListEnvelope(payload: unknown): readonly MatchRoomSnapshot[] {
  if (!isRecord(payload) || payload['ok'] !== true) {
    throw new MatchRoomContractError('Expected envelope with ok: true');
  }

  const matchRooms = payload['matchRooms'];
  if (!Array.isArray(matchRooms)) {
    throw new MatchRoomContractError('Expected matchRooms array in list envelope');
  }

  return matchRooms.map((item) => normalizeMatchRoomSnapshot(item));
}

export function normalizeMatchRoomCurrentEnvelope(payload: unknown): MatchRoomSnapshot | null {
  if (!isRecord(payload) || payload['ok'] !== true) {
    throw new MatchRoomContractError('Expected envelope with ok: true');
  }

  const matchRoom = payload['matchRoom'];
  if (matchRoom === null) {
    return null;
  }

  return normalizeMatchRoomSnapshot(matchRoom);
}

export function normalizeMatchRoomSnapshot(payload: unknown): MatchRoomSnapshot {
  if (!isRecord(payload)) {
    throw new MatchRoomContractError('MatchRoom snapshot must be an object');
  }

  const roomRaw = payload['room'];
  const viewerRaw = payload['viewer'];

  if (!isRecord(roomRaw) || !isRecord(viewerRaw)) {
    throw new MatchRoomContractError('Snapshot must contain room and viewer objects');
  }

  const room = normalizeMatchRoomEntity(roomRaw);
  const viewer = normalizeMatchRoomViewer(viewerRaw);

  return { room, viewer };
}

function normalizeMatchRoomEntity(input: Record<string, unknown>): MatchRoomEntity {
  const id = requiredString(input['id']);
  if (!id) {
    throw new MatchRoomContractError('Room id must be a non-empty string');
  }

  const statusRaw = input['status'];
  if (typeof statusRaw !== 'string' || !VALID_STATUSES.has(statusRaw)) {
    throw new MatchRoomContractError(`Invalid room status: ${String(statusRaw)}`);
  }
  const status = statusRaw as MatchRoomStatus;

  const version = input['version'];
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    throw new MatchRoomContractError('Room version must be an integer');
  }

  const capacity = input['capacity'];
  if (capacity !== 10) {
    throw new MatchRoomContractError(`Room capacity must be 10, got: ${String(capacity)}`);
  }

  const participantCount = input['participantCount'];
  if (
    typeof participantCount !== 'number' ||
    !Number.isInteger(participantCount) ||
    participantCount < 0 ||
    participantCount > 10
  ) {
    throw new MatchRoomContractError(`Invalid participantCount: ${String(participantCount)}`);
  }

  const creatorRaw = input['creator'];
  if (!isRecord(creatorRaw)) {
    throw new MatchRoomContractError('Room creator must be an object');
  }
  const creatorPlayerAccountId = requiredString(creatorRaw['playerAccountId']);
  if (!creatorPlayerAccountId) {
    throw new MatchRoomContractError('Room creator playerAccountId is required');
  }

  const rosterLockedAt = nullableString(input['rosterLockedAt']);
  const readyAt = nullableString(input['readyAt']);

  const confirmationRaw = input['confirmation'];
  let confirmation: MatchRoomConfirmation | null = null;
  if (confirmationRaw !== null && confirmationRaw !== undefined) {
    if (!isRecord(confirmationRaw)) {
      throw new MatchRoomContractError('Room confirmation must be an object or null');
    }
    const round = confirmationRaw['round'];
    const startedAt = requiredString(confirmationRaw['startedAt']);
    const deadlineAt = requiredString(confirmationRaw['deadlineAt']);
    const confirmedCount = confirmationRaw['confirmedCount'];

    if (
      typeof round !== 'number' ||
      !Number.isInteger(round) ||
      !startedAt ||
      !deadlineAt ||
      typeof confirmedCount !== 'number' ||
      !Number.isInteger(confirmedCount) ||
      confirmedCount < 0 ||
      confirmedCount > 10
    ) {
      throw new MatchRoomContractError('Invalid confirmation payload');
    }

    confirmation = {
      round,
      startedAt,
      deadlineAt,
      confirmedCount,
    };
  }

  const draft = normalizeMatchRoomDraftSnapshot(input['draft']);
  const mapVeto = normalizeMatchRoomMapVetoSnapshot(input['mapVeto']);
  const competitiveMatch = normalizeCompetitiveMatchSnapshot(input['competitiveMatch']);

  const participantsRaw = input['participants'];
  if (!Array.isArray(participantsRaw)) {
    throw new MatchRoomContractError('Room participants must be an array');
  }

  if (participantsRaw.length !== participantCount) {
    throw new MatchRoomContractError(
      `Participant count mismatch: declared ${participantCount}, array length ${participantsRaw.length}`,
    );
  }

  const seenParticipantIds = new Set<string>();
  const participants: MatchRoomParticipant[] = [];

  for (const pRaw of participantsRaw) {
    if (!isRecord(pRaw)) {
      throw new MatchRoomContractError('Participant must be an object');
    }

    const playerAccountId = requiredString(pRaw['playerAccountId']);
    if (!playerAccountId) {
      throw new MatchRoomContractError('Participant playerAccountId is required');
    }

    if (seenParticipantIds.has(playerAccountId)) {
      throw new MatchRoomContractError(`Duplicate participant playerAccountId: ${playerAccountId}`);
    }
    seenParticipantIds.add(playerAccountId);

    const joinedAt = requiredString(pRaw['joinedAt']);
    if (!joinedAt) {
      throw new MatchRoomContractError('Participant joinedAt is required');
    }

    const confRaw = pRaw['confirmation'];
    if (!isRecord(confRaw)) {
      throw new MatchRoomContractError('Participant confirmation must be an object');
    }

    const confirmed = confRaw['confirmed'];
    if (typeof confirmed !== 'boolean') {
      throw new MatchRoomContractError('Participant confirmation.confirmed must be boolean');
    }

    const confirmedAt = nullableString(confRaw['confirmedAt']);

    const participantConfirmation: MatchRoomParticipantConfirmation = {
      confirmed,
      confirmedAt,
    };

    const playerRaw = pRaw['player'];
    let player: PlayerPresentationReference | null = null;
    if (playerRaw !== null && playerRaw !== undefined) {
      const normalizedPlayer = normalizePlayerPresentationReference(playerRaw);
      if (!normalizedPlayer) {
        throw new MatchRoomContractError('Invalid participant player presentation payload');
      }
      player = normalizedPlayer;
    }

    participants.push({
      playerAccountId,
      player,
      joinedAt,
      confirmation: participantConfirmation,
    });
  }

  return {
    id,
    status,
    version,
    creator: { playerAccountId: creatorPlayerAccountId },
    participantCount,
    capacity: 10,
    confirmation,
    rosterLockedAt,
    readyAt,
    draft,
    mapVeto,
    competitiveMatch,
    participants,
  };
}

function normalizeMatchRoomDraftSnapshot(input: unknown): MatchRoomDraftSnapshot | null {
  if (input === null || input === undefined) return null;
  if (!isRecord(input)) {
    throw new MatchRoomContractError('Draft snapshot must be an object or null');
  }

  const phaseRaw = input['phase'];
  if (typeof phaseRaw !== 'string' || !VALID_DRAFT_PHASES.has(phaseRaw as MatchRoomDraftPhase)) {
    throw new MatchRoomContractError(`Invalid draft phase: ${String(phaseRaw)}`);
  }
  const phase = phaseRaw as MatchRoomDraftPhase;

  const captainsRaw = input['captains'];
  if (!isRecord(captainsRaw)) {
    throw new MatchRoomContractError('Draft captains must be an object');
  }
  const teamAPlayerAccountId = requiredString(captainsRaw['teamAPlayerAccountId']);
  const teamBPlayerAccountId = requiredString(captainsRaw['teamBPlayerAccountId']);
  if (!teamAPlayerAccountId || !teamBPlayerAccountId) {
    throw new MatchRoomContractError('Draft captains team A and B player account IDs are required');
  }

  const firstPickerPlayerAccountId = requiredString(input['firstPickerPlayerAccountId']);
  if (!firstPickerPlayerAccountId) {
    throw new MatchRoomContractError('Draft firstPickerPlayerAccountId is required');
  }

  const currentPickerPlayerAccountId = nullableString(input['currentPickerPlayerAccountId']);

  const nextSelectionOrder = input['nextSelectionOrder'];
  if (
    nextSelectionOrder !== null &&
    (typeof nextSelectionOrder !== 'number' || !Number.isInteger(nextSelectionOrder))
  ) {
    throw new MatchRoomContractError('Draft nextSelectionOrder must be an integer or null');
  }

  const pickDeadlineAt = nullableString(input['pickDeadlineAt']);

  const availableRaw = input['availablePlayerAccountIds'];
  if (!Array.isArray(availableRaw)) {
    throw new MatchRoomContractError('Draft availablePlayerAccountIds must be an array');
  }
  const availablePlayerAccountIds: string[] = [];
  for (const idRaw of availableRaw) {
    const id = requiredString(idRaw);
    if (!id) {
      throw new MatchRoomContractError('Draft availablePlayerAccountId must be a non-empty string');
    }
    availablePlayerAccountIds.push(id);
  }

  const assignmentsRaw = input['assignments'];
  if (!Array.isArray(assignmentsRaw)) {
    throw new MatchRoomContractError('Draft assignments must be an array');
  }

  const assignments: MatchRoomDraftAssignment[] = [];
  for (const aRaw of assignmentsRaw) {
    if (!isRecord(aRaw)) {
      throw new MatchRoomContractError('Draft assignment must be an object');
    }
    const playerAccountId = requiredString(aRaw['playerAccountId']);
    if (!playerAccountId) {
      throw new MatchRoomContractError('Draft assignment playerAccountId is required');
    }
    const team = aRaw['team'];
    if (team !== 'A' && team !== 'B') {
      throw new MatchRoomContractError(`Invalid draft assignment team: ${String(team)}`);
    }
    const captain = aRaw['captain'];
    if (typeof captain !== 'boolean') {
      throw new MatchRoomContractError('Draft assignment captain must be a boolean');
    }
    const selectionOrder = aRaw['selectionOrder'];
    if (
      selectionOrder !== null &&
      (typeof selectionOrder !== 'number' || !Number.isInteger(selectionOrder))
    ) {
      throw new MatchRoomContractError('Draft assignment selectionOrder must be an integer or null');
    }
    const sourceRaw = aRaw['source'];
    if (
      typeof sourceRaw !== 'string' ||
      !VALID_DRAFT_SOURCES.has(sourceRaw as MatchRoomDraftAssignmentSource)
    ) {
      throw new MatchRoomContractError(`Invalid draft assignment source: ${String(sourceRaw)}`);
    }
    const source = sourceRaw as MatchRoomDraftAssignmentSource;
    const pickerPlayerAccountId = nullableString(aRaw['pickerPlayerAccountId']);
    const assignedAt = requiredString(aRaw['assignedAt']);
    if (!assignedAt) {
      throw new MatchRoomContractError('Draft assignment assignedAt is required');
    }

    assignments.push({
      playerAccountId,
      team,
      captain,
      selectionOrder,
      source,
      pickerPlayerAccountId,
      assignedAt,
    });
  }

  return {
    phase,
    captains: {
      teamAPlayerAccountId,
      teamBPlayerAccountId,
    },
    firstPickerPlayerAccountId,
    currentPickerPlayerAccountId,
    nextSelectionOrder,
    pickDeadlineAt,
    availablePlayerAccountIds,
    assignments,
  };
}

function normalizeMatchRoomMapVetoSnapshot(input: unknown): MatchRoomMapVetoSnapshot | null {
  if (input === null || input === undefined) return null;
  if (!isRecord(input)) {
    throw new MatchRoomContractError('Map Veto snapshot must be an object or null');
  }

  const phaseRaw = input['phase'];
  if (typeof phaseRaw !== 'string' || !VALID_VETO_PHASES.has(phaseRaw as MatchRoomMapVetoPhase)) {
    throw new MatchRoomContractError(`Invalid map veto phase: ${String(phaseRaw)}`);
  }
  const phase = phaseRaw as MatchRoomMapVetoPhase;

  const poolRaw = input['pool'];
  if (!isRecord(poolRaw)) {
    throw new MatchRoomContractError('Map Veto pool must be an object');
  }
  const poolId = requiredString(poolRaw['id']);
  const poolKey = requiredString(poolRaw['key']);
  const poolVersion = poolRaw['version'];
  if (!poolId || !poolKey || typeof poolVersion !== 'number' || !Number.isInteger(poolVersion)) {
    throw new MatchRoomContractError('Invalid map veto pool metadata');
  }
  const mapsRaw = poolRaw['maps'];
  if (!Array.isArray(mapsRaw)) {
    throw new MatchRoomContractError('Map Veto pool maps must be an array');
  }
  const poolMaps: MatchRoomMapVetoPoolMap[] = [];
  for (const mRaw of mapsRaw) {
    if (!isRecord(mRaw)) {
      throw new MatchRoomContractError('Map Veto pool map item must be an object');
    }
    const key = requiredString(mRaw['key']);
    const displayName = requiredString(mRaw['displayName']);
    const position = mRaw['position'];
    if (!key || !displayName || typeof position !== 'number' || !Number.isInteger(position)) {
      throw new MatchRoomContractError('Invalid map veto pool map entry');
    }
    poolMaps.push({ key, displayName, position });
  }
  const pool: MatchRoomMapVetoPool = {
    id: poolId,
    key: poolKey,
    version: poolVersion,
    maps: poolMaps,
  };

  const firstVetoerPlayerAccountId = requiredString(input['firstVetoerPlayerAccountId']);
  if (!firstVetoerPlayerAccountId) {
    throw new MatchRoomContractError('Map Veto firstVetoerPlayerAccountId is required');
  }

  const currentVetoerPlayerAccountId = nullableString(input['currentVetoerPlayerAccountId']);

  const nextActionOrder = input['nextActionOrder'];
  if (
    nextActionOrder !== null &&
    (typeof nextActionOrder !== 'number' || !Number.isInteger(nextActionOrder))
  ) {
    throw new MatchRoomContractError('Map Veto nextActionOrder must be an integer or null');
  }

  const actionDeadlineAt = nullableString(input['actionDeadlineAt']);

  const availableRaw = input['availableMapKeys'];
  if (!Array.isArray(availableRaw)) {
    throw new MatchRoomContractError('Map Veto availableMapKeys must be an array');
  }
  const availableMapKeys: string[] = [];
  for (const kRaw of availableRaw) {
    const key = requiredString(kRaw);
    if (!key) {
      throw new MatchRoomContractError('Map Veto availableMapKey must be a non-empty string');
    }
    availableMapKeys.push(key);
  }

  const selectedMapKey = nullableString(input['selectedMapKey']);

  const actionsRaw = input['actions'];
  if (!Array.isArray(actionsRaw)) {
    throw new MatchRoomContractError('Map Veto actions must be an array');
  }
  const actions: MatchRoomMapVetoAction[] = [];
  for (const actRaw of actionsRaw) {
    if (!isRecord(actRaw)) {
      throw new MatchRoomContractError('Map Veto action must be an object');
    }
    const actionOrder = actRaw['actionOrder'];
    if (typeof actionOrder !== 'number' || !Number.isInteger(actionOrder)) {
      throw new MatchRoomContractError('Map Veto actionOrder must be an integer');
    }
    const mapKey = requiredString(actRaw['mapKey']);
    const actorPlayerAccountId = requiredString(actRaw['actorPlayerAccountId']);
    if (!mapKey || !actorPlayerAccountId) {
      throw new MatchRoomContractError('Map Veto action mapKey and actorPlayerAccountId are required');
    }
    const sourceRaw = actRaw['source'];
    if (
      typeof sourceRaw !== 'string' ||
      !VALID_VETO_SOURCES.has(sourceRaw as MatchRoomMapVetoSource)
    ) {
      throw new MatchRoomContractError(`Invalid map veto action source: ${String(sourceRaw)}`);
    }
    const source = sourceRaw as MatchRoomMapVetoSource;
    const actedAt = requiredString(actRaw['actedAt']);
    if (!actedAt) {
      throw new MatchRoomContractError('Map Veto action actedAt is required');
    }
    actions.push({ actionOrder, mapKey, actorPlayerAccountId, source, actedAt });
  }

  return {
    phase,
    pool,
    firstVetoerPlayerAccountId,
    currentVetoerPlayerAccountId,
    nextActionOrder,
    actionDeadlineAt,
    availableMapKeys,
    selectedMapKey,
    actions,
  };
}

function normalizeCompetitiveMatchSnapshot(input: unknown): CompetitiveMatchSnapshot | null {
  if (input === null || input === undefined) return null;
  if (!isRecord(input)) {
    throw new MatchRoomContractError('Competitive match snapshot must be an object or null');
  }

  const id = requiredString(input['id']);
  const runtimeMatchId = input['runtimeMatchId'];
  if (!id || typeof runtimeMatchId !== 'number' || !Number.isInteger(runtimeMatchId)) {
    throw new MatchRoomContractError('Invalid competitive match id or runtimeMatchId');
  }

  const mapRaw = input['map'];
  if (!isRecord(mapRaw)) {
    throw new MatchRoomContractError('Competitive match map must be an object');
  }
  const poolId = requiredString(mapRaw['poolId']);
  const poolKey = requiredString(mapRaw['poolKey']);
  const poolVersion = mapRaw['poolVersion'];
  const key = requiredString(mapRaw['key']);
  const displayName = requiredString(mapRaw['displayName']);
  if (
    !poolId ||
    !poolKey ||
    typeof poolVersion !== 'number' ||
    !Number.isInteger(poolVersion) ||
    !key ||
    !displayName
  ) {
    throw new MatchRoomContractError('Invalid competitive match map details');
  }

  const rosterRaw = input['roster'];
  if (!Array.isArray(rosterRaw)) {
    throw new MatchRoomContractError('Competitive match roster must be an array');
  }
  const roster: CompetitiveMatchRosterEntry[] = [];
  for (const rRaw of rosterRaw) {
    if (!isRecord(rRaw)) {
      throw new MatchRoomContractError('Competitive match roster entry must be an object');
    }
    const playerAccountId = requiredString(rRaw['playerAccountId']);
    const steamid64 = requiredString(rRaw['steamid64']);
    const team = rRaw['team'];
    if (!playerAccountId || !steamid64 || (team !== 'A' && team !== 'B')) {
      throw new MatchRoomContractError('Invalid competitive match roster entry');
    }
    roster.push({ playerAccountId, steamid64, team });
  }

  return {
    id,
    runtimeMatchId,
    map: {
      poolId,
      poolKey,
      poolVersion,
      key,
      displayName,
    },
    roster,
  };
}

function normalizeMatchRoomViewer(input: Record<string, unknown>): MatchRoomViewer {
  const participant = input['participant'];
  const creator = input['creator'];
  const actionsRaw = input['actions'];

  if (typeof participant !== 'boolean' || typeof creator !== 'boolean' || !isRecord(actionsRaw)) {
    throw new MatchRoomContractError('Invalid viewer object shape');
  }

  const canJoin = actionsRaw['canJoin'];
  const canLeave = actionsRaw['canLeave'];
  const canCancel = actionsRaw['canCancel'];
  const canConfirm = actionsRaw['canConfirm'];
  const canDraftPick = actionsRaw['canDraftPick'];
  const canMapVetoBan = actionsRaw['canMapVetoBan'];

  if (
    typeof canJoin !== 'boolean' ||
    typeof canLeave !== 'boolean' ||
    typeof canCancel !== 'boolean' ||
    typeof canConfirm !== 'boolean' ||
    typeof canDraftPick !== 'boolean' ||
    typeof canMapVetoBan !== 'boolean'
  ) {
    throw new MatchRoomContractError('Invalid viewer actions booleans');
  }

  const actions: MatchRoomViewerActions = {
    canJoin,
    canLeave,
    canCancel,
    canConfirm,
    canDraftPick,
    canMapVetoBan,
  };

  return {
    participant,
    creator,
    actions,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return requiredString(value);
}
