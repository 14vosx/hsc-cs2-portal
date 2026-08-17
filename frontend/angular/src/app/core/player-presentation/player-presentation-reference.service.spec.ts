import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cs2ApiPaths } from '../config/api-paths';
import type { PlayerPresentationReferences } from './player-presentation-reference.model';
import { PlayerPresentationReferenceContractError } from './player-presentation-reference.normalizer';
import {
  PLAYER_PRESENTATION_CACHE_TTL_MS,
  PlayerPresentationReferenceService,
} from './player-presentation-reference.service';

describe('PlayerPresentationReferenceService', () => {
  let service: PlayerPresentationReferenceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlayerPresentationReferenceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  it('faz POST autenticado no path central com SteamIDs válidos únicos', () => {
    service.resolve([ID_1, ID_1, 'invalid', ID_2]).subscribe();

    const req = http.expectOne(cs2ApiPaths.playerPresentationReferences);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ steamIds: [ID_1, ID_2] });
    req.flush(envelope({}));
  });

  it('normaliza personaname, avatar e profile slug, preservando profile null', () => {
    let result: PlayerPresentationReferences | undefined;
    service.resolve([ID_1, ID_2]).subscribe((value) => (result = value));

    http.expectOne(cs2ApiPaths.playerPresentationReferences).flush(
      envelope({
        [ID_1]: reference(ID_1, '  Lavos  ', ' https://avatar/1.jpg ', ' lavos '),
        [ID_2]: reference(ID_2, null, null, null),
      }),
    );

    expect(result?.get(ID_1)).toEqual({
      steam: { steamId64: ID_1, personaname: 'Lavos', avatarMediumUrl: 'https://avatar/1.jpg' },
      profile: { slug: 'lavos' },
    });
    expect(result?.get(ID_2)?.profile).toBeNull();
    expect(result?.get(ID_2)?.steam.personaname).toBeNull();
  });

  it.each([
    ['envelope sem ok true', { ok: false, references: {} }],
    ['references ausente', { ok: true }],
    ['SteamID inválido na chave', envelope({ invalid: reference(ID_1, 'Name', null, null) })],
    ['chave e steamId64 divergentes', envelope({ [ID_1]: reference(ID_2, 'Name', null, null) })],
    ['personaname vazio', envelope({ [ID_1]: reference(ID_1, '   ', null, null) })],
    ['slug vazio', envelope({ [ID_1]: reference(ID_1, 'Name', null, '  ') })],
  ])('rejeita contrato malformado: %s', (_label, payload) => {
    let error: unknown;
    service.resolve([ID_1]).subscribe({ error: (value) => (error = value) });
    http.expectOne(cs2ApiPaths.playerPresentationReferences).flush(payload);
    expect(error).toBeInstanceOf(PlayerPresentationReferenceContractError);
  });

  it('divide mais de 100 IDs em batches de no máximo 100', () => {
    const ids = Array.from({ length: 101 }, (_, index) => steamId(index));
    service.resolve(ids).subscribe();

    const requests = http.match(cs2ApiPaths.playerPresentationReferences);
    expect(requests).toHaveLength(2);
    expect(requests[0].request.body.steamIds).toHaveLength(100);
    expect(requests[1].request.body.steamIds).toHaveLength(1);
    requests.forEach((request) => request.flush(envelope({})));
  });

  it('compartilha uma resolução idêntica em voo', () => {
    service.resolve([ID_1]).subscribe();
    service.resolve([ID_1]).subscribe();

    const requests = http.match(cs2ApiPaths.playerPresentationReferences);
    expect(requests).toHaveLength(1);
    requests[0].flush(envelope({ [ID_1]: reference(ID_1, 'Lavos', null, null) }));
  });

  it('reutiliza sucesso e missing somente durante o TTL curto', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T12:00:00Z'));

    service.resolve([ID_1, ID_2]).subscribe();
    http.expectOne(cs2ApiPaths.playerPresentationReferences).flush(
      envelope({ [ID_1]: reference(ID_1, 'Lavos', null, null) }),
    );
    service.resolve([ID_1, ID_2]).subscribe();
    http.expectNone(cs2ApiPaths.playerPresentationReferences);

    vi.advanceTimersByTime(PLAYER_PRESENTATION_CACHE_TTL_MS + 1);
    service.resolve([ID_1]).subscribe();
    http.expectOne(cs2ApiPaths.playerPresentationReferences).flush(envelope({}));
  });

  it('não transforma erro HTTP em cache positivo', () => {
    service.resolve([ID_1]).subscribe({ error: () => undefined });
    http.expectOne(cs2ApiPaths.playerPresentationReferences).flush('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });

    service.resolve([ID_1]).subscribe({ error: () => undefined });
    http.expectOne(cs2ApiPaths.playerPresentationReferences).flush(envelope({}));
  });

  it('rejeita referência válida de SteamID não solicitado', () => {
    let error: unknown;
    service.resolve([ID_1]).subscribe({ error: (value) => (error = value) });
    http.expectOne(cs2ApiPaths.playerPresentationReferences).flush(
      envelope({ [ID_2]: reference(ID_2, 'Outro', null, null) }),
    );
    expect(error).toBeDefined();
  });
});

const ID_1 = '76561198000000001';
const ID_2 = '76561198000000002';
type JsonObjectFixture = Record<string, unknown>;

function steamId(index: number): string {
  return String(76561198000000000n + BigInt(index));
}

function envelope(references: JsonObjectFixture): JsonObjectFixture {
  return { ok: true, references, missing: [] };
}

function reference(
  steamId64: string,
  personaname: string | null,
  avatarMediumUrl: string | null,
  slug: string | null,
): JsonObjectFixture {
  return {
    steam: { steamId64, personaname, avatarMediumUrl },
    profile: slug === null ? null : { slug },
  };
}
