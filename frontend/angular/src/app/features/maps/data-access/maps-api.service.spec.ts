import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cs2ApiPaths } from '../../../core/config/api-paths';
import type { MapDetail, MapsIndex } from '../domain/map.model';
import { MapsApiService, MapsContractError } from './maps-api.service';

describe('MapsApiService', () => {
  let service: MapsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MapsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('o serviço pode ser injetado', () => {
    expect(service).toBeTruthy();
  });

  describe('getMaps()', () => {
    it('realiza exatamente uma requisição GET para a URL exata de cs2ApiPaths.maps', () => {
      service.getMaps().subscribe();

      const req = httpTesting.expectOne(cs2ApiPaths.maps);
      expect(req.request.method).toBe('GET');
      req.flush({ generatedAt: '2026-08-04T12:00:00Z', maps: [] });
    });

    it('retorna modelo canônico MapsIndex preservando a ordem remota', () => {
      let result: MapsIndex | undefined;
      service.getMaps().subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.maps);
      req.flush({
        generatedAt: '2026-08-04T12:00:00Z',
        maps: [
          { map: 'de_mirage', matches: 10, rounds: 200, avgRoundsPerMatch: 20, lastPlayed: '2026-08-04T10:00:00Z' },
          { map: 'de_nuke', matches: 5, rounds: 100, avgRoundsPerMatch: 20, lastPlayed: '2026-08-03T10:00:00Z' },
        ],
      });

      expect(result).toBeDefined();
      expect(result?.generatedAt).toBe('2026-08-04T12:00:00Z');
      expect(result?.maps.map((m) => m.name)).toEqual(['de_mirage', 'de_nuke']);
    });

    it('lança erro contratual MapsContractError quando o payload for inválido', () => {
      let errorReceived: unknown;
      service.getMaps().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.maps);
      req.flush({ invalid: true });

      expect(errorReceived).toBeInstanceOf(MapsContractError);
    });

    it('propaga erro HTTP 404 sem converter em erro contratual', () => {
      let errorReceived: unknown;
      service.getMaps().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.maps);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(404);
    });

    it('propaga erro HTTP 500 sem converter em erro contratual', () => {
      let errorReceived: unknown;
      service.getMaps().subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.maps);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(500);
    });
  });

  describe('getMap()', () => {
    it('realiza exatamente uma requisição GET para a URL exata de cs2ApiPaths.map(mapName)', () => {
      const mapName = 'de_dust2';
      service.getMap(mapName).subscribe();

      const expectedUrl = cs2ApiPaths.map(mapName);
      const req = httpTesting.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({
        generatedAt: '2026-08-04T12:00:00Z',
        map: 'de_dust2',
        lifetime: { matches: 10, rounds: 200, avgRoundsPerMatch: 20, lastPlayed: '2026-08-04T10:00:00Z' },
        recentMatches: [],
      });
    });

    it('retorna modelo canônico MapDetail para payload válido', () => {
      let result: MapDetail | undefined;
      service.getMap('de_mirage').subscribe((res) => (result = res));

      const req = httpTesting.expectOne(cs2ApiPaths.map('de_mirage'));
      req.flush({
        generatedAt: '2026-08-04T12:00:00Z',
        map: 'de_mirage',
        lifetime: { matches: 15, rounds: 300, avgRoundsPerMatch: 20, lastPlayed: '2026-08-04T11:00:00Z' },
        recentMatches: [],
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('de_mirage');
      expect(result?.lifetime.matches).toBe(15);
    });

    it('lança erro contratual MapsContractError quando o payload do detalhe for inválido', () => {
      let errorReceived: unknown;
      service.getMap('de_inferno').subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.map('de_inferno'));
      req.flush({ generatedAt: '2026-08-04T12:00:00Z' }); // sem map / lifetime

      expect(errorReceived).toBeInstanceOf(MapsContractError);
    });

    it('propaga erro HTTP 404 sem converter em erro contratual para o detalhe de mapa', () => {
      let errorReceived: unknown;
      service.getMap('de_unknown').subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.map('de_unknown'));
      req.flush('Map Not Found', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(404);
    });

    it('propaga erro HTTP 500 sem converter em erro contratual para o detalhe de mapa', () => {
      let errorReceived: unknown;
      service.getMap('de_error').subscribe({
        error: (err) => (errorReceived = err),
      });

      const req = httpTesting.expectOne(cs2ApiPaths.map('de_error'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBeInstanceOf(HttpErrorResponse);
      expect((errorReceived as HttpErrorResponse).status).toBe(500);
    });
  });
});
