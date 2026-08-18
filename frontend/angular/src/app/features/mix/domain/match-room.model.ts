import type { PlayerPresentationReference } from '../../../core/player-presentation/player-presentation-reference.model';

export type MatchRoomStatus = 'FORMING' | 'CONFIRMING' | 'SETUP' | 'CANCELLED';

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
  readonly participants: readonly MatchRoomParticipant[];
}

export interface MatchRoomSnapshot {
  readonly room: MatchRoomEntity;
  readonly viewer: MatchRoomViewer;
}
