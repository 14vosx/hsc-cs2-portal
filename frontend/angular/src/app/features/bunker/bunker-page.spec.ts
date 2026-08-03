import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import type { PlayerBunkerSummaryDto } from '../../core/api/dto/player-bunker.dto';
import { PlayerIdentityApiService } from '../player/data-access/player-identity-api.service';
import type { PlayerIdentity } from '../player/domain/player-identity.model';
import { BunkerPage } from './bunker-page';

class TestableBunkerPage extends BunkerPage {
  get publicVm$() {
    return this.vm$;
  }

  getPublicPlayerName(vm: Parameters<typeof this.playerName>[0]): string {
    return this.playerName(vm);
  }

  getPublicPlayerSteamId(vm: Parameters<typeof this.playerSteamId>[0]): string {
    return this.playerSteamId(vm);
  }

  getPublicPlayerAvatarUrl(vm: Parameters<typeof this.playerAvatarUrl>[0]): string | null {
    return this.playerAvatarUrl(vm);
  }

  getPublicPlayerSteamProfileUrl(
    vm: Parameters<typeof this.playerSteamProfileUrl>[0],
  ): string | null {
    return this.playerSteamProfileUrl(vm);
  }
}

type PlayerIdentityApiMock = {
  getCurrentIdentity: Mock<PlayerIdentityApiService['getCurrentIdentity']>;
};

type Cs2ApiMock = {
  getPlayerBunkerSummary: Mock<Cs2ApiService['getPlayerBunkerSummary']>;
  playerAuthSteamStartUrl: string;
  logoutPlayer: Mock<Cs2ApiService['logoutPlayer']>;
};

describe('BunkerPage', () => {
  let mockPlayerIdentityApi: PlayerIdentityApiMock;
  let mockCs2Api: Cs2ApiMock;

  const mockIdentity: PlayerIdentity = {
    displayName: 'Player One',
    steamId64: '76561198000000001',
    avatarMedium: 'https://example.test/avatar.jpg',
    steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000001',
  };

  const mockSummary: PlayerBunkerSummaryDto = {
    status: 'ready',
    seasonFirst: true,
    statsAvailable: true,
  };

  beforeEach(() => {
    mockPlayerIdentityApi = {
      getCurrentIdentity: vi.fn<PlayerIdentityApiService['getCurrentIdentity']>(),
    };
    mockCs2Api = {
      getPlayerBunkerSummary: vi.fn<Cs2ApiService['getPlayerBunkerSummary']>()
        .mockReturnValue(of(mockSummary)),
      playerAuthSteamStartUrl: '/player/auth/steam/start',
      logoutPlayer: vi.fn<Cs2ApiService['logoutPlayer']>(),
    };

    TestBed.configureTestingModule({
      providers: [
        TestableBunkerPage,
        { provide: PlayerIdentityApiService, useValue: mockPlayerIdentityApi },
        { provide: Cs2ApiService, useValue: mockCs2Api },
      ],
    });
  });

  it('1. emite state: loading antes do resultado final da identidade', () => {
    const identitySubject = new Subject<PlayerIdentity | null>();
    mockPlayerIdentityApi.getCurrentIdentity.mockReturnValue(identitySubject.asObservable());

    const page = TestBed.inject(TestableBunkerPage);
    const states: string[] = [];

    const sub = page.publicVm$.subscribe((vm) => states.push(vm.state));

    expect(states).toEqual(['loading']);

    identitySubject.next(mockIdentity);
    sub.unsubscribe();
  });

  it('2. quando getCurrentIdentity() emite PlayerIdentity válido, chama getPlayerBunkerSummary() e produz state: authenticated', () => {
    mockPlayerIdentityApi.getCurrentIdentity.mockReturnValue(of(mockIdentity));
    mockCs2Api.getPlayerBunkerSummary.mockReturnValue(of(mockSummary));

    const page = TestBed.inject(TestableBunkerPage);
    let resultVm: unknown;

    page.publicVm$.subscribe((vm) => (resultVm = vm));

    expect(mockCs2Api.getPlayerBunkerSummary).toHaveBeenCalledTimes(1);
    expect(resultVm).toMatchObject({
      state: 'authenticated',
      player: mockIdentity,
      summaryState: 'ready',
    });
  });

  it('3. quando getCurrentIdentity() emite null, produz state: unauthenticated e não chama getPlayerBunkerSummary()', () => {
    mockPlayerIdentityApi.getCurrentIdentity.mockReturnValue(of(null));

    const page = TestBed.inject(TestableBunkerPage);
    let resultVm: unknown;

    page.publicVm$.subscribe((vm) => (resultVm = vm));

    expect(resultVm).toEqual({ state: 'unauthenticated' });
    expect(mockCs2Api.getPlayerBunkerSummary).not.toHaveBeenCalled();
  });

  it('4. quando getCurrentIdentity() propaga HTTP 401, produz state: unauthenticated e não chama getPlayerBunkerSummary()', () => {
    const error401 = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    mockPlayerIdentityApi.getCurrentIdentity.mockReturnValue(throwError(() => error401));

    const page = TestBed.inject(TestableBunkerPage);
    let resultVm: unknown;

    page.publicVm$.subscribe((vm) => (resultVm = vm));

    expect(resultVm).toEqual({ state: 'unauthenticated' });
    expect(mockCs2Api.getPlayerBunkerSummary).not.toHaveBeenCalled();
  });

  it('5. quando getCurrentIdentity() propaga HTTP 403, produz state: unauthenticated e não chama getPlayerBunkerSummary()', () => {
    const error403 = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
    mockPlayerIdentityApi.getCurrentIdentity.mockReturnValue(throwError(() => error403));

    const page = TestBed.inject(TestableBunkerPage);
    let resultVm: unknown;

    page.publicVm$.subscribe((vm) => (resultVm = vm));

    expect(resultVm).toEqual({ state: 'unauthenticated' });
    expect(mockCs2Api.getPlayerBunkerSummary).not.toHaveBeenCalled();
  });

  it('6. quando getCurrentIdentity() propaga HTTP 500, produz state: error e não chama getPlayerBunkerSummary()', () => {
    const error500 = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
    mockPlayerIdentityApi.getCurrentIdentity.mockReturnValue(throwError(() => error500));

    const page = TestBed.inject(TestableBunkerPage);
    let resultVm: unknown;

    page.publicVm$.subscribe((vm) => (resultVm = vm));

    expect(resultVm).toEqual({ state: 'error' });
    expect(mockCs2Api.getPlayerBunkerSummary).not.toHaveBeenCalled();
  });

  it('7. quando getCurrentIdentity() propaga erro de rede, produz state: error e não chama getPlayerBunkerSummary()', () => {
    const networkError = new ProgressEvent('error');
    mockPlayerIdentityApi.getCurrentIdentity.mockReturnValue(throwError(() => networkError));

    const page = TestBed.inject(TestableBunkerPage);
    let resultVm: unknown;

    page.publicVm$.subscribe((vm) => (resultVm = vm));

    expect(resultVm).toEqual({ state: 'error' });
    expect(mockCs2Api.getPlayerBunkerSummary).not.toHaveBeenCalled();
  });

  it('8. garante que getCurrentIdentity() e getPlayerBunkerSummary() são chamados exatamente uma vez no ciclo inicial', () => {
    mockPlayerIdentityApi.getCurrentIdentity.mockReturnValue(of(mockIdentity));

    const page = TestBed.inject(TestableBunkerPage);
    page.publicVm$.subscribe();

    expect(mockPlayerIdentityApi.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(mockCs2Api.getPlayerBunkerSummary).toHaveBeenCalledTimes(1);
  });

  it('9. preserva os helpers de identidade (displayName, steamId64, avatarMedium, steamProfileUrl)', () => {
    const page = TestBed.inject(TestableBunkerPage);

    const authenticatedVm: Parameters<
      TestableBunkerPage['getPublicPlayerName']
    >[0] = {
      state: 'authenticated',
      player: mockIdentity,
      summary: {},
      summaryState: 'ready',
    };

    expect(page.getPublicPlayerName(authenticatedVm)).toBe('Player One');
    expect(page.getPublicPlayerSteamId(authenticatedVm)).toBe('76561198000000001');
    expect(page.getPublicPlayerAvatarUrl(authenticatedVm)).toBe('https://example.test/avatar.jpg');
    expect(page.getPublicPlayerSteamProfileUrl(authenticatedVm)).toBe(
      'https://steamcommunity.com/profiles/76561198000000001',
    );
  });
});
