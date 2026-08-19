import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { MatchRoomSnapshot } from '../domain/match-room.model';
import {
  extractMatchRoomErrorCode,
  mapMatchRoomErrorToI18nKey,
  MatchRoomApiService,
} from './match-room-api.service';

function createValidRawSnapshot(id = 'room-1') {
  return {
    room: {
      id,
      status: 'FORMING',
      version: 1,
      creator: { playerAccountId: 'player-1' },
      participantCount: 1,
      capacity: 10,
      confirmation: null,
      rosterLockedAt: null,
      readyAt: null,
      draft: null,
      mapVeto: null,
      competitiveMatch: null,
      participants: [
        {
          playerAccountId: 'player-1',
          player: null,
          joinedAt: '2026-08-17T20:00:00Z',
          confirmation: { confirmed: false, confirmedAt: null },
        },
      ],
    },
    viewer: {
      participant: true,
      creator: true,
      actions: {
        canJoin: false,
        canLeave: false,
        canCancel: true,
        canConfirm: false,
        canDraftPick: false,
        canMapVetoBan: false,
      },
    },
  };
}

describe('MatchRoomApiService', () => {
  let service: MatchRoomApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(MatchRoomApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('listMatchRooms faz GET autenticado para /player/match-rooms', () => {
    let result: readonly MatchRoomSnapshot[] | undefined;
    service.listMatchRooms().subscribe((data) => (result = data));

    const req = http.expectOne(cs2ApiPaths.playerMatchRooms);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);

    req.flush({
      ok: true,
      matchRooms: [createValidRawSnapshot('room-1'), createValidRawSnapshot('room-2')],
    });

    expect(result?.length).toBe(2);
    expect(result?.[0].room.id).toBe('room-1');
  });

  it('getMatchRoom faz GET autenticado com roomId encodado', () => {
    let result: MatchRoomSnapshot | undefined;
    const roomId = 'room/special#1';
    service.getMatchRoom(roomId).subscribe((data) => (result = data));

    const expectedUrl = `/player/match-rooms/${encodeURIComponent(roomId)}`;
    const req = http.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);

    req.flush({
      ok: true,
      matchRoom: createValidRawSnapshot(roomId),
    });

    expect(result?.room.id).toBe(roomId);
  });

  it('createMatchRoom faz POST autenticado para /player/match-rooms com body vazio', () => {
    let result: MatchRoomSnapshot | undefined;
    service.createMatchRoom().subscribe((data) => (result = data));

    const req = http.expectOne(cs2ApiPaths.playerMatchRooms);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({});

    req.flush({
      ok: true,
      matchRoom: createValidRawSnapshot('new-room'),
    });

    expect(result?.room.id).toBe('new-room');
  });

  it('joinMatchRoom faz POST autenticado com body vazio', () => {
    service.joinMatchRoom('room-1').subscribe();

    const req = http.expectOne('/player/match-rooms/room-1/join');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({});

    req.flush({
      ok: true,
      matchRoom: createValidRawSnapshot('room-1'),
    });
  });

  it('leaveMatchRoom faz POST autenticado com body vazio', () => {
    service.leaveMatchRoom('room-1').subscribe();

    const req = http.expectOne('/player/match-rooms/room-1/leave');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({});

    req.flush({
      ok: true,
      matchRoom: createValidRawSnapshot('room-1'),
    });
  });

  it('cancelMatchRoom faz POST autenticado com body vazio', () => {
    service.cancelMatchRoom('room-1').subscribe();

    const req = http.expectOne('/player/match-rooms/room-1/cancel');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({});

    req.flush({
      ok: true,
      matchRoom: createValidRawSnapshot('room-1'),
    });
  });

  it('confirmMatchRoom faz POST autenticado com body vazio', () => {
    service.confirmMatchRoom('room-1').subscribe();

    const req = http.expectOne('/player/match-rooms/room-1/confirm');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({});

    req.flush({
      ok: true,
      matchRoom: createValidRawSnapshot('room-1'),
    });
  });

  it('draftPick faz POST autenticado com body { playerAccountId } e roomId encodado', () => {
    let result: MatchRoomSnapshot | undefined;
    const roomId = 'room/special#1';
    service.draftPick(roomId, 'player-2').subscribe((data) => (result = data));

    const expectedUrl = `/player/match-rooms/${encodeURIComponent(roomId)}/draft/pick`;
    const req = http.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ playerAccountId: 'player-2' });

    req.flush({
      ok: true,
      matchRoom: createValidRawSnapshot(roomId),
    });

    expect(result?.room.id).toBe(roomId);
  });

  it('mapVetoBan faz POST autenticado com body { mapKey }', () => {
    let result: MatchRoomSnapshot | undefined;
    service.mapVetoBan('room-1', 'de_mirage').subscribe((data) => (result = data));

    const req = http.expectOne('/player/match-rooms/room-1/map-veto/ban');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ mapKey: 'de_mirage' });

    req.flush({
      ok: true,
      matchRoom: createValidRawSnapshot('room-1'),
    });

    expect(result?.room.id).toBe('room-1');
  });

  describe('Error Mapping', () => {
    it('mapeia códigos de erro conhecidos para i18n keys', () => {
      const httpError = new HttpErrorResponse({
        status: 409,
        error: { ok: false, error: 'already_in_active_room' },
      });
      expect(extractMatchRoomErrorCode(httpError)).toBe('already_in_active_room');
      expect(mapMatchRoomErrorToI18nKey(httpError)).toBe('mix.errors.already_in_active_room');
    });

    it('mapeia 404 para room_not_found', () => {
      const error404 = new HttpErrorResponse({ status: 404 });
      expect(extractMatchRoomErrorCode(error404)).toBe('room_not_found');
      expect(mapMatchRoomErrorToI18nKey(error404)).toBe('mix.errors.room_not_found');
    });

    it('faz fallback para generic quando desconhecido', () => {
      const unknownError = new HttpErrorResponse({
        status: 500,
        error: { ok: false, error: 'something_weird' },
      });
      expect(mapMatchRoomErrorToI18nKey(unknownError)).toBe('mix.errors.generic');
    });

    it('faz fallback para generic em caso de erro não HttpErrorResponse', () => {
      expect(mapMatchRoomErrorToI18nKey(new Error('Network failure'))).toBe('mix.errors.generic');
    });
  });
});
