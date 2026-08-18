import { PlayerPresentationReference } from '../../../core/player-presentation/player-presentation-reference.model';
import {
  normalizePlayerPresentationReference,
} from '../../../core/player-presentation/player-presentation-reference.normalizer';
import type {
  MatchRoomConfirmation,
  MatchRoomEntity,
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
  'CANCELLED',
]);

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
    participants,
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

  if (
    typeof canJoin !== 'boolean' ||
    typeof canLeave !== 'boolean' ||
    typeof canCancel !== 'boolean' ||
    typeof canConfirm !== 'boolean'
  ) {
    throw new MatchRoomContractError('Invalid viewer actions booleans');
  }

  const actions: MatchRoomViewerActions = {
    canJoin,
    canLeave,
    canCancel,
    canConfirm,
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
