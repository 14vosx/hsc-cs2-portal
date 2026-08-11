import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../config/api-paths';
import { PlayerSessionService } from './player-session.service';

describe('PlayerSessionService', () => {
  let service: PlayerSessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
    service = TestBed.inject(PlayerSessionService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads an authenticated shell identity with credentials', () => {
    service.load();
    const request = http.expectOne(cs2ApiPaths.playerMe);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ authenticated: true, player: { displayName: 'Player One', steamid64: '765', avatarMedium: 'avatar.jpg' } });
    expect(service.state()).toEqual({ status: 'authenticated', displayName: 'Player One', steamId64: '765', avatarMedium: 'avatar.jpg' });
  });

  it('maps anonymous and invalid identities to anonymous', () => {
    service.load();
    http.expectOne(cs2ApiPaths.playerMe).flush({ authenticated: false });
    expect(service.state().status).toBe('anonymous');
    service.load();
    http.expectOne(cs2ApiPaths.playerMe).flush({ displayName: 'No identity' });
    expect(service.state().status).toBe('anonymous');
  });

  it.each([401, 403])('maps HTTP %s to anonymous', (status) => {
    service.load();
    http.expectOne(cs2ApiPaths.playerMe).flush('Denied', { status, statusText: 'Denied' });
    expect(service.state().status).toBe('anonymous');
  });

  it('maps unexpected failures to unavailable', () => {
    service.load();
    http.expectOne(cs2ApiPaths.playerMe).flush('Failure', { status: 500, statusText: 'Failure' });
    expect(service.state().status).toBe('unavailable');
  });

  it('logs out with credentials and becomes anonymous', () => {
    service.logout();
    const request = http.expectOne(cs2ApiPaths.playerAuthLogout);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(request.request.withCredentials).toBe(true);
    request.flush({ ok: true });
    expect(service.state().status).toBe('anonymous');
  });

  it('keeps an authenticated session when logout fails', () => {
    service.load();
    http.expectOne(cs2ApiPaths.playerMe).flush({
      authenticated: true,
      player: { displayName: 'Player One', steamid64: '765' },
    });

    service.logout();
    http.expectOne(cs2ApiPaths.playerAuthLogout).flush('Failure', {
      status: 500,
      statusText: 'Failure',
    });

    expect(service.state().status).toBe('authenticated');
  });
});
