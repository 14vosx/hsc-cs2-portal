import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import { normalizeBunkerSummary } from './bunker-summary.normalizer';

describe('normalizeBunkerSummary', () => {
  describe('A. Estrutura', () => {
    it('normaliza payload direto válido', () => {
      const result = normalizeBunkerSummary({
        status: 'ready',
        seasonFirst: true,
        statsAvailable: true,
      });

      expect(result).toEqual({
        status: 'ready',
        seasonFirst: true,
        statsAvailable: true,
        currentSeason: null,
        seasonPlayer: null,
        competitiveProfile: null,
      });
    });

    it('normaliza payload envelopado em data.bunker', () => {
      const result = normalizeBunkerSummary({
        ok: true,
        data: {
          bunker: {
            status: 'ready',
            seasonFirst: false,
            statsAvailable: true,
          },
        },
      });

      expect(result).toEqual({
        status: 'ready',
        seasonFirst: false,
        statsAvailable: true,
        currentSeason: null,
        seasonPlayer: null,
        competitiveProfile: null,
      });
    });

    it('retorna null para objeto sem campos do bunker', () => {
      expect(normalizeBunkerSummary({})).toBeNull();
      expect(normalizeBunkerSummary({ foo: 'bar', baz: 123 })).toBeNull();
    });

    it('retorna null para null e undefined', () => {
      expect(normalizeBunkerSummary(null)).toBeNull();
      expect(normalizeBunkerSummary(undefined)).toBeNull();
    });

    it('retorna null para array na raiz', () => {
      expect(normalizeBunkerSummary([{ status: 'ready' }])).toBeNull();
    });

    it('trata data inválido (não objeto)', () => {
      const result = normalizeBunkerSummary({
        data: 'invalid-data-string',
        status: 'ready',
      });

      expect(result?.status).toBe('ready');
    });

    it('trata data.bunker inválido caindo para a raiz', () => {
      const result = normalizeBunkerSummary({
        data: {
          bunker: 'not-an-object',
        },
        status: 'ready',
        seasonFirst: true,
      });

      expect(result).toEqual({
        status: 'ready',
        seasonFirst: true,
        statsAvailable: null,
        currentSeason: null,
        seasonPlayer: null,
        competitiveProfile: null,
      });
    });
  });

  describe('B. Precedência', () => {
    it('dá preferência a data.bunker sobre a raiz', () => {
      const result = normalizeBunkerSummary({
        status: 'root-status',
        data: {
          bunker: {
            status: 'enveloped-status',
          },
        },
      });

      expect(result?.status).toBe('enveloped-status');
    });

    it('dá preferência a data.currentSeason sobre bunker.currentSeason', () => {
      const result = normalizeBunkerSummary({
        currentSeason: { slug: 'season-root' },
        data: {
          bunker: {
            currentSeason: { slug: 'season-bunker' },
          },
          currentSeason: { slug: 'season-data' },
        },
      });

      expect(result?.currentSeason?.slug).toBe('season-data');
    });

    it('dá preferência a data.seasonPlayer sobre bunker.seasonPlayer', () => {
      const result = normalizeBunkerSummary({
        data: {
          bunker: {
            seasonPlayer: { name: 'Bunker Player' },
          },
          seasonPlayer: { name: 'Data Player' },
        },
      });

      expect(result?.seasonPlayer?.name).toBe('Data Player');
    });

    it('dá preferência a data.competitiveProfile sobre bunker.competitiveProfile', () => {
      const result = normalizeBunkerSummary({
        data: {
          bunker: {
            competitiveProfile: { name: 'Bunker Profile Name' },
          },
          competitiveProfile: { name: 'Data Profile Name' },
        },
      });

      expect(result?.competitiveProfile?.name).toBe('Data Profile Name');
    });

    it('complementa campos de identidade com data.player quando ausentes em competitiveProfile', () => {
      const result = normalizeBunkerSummary({
        data: {
          player: {
            displayName: 'Response Player',
            steamid64: '76561198000000999',
            avatarMedium: 'https://example.test/player-avatar.jpg',
            steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000999',
          },
          competitiveProfile: {
            generatedAt: '2026-08-01T00:00:00Z',
          },
        },
      });

      expect(result?.competitiveProfile).toEqual({
        generatedAt: '2026-08-01T00:00:00Z',
        steamId64: '76561198000000999',
        name: 'Response Player',
        avatarMedium: 'https://example.test/player-avatar.jpg',
        steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000999',
        lifetime: null,
      });
    });
  });

  describe('C. Identidade competitiva e remoção de aliases no resultado', () => {
    it('aceita alias steamid64 no payload e produz exclusivamente steamId64 no resultado', () => {
      const res1 = normalizeBunkerSummary({
        competitiveProfile: { steamid64: '76561198000000001' },
      });
      const res2 = normalizeBunkerSummary({
        seasonPlayer: { steamid64: '76561198000000002' },
      });

      expect(res1?.competitiveProfile?.steamId64).toBe('76561198000000001');
      expect('steamid64' in (res1?.competitiveProfile ?? {})).toBe(false);

      expect(res2?.seasonPlayer?.steamId64).toBe('76561198000000002');
      expect('steamid64' in (res2?.seasonPlayer ?? {})).toBe(false);
    });

    it('dá preferência a steamid64 sobre steamId64 na entrada de transporte', () => {
      const result = normalizeBunkerSummary({
        competitiveProfile: {
          steamid64: '76561198000000001',
          steamId64: '76561198000000002',
        },
      });

      expect(result?.competitiveProfile?.steamId64).toBe('76561198000000001');
    });

    it('usa displayName como fallback para name', () => {
      const result = normalizeBunkerSummary({
        data: {
          player: { displayName: 'Fallback Name' },
          competitiveProfile: { generatedAt: '2026-01-01' },
        },
      });

      expect(result?.competitiveProfile?.name).toBe('Fallback Name');
    });

    it('converte strings de espaço em branco em null', () => {
      const result = normalizeBunkerSummary({
        status: '   ',
        currentSeason: { name: '   ', slug: '' },
      });

      expect(result).toBeNull();
    });

    it('retorna null para perfil competitivo totalmente vazio', () => {
      const result = normalizeBunkerSummary({
        competitiveProfile: {},
      });

      expect(result).toBeNull();
    });
  });

  describe('D. Estatísticas', () => {
    it('normaliza números reais', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          summary: {
            kdRatio: 1.45,
            winRate: 0.62,
            kills: 120,
            deaths: 83,
          },
        },
      });

      expect(result?.seasonPlayer?.summary?.kdRatio).toBe(1.45);
      expect(result?.seasonPlayer?.summary?.winRate).toBe(0.62);
      expect(result?.seasonPlayer?.summary?.kills).toBe(120);
      expect(result?.seasonPlayer?.summary?.deaths).toBe(83);
    });

    it('converte strings numéricas válidas para number', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          summary: {
            kdRatio: '1.25',
            kills: '42',
          },
        },
      });

      expect(result?.seasonPlayer?.summary?.kdRatio).toBe(1.25);
      expect(result?.seasonPlayer?.summary?.kills).toBe(42);
    });

    it('preserva zero (0) e números negativos', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          summary: {
            losses: 0,
            score: -10.5,
          },
        },
      });

      expect(result?.seasonPlayer?.summary?.losses).toBe(0);
      expect(result?.seasonPlayer?.summary?.score).toBe(-10.5);
    });

    it('converte NaN, Infinity, strings não numéricas e nulos em null', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          summary: {
            kdRatio: NaN,
            winRate: Infinity,
            adr: 'not-a-number',
            kills: null,
            deaths: undefined,
          },
        },
      });

      expect(result).toBeNull();
    });
  });

  describe('E. Mapas', () => {
    it('suporta aliases de nome do mapa (mapName, mapname, map)', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          byMap: [
            { mapName: 'de_mirage', kills: 10 },
            { mapname: 'de_inferno', kills: 12 },
            { map: 'de_nuke', kills: 8 },
          ],
        },
      });

      expect(result?.seasonPlayer?.byMap).toHaveLength(3);
      expect(result?.seasonPlayer?.byMap[0].mapName).toBe('de_mirage');
      expect(result?.seasonPlayer?.byMap[1].mapName).toBe('de_inferno');
      expect(result?.seasonPlayer?.byMap[2].mapName).toBe('de_nuke');
    });

    it('descarta elementos de mapa completamente inválidos', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          byMap: ['invalid-string', null, {}, { mapName: 'de_dust2' }],
        },
      });

      expect(result?.seasonPlayer?.byMap).toHaveLength(1);
      expect(result?.seasonPlayer?.byMap[0].mapName).toBe('de_dust2');
    });

    it('limita o número de mapas em até 6', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          byMap: [
            { mapName: 'map1' },
            { mapName: 'map2' },
            { mapName: 'map3' },
            { mapName: 'map4' },
            { mapName: 'map5' },
            { mapName: 'map6' },
            { mapName: 'map7' },
          ],
        },
      });

      expect(result?.seasonPlayer?.byMap).toHaveLength(6);
      expect(result?.seasonPlayer?.byMap[5].mapName).toBe('map6');
    });

    it('retorna array vazio quando byMap não for um array', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          name: 'Player Name',
          byMap: 'not-an-array',
        },
      });

      expect(result?.seasonPlayer?.byMap).toEqual([]);
    });
  });

  describe('F. Mapas recentes e eliminação de propriedades snake_case', () => {
    it('suporta aliases de transporte de data, match ID e resultado', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          recentMaps: [
            {
              mapName: 'de_ancient',
              startedAt: '2026-08-01T10:00:00Z',
              matchId: 'm1',
              result: 'win',
            },
            {
              mapname: 'de_anubis',
              startTime: '2026-08-02T10:00:00Z',
              matchid: 'm2',
              outcome: 'loss',
            },
            {
              map: 'de_vertigo',
              start_time: '2026-08-03T10:00:00Z',
            },
          ],
        },
      });

      expect(result?.seasonPlayer?.recentMaps).toHaveLength(3);
      expect(result?.seasonPlayer?.recentMaps[0].startedAt).toBe('2026-08-01T10:00:00Z');
      expect(result?.seasonPlayer?.recentMaps[1].matchId).toBe('m2');
      expect(result?.seasonPlayer?.recentMaps[2].startedAt).toBe('2026-08-03T10:00:00Z');
    });

    it('coerces valores de isWin', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          recentMaps: [
            { mapName: 'map1', isWin: true },
            { mapName: 'map2', isWin: '1' },
            { mapName: 'map3', isWin: 'vitória' },
            { mapName: 'map4', isWin: false },
            { mapName: 'map5', isWin: 'derrota' },
          ],
        },
      });

      expect(result?.seasonPlayer?.recentMaps[0].isWin).toBe(true);
      expect(result?.seasonPlayer?.recentMaps[1].isWin).toBe(true);
      expect(result?.seasonPlayer?.recentMaps[2].isWin).toBe(true);
      expect(result?.seasonPlayer?.recentMaps[3].isWin).toBe(false);
      expect(result?.seasonPlayer?.recentMaps[4].isWin).toBe(false);
    });

    it('normaliza somente 0 e 1 numéricos de isWin no payload do ETL', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          recentMaps: [
            {
              matchid: 123,
              mapnumber: 0,
              start_time: '2026-08-07T11:30:00Z',
              mapname: 'de_mirage',
              team: 'team1',
              winner: 'team1',
              isWin: 1,
              team1_score: 13,
              team2_score: 10,
              result: 'win',
              outcome: 'win',
              score: '13-10',
              kdRatio: 1.42,
              adr: 87.3,
              impactRating: 1.234,
            },
            { mapname: 'de_ancient', isWin: 0 },
            { mapname: 'de_anubis', isWin: 2 },
          ],
        },
      });

      expect(result?.seasonPlayer?.recentMaps[0]).toMatchObject({
        matchId: '123',
        mapNumber: 0,
        startedAt: '2026-08-07T11:30:00Z',
        mapName: 'de_mirage',
        team: 'team1',
        winner: 'team1',
        isWin: true,
        team1Score: 13,
        team2Score: 10,
        result: 'win',
        outcome: 'win',
        score: '13-10',
        kdRatio: 1.42,
        adr: 87.3,
        impactRating: 1.234,
      });
      expect(result?.seasonPlayer?.recentMaps[1].isWin).toBe(false);
      expect(result?.seasonPlayer?.recentMaps[2].isWin).toBeNull();
    });

    it('normaliza matchid string-or-number sem aceitar números inválidos', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          recentMaps: [
            { mapname: 'de_mirage', matchid: 123 },
            { mapname: 'de_ancient', matchid: '456' },
            { mapname: 'de_anubis', matchid: ' 789 ' },
            { mapname: 'de_inferno', matchid: 12.5 },
            { mapname: 'de_nuke', matchid: Number.NaN },
          ],
          timeline: [
            {
              matchid: 123,
              mapnumber: 0,
              start_time: '2026-08-07T11:30:00Z',
              mapname: 'de_mirage',
            },
          ],
        },
      });

      expect(result?.seasonPlayer?.recentMaps.map((map) => map.matchId)).toEqual([
        '123',
        '456',
        '789',
        null,
        null,
      ]);
      expect(result?.seasonPlayer?.timeline[0]).toMatchObject({
        matchId: '123',
        mapNumber: 0,
        at: '2026-08-07T11:30:00Z',
        mapName: 'de_mirage',
      });
    });

    it('aceita aliases snake_case na entrada mas gera estritamente propriedades camelCase sem duplicações snake_case', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          recentMaps: [
            {
              mapName: 'de_dust2',
              team1_score: 13,
              team2_score: 11,
              utility_damage: 150,
              head_shot_kills: 8,
              entry_count: 5,
              entry_wins: 3,
              v1_count: 2,
              v1_wins: 1,
              v2_count: 1,
              v2_wins: 0,
              shots_fired_total: 200,
              shots_on_target_total: 50,
            },
          ],
        },
      });

      const map = result?.seasonPlayer?.recentMaps[0];
      expect(map).toBeDefined();

      if (!map) {
        throw new Error('Expected recent map');
      }

      // Propriedades canônicas camelCase
      expect(map.team1Score).toBe(13);
      expect(map.team2Score).toBe(11);
      expect(map.utilityDamage).toBe(150);
      expect(map.headShotKills).toBe(8);
      expect(map.entryCount).toBe(5);
      expect(map.entryWins).toBe(3);
      expect(map.v1Count).toBe(2);
      expect(map.v1Wins).toBe(1);
      expect(map.v2Count).toBe(1);
      expect(map.v2Wins).toBe(0);
      expect(map.shotsFiredTotal).toBe(200);
      expect(map.shotsOnTargetTotal).toBe(50);

      // Comprovação de ausência de aliases snake_case no resultado
      expect('team1_score' in map).toBe(false);
      expect('team2_score' in map).toBe(false);
      expect('utility_damage' in map).toBe(false);
      expect('head_shot_kills' in map).toBe(false);
      expect('entry_count' in map).toBe(false);
      expect('entry_wins' in map).toBe(false);
      expect('v1_count' in map).toBe(false);
      expect('v1_wins' in map).toBe(false);
      expect('v2_count' in map).toBe(false);
      expect('v2_wins' in map).toBe(false);
      expect('shots_fired_total' in map).toBe(false);
      expect('shots_on_target_total' in map).toBe(false);
    });

    it('limita o número de mapas recentes em até 5', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          recentMaps: [
            { matchId: 'm1' },
            { matchId: 'm2' },
            { matchId: 'm3' },
            { matchId: 'm4' },
            { matchId: 'm5' },
            { matchId: 'm6' },
          ],
        },
      });

      expect(result?.seasonPlayer?.recentMaps).toHaveLength(5);
      expect(result?.seasonPlayer?.recentMaps[4].matchId).toBe('m5');
    });
  });

  describe('G. Timeline', () => {
    it('suporta aliases de data e evento na timeline', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          timeline: [
            { at: '2026-08-01', event: 'match_win', mapName: 'de_nuke' },
            { timestamp: '2026-08-02', type: 'match_loss', mapname: 'de_mirage' },
            { startedAt: '2026-08-03', map: 'de_inferno' },
          ],
        },
      });

      expect(result?.seasonPlayer?.timeline).toHaveLength(3);
      expect(result?.seasonPlayer?.timeline[0].at).toBe('2026-08-01');
      expect(result?.seasonPlayer?.timeline[0].event).toBe('match_win');
      expect(result?.seasonPlayer?.timeline[1].at).toBe('2026-08-02');
      expect(result?.seasonPlayer?.timeline[1].event).toBe('match_loss');
    });

    it('limita a timeline em até 8 itens', () => {
      const result = normalizeBunkerSummary({
        seasonPlayer: {
          timeline: [
            { matchId: 't1' },
            { matchId: 't2' },
            { matchId: 't3' },
            { matchId: 't4' },
            { matchId: 't5' },
            { matchId: 't6' },
            { matchId: 't7' },
            { matchId: 't8' },
            { matchId: 't9' },
          ],
        },
      });

      expect(result?.seasonPlayer?.timeline).toHaveLength(8);
      expect(result?.seasonPlayer?.timeline[7].matchId).toBe('t8');
    });
  });

  describe('H. Segurança e robustez', () => {
    it('não consome propriedades herdadas do protótipo', () => {
      const prototype = { status: 'inherited-status', seasonFirst: true };
      const input = Object.create(prototype);

      expect(normalizeBunkerSummary(input)).toBeNull();
    });

    it('não executa getters que lançam exceção', () => {
      const input = { status: 'ready' };
      Object.defineProperty(input, 'seasonPlayer', {
        get() {
          throw new Error('Getter hostil não deve ser executado');
        },
      });

      expect(() => normalizeBunkerSummary(input)).not.toThrow();
      expect(normalizeBunkerSummary(input)?.status).toBe('ready');
    });

    it('trata Proxy revogado sem lançar exceção', () => {
      const revocable = Proxy.revocable({}, {});
      revocable.revoke();

      expect(() => normalizeBunkerSummary(revocable.proxy)).not.toThrow();
      expect(normalizeBunkerSummary(revocable.proxy)).toBeNull();
    });

    it('suporta payload congelado (Object.freeze)', () => {
      const frozenInput = Object.freeze({
        status: 'ready',
        seasonFirst: true,
        statsAvailable: true,
        currentSeason: Object.freeze({ slug: 's1', name: 'Season 1' }),
      });

      expect(() => normalizeBunkerSummary(frozenInput)).not.toThrow();
      expect(normalizeBunkerSummary(frozenInput)?.currentSeason?.slug).toBe('s1');
    });

    it('não muta o payload recebido', () => {
      const input = {
        status: ' ready ',
        seasonFirst: true,
        currentSeason: {
          slug: ' s1 ',
        },
      };

      const clone = JSON.parse(JSON.stringify(input));

      normalizeBunkerSummary(input);

      expect(input).toEqual(clone);
    });
  });

  describe('I. Pureza arquitetural (Inspeção Estática)', () => {
    it('comprova por inspeção estática que os arquivos de produção não contêm imports proibidos ou acesso ao DOM', () => {
      const normalizerPath = path.join(__dirname, 'bunker-summary.normalizer.ts');
      const modelPath = path.resolve(__dirname, '../domain/bunker.model.ts');
      const prodFiles = [normalizerPath, modelPath];

      for (const file of prodFiles) {
        expect(fs.existsSync(file), `Arquivo de produção ${file} deve existir`).toBe(true);
        const content = fs.readFileSync(file, 'utf-8');

        const hasAngularImport = /from\s+['"]@angular\//.test(content);
        const hasRxjsImport = /from\s+['"]rxjs(\/.*)?['"]/.test(content);
        const hasDtoImport = /from\s+['"].*\/dto\//.test(content);
        const hasDomUsage = /\b(window|document)\b/.test(content);

        expect(hasAngularImport, `Arquivo de produção ${file} não deve importar @angular/*`).toBe(false);
        expect(hasRxjsImport, `Arquivo de produção ${file} não deve importar rxjs`).toBe(false);
        expect(hasDtoImport, `Arquivo de produção ${file} não deve importar DTOs`).toBe(false);
        expect(hasDomUsage, `Arquivo de produção ${file} não deve referenciar window ou document`).toBe(false);
      }
    });
  });
});
