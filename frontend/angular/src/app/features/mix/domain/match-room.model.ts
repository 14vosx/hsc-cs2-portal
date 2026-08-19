import type { PlayerPresentationReference } from '../../../core/player-presentation/player-presentation-reference.model';

export type MatchRoomStatus =
  | 'FORMING'
  | 'CONFIRMING'
  | 'SETUP'
  | 'READY'
  | 'PROVISIONING'
  | 'CANCELLED';

export type MatchRoomDraftPhase = 'PICKING' | 'COMPLETED';

export type MatchRoomDraftAssignmentSource =
  | 'CAPTAIN'
  | 'MANUAL_PICK'
  | 'TIMEOUT_AUTO_PICK'
  | 'LAST_REMAINING';

export interface MatchRoomDraftAssignment {
  readonly playerAccountId: string;
  readonly team: 'A' | 'B';
  readonly captain: boolean;
  readonly selectionOrder: number | null;
  readonly source: MatchRoomDraftAssignmentSource;
  readonly pickerPlayerAccountId: string | null;
  readonly assignedAt: string;
}

export interface MatchRoomDraftSnapshot {
  readonly phase: MatchRoomDraftPhase;
  readonly captains: {
    readonly teamAPlayerAccountId: string;
    readonly teamBPlayerAccountId: string;
  };
  readonly firstPickerPlayerAccountId: string;
  readonly currentPickerPlayerAccountId: string | null;
  readonly nextSelectionOrder: number | null;
  readonly pickDeadlineAt: string | null;
  readonly availablePlayerAccountIds: readonly string[];
  readonly assignments: readonly MatchRoomDraftAssignment[];
}

export type MatchRoomMapVetoPhase = 'BANNING' | 'COMPLETED';

export type MatchRoomMapVetoSource = 'MANUAL_BAN' | 'TIMEOUT_AUTO_BAN';

export interface MatchRoomMapVetoAction {
  readonly actionOrder: number;
  readonly mapKey: string;
  readonly actorPlayerAccountId: string;
  readonly source: MatchRoomMapVetoSource;
  readonly actedAt: string;
}

export interface MatchRoomMapVetoPoolMap {
  readonly key: string;
  readonly displayName: string;
  readonly position: number;
}

export interface MatchRoomMapVetoPool {
  readonly id: string;
  readonly key: string;
  readonly version: number;
  readonly maps: readonly MatchRoomMapVetoPoolMap[];
}

export interface MatchRoomMapVetoSnapshot {
  readonly phase: MatchRoomMapVetoPhase;
  readonly pool: MatchRoomMapVetoPool;
  readonly firstVetoerPlayerAccountId: string;
  readonly currentVetoerPlayerAccountId: string | null;
  readonly nextActionOrder: number | null;
  readonly actionDeadlineAt: string | null;
  readonly availableMapKeys: readonly string[];
  readonly selectedMapKey: string | null;
  readonly actions: readonly MatchRoomMapVetoAction[];
}

export interface CompetitiveMatchRosterEntry {
  readonly playerAccountId: string;
  readonly steamid64: string;
  readonly team: 'A' | 'B';
}

export interface CompetitiveMatchMap {
  readonly poolId: string;
  readonly poolKey: string;
  readonly poolVersion: number;
  readonly key: string;
  readonly displayName: string;
}

export interface CompetitiveMatchSnapshot {
  readonly id: string;
  readonly runtimeMatchId: number;
  readonly map: CompetitiveMatchMap;
  readonly roster: readonly CompetitiveMatchRosterEntry[];
}

export interface MatchRoomConfirmation {
  readonly round: number;
  readonly startedAt: string;
  readonly deadlineAt: string;
  readonly confirmedCount: number;
}

export interface MatchRoomParticipantConfirmation {
  readonly confirmed: boolean;
  readonly confirmedAt: string | null;
}

export interface MatchRoomParticipant {
  readonly playerAccountId: string;
  readonly player: PlayerPresentationReference | null;
  readonly joinedAt: string;
  readonly confirmation: MatchRoomParticipantConfirmation;
}

export interface MatchRoomViewerActions {
  readonly canJoin: boolean;
  readonly canLeave: boolean;
  readonly canCancel: boolean;
  readonly canConfirm: boolean;
  readonly canDraftPick: boolean;
  readonly canMapVetoBan: boolean;
}

export interface MatchRoomViewer {
  readonly participant: boolean;
  readonly creator: boolean;
  readonly actions: MatchRoomViewerActions;
}

export interface MatchRoomEntity {
  readonly id: string;
  readonly status: MatchRoomStatus;
  readonly version: number;
  readonly creator: {
    readonly playerAccountId: string;
  };
  readonly participantCount: number;
  readonly capacity: 10;
  readonly confirmation: MatchRoomConfirmation | null;
  readonly rosterLockedAt: string | null;
  readonly readyAt: string | null;
  readonly draft: MatchRoomDraftSnapshot | null;
  readonly mapVeto: MatchRoomMapVetoSnapshot | null;
  readonly competitiveMatch: CompetitiveMatchSnapshot | null;
  readonly participants: readonly MatchRoomParticipant[];
}

export interface MatchRoomSnapshot {
  readonly room: MatchRoomEntity;
  readonly viewer: MatchRoomViewer;
}
