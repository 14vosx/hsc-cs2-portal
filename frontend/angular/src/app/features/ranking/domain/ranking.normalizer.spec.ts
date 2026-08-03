import { describe, expect, it } from 'vitest';

import { normalizeRanking } from './ranking.normalizer';

describe('normalizeRanking', () => {
  it('returns safe default ranking for null (1)', () => {
    expect(normalizeRanking(null)).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
  });

  it('returns safe default ranking for undefined (2)', () => {
    expect(normalizeRanking(undefined)).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
  });

  it('returns safe default ranking for primitive string, number, boolean (3)', () => {
    expect(normalizeRanking('invalid')).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
    expect(normalizeRanking(123)).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
    expect(normalizeRanking(true)).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
  });

  it('returns safe default ranking for root array (4)', () => {
    expect(normalizeRanking([{ steamid64: '76561198000000001' }])).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
  });

  it('returns safe default ranking for empty object (5)', () => {
    expect(normalizeRanking({})).toEqual({
      generatedAt: null,
      completedMaps: 0,
      players: [],
      rankedPlayerCount: 0,
      leader: null,
    });
  });

  it('handles missing players property gracefully (6)', () => {
    const result = normalizeRanking({ generatedAt: '2026-08-03T12:00:00Z', mapsFinalizados: 10 });
    expect(result.players).toEqual([]);
    expect(result.rankedPlayerCount).toBe(0);
    expect(result.leader).toBeNull();
  });

  it('handles non-array players property gracefully (7)', () => {
    const result = normalizeRanking({ players: 'not-an-array' });
    expect(result.players).toEqual([]);
    expect(result.rankedPlayerCount).toBe(0);
  });

  it('handles empty players array (8)', () => {
    const result = normalizeRanking({ players: [] });
    expect(result.players).toEqual([]);
    expect(result.rankedPlayerCount).toBe(0);
    expect(result.leader).toBeNull();
  });

  it('normalizes valid generatedAt string (9)', () => {
    const result = normalizeRanking({ generatedAt: '  2026-08-03T12:00:00Z  ' });
    expect(result.generatedAt).toBe('2026-08-03T12:00:00Z');
  });

  it('normalizes empty or invalid generatedAt to null (10)', () => {
    expect(normalizeRanking({ generatedAt: '' }).generatedAt).toBeNull();
    expect(normalizeRanking({ generatedAt: '   ' }).generatedAt).toBeNull();
    expect(normalizeRanking({ generatedAt: 123456 }).generatedAt).toBeNull();
  });

  it('normalizes valid mapsFinalizados (11)', () => {
    const result = normalizeRanking({ mapsFinalizados: 42 });
    expect(result.completedMaps).toBe(42);
  });

  it('preserves mapsFinalizados zero (12)', () => {
    const result = normalizeRanking({ mapsFinalizados: 0 });
    expect(result.completedMaps).toBe(0);
  });

  it('normalizes negative mapsFinalizados to zero (13)', () => {
    const result = normalizeRanking({ mapsFinalizados: -5 });
    expect(result.completedMaps).toBe(0);
  });

  it('normalizes non-finite mapsFinalizados to zero (14)', () => {
    expect(normalizeRanking({ mapsFinalizados: NaN }).completedMaps).toBe(0);
    expect(normalizeRanking({ mapsFinalizados: Infinity }).completedMaps).toBe(0);
    expect(normalizeRanking({ mapsFinalizados: -Infinity }).completedMaps).toBe(0);
  });

  it('discards non-object player items (15)', () => {
    const result = normalizeRanking({
      players: ['string-player', 42, null, true, undefined],
    });
    expect(result.players).toEqual([]);
  });

  it('discards player without SteamID (16)', () => {
    const result = normalizeRanking({
      players: [{ name: 'No Steam ID Player', kills: 10 }],
    });
    expect(result.players).toEqual([]);
  });

  it('accepts steamid64 string (17)', () => {
    const result = normalizeRanking({
      players: [{ steamid64: '76561198000000001', name: 'Player One' }],
    });
    expect(result.players).toHaveLength(1);
    expect(result.players[0].steamId64).toBe('76561198000000001');
  });

  it('accepts steamId64 string (18)', () => {
    const result = normalizeRanking({
      players: [{ steamId64: '76561198000000002', name: 'Player Two' }],
    });
    expect(result.players).toHaveLength(1);
    expect(result.players[0].steamId64).toBe('76561198000000002');
  });

  it('accepts safe numeric SteamID (19)', () => {
    const result = normalizeRanking({
      players: [{ steamid64: 12345678, name: 'Numeric Player' }],
    });
    expect(result.players).toHaveLength(1);
    expect(result.players[0].steamId64).toBe('12345678');
  });

  it('rejects unsafe numeric SteamID (20)', () => {
    const unsafeNumber = 9007199254740993; // Number.MAX_SAFE_INTEGER + 2
    const result = normalizeRanking({
      players: [{ steamid64: unsafeNumber, name: 'Unsafe Player' }],
    });
    expect(result.players).toEqual([]);
  });

  it('rejects empty SteamID (21)', () => {
    const result = normalizeRanking({
      players: [
        { steamid64: '', steamId64: '   ' },
        { steamid64: '   ' },
      ],
    });
    expect(result.players).toEqual([]);
  });

  it('trims valid name (22)', () => {
    const result = normalizeRanking({
      players: [{ steamid64: '76561198000000001', name: '   Fallen   ' }],
    });
    expect(result.players[0].name).toBe('Fallen');
  });

  it('normalizes empty or invalid name to null (23)', () => {
    expect(
      normalizeRanking({ players: [{ steamid64: '100', name: '' }] }).players[0].name,
    ).toBeNull();
    expect(
      normalizeRanking({ players: [{ steamid64: '101', name: '   ' }] }).players[0].name,
    ).toBeNull();
    expect(
      normalizeRanking({ players: [{ steamid64: '102', name: 12345 }] }).players[0].name,
    ).toBeNull();
  });

  it('normalizes valid numeric values correctly (24)', () => {
    const result = normalizeRanking({
      players: [
        {
          steamid64: '76561198000000001',
          name: 'Pro Player',
          matchesPlayed: 15,
          mapsPlayed: 25,
          roundsPlayed: 500,
          wins: 10,
          losses: 5,
          kills: 450,
          deaths: 300,
          assists: 120,
          kdRatio: 1.5,
          headshotPct: 55.4,
          adr: 85.2,
          utilityDmgPerRound: 12.3,
          killsPerRound: 0.9,
          assistsPerRound: 0.24,
          deathsPerRound: 0.6,
          impactRating: 1.25,
          winRate: 66.7,
          sampleWeight: 1.0,
          score: 1850.5,
        },
      ],
    });

    const player = result.players[0];
    expect(player.position).toBe(1);
    expect(player.matchesPlayed).toBe(15);
    expect(player.mapsPlayed).toBe(25);
    expect(player.roundsPlayed).toBe(500);
    expect(player.wins).toBe(10);
    expect(player.losses).toBe(5);
    expect(player.kills).toBe(450);
    expect(player.deaths).toBe(300);
    expect(player.assists).toBe(120);
    expect(player.kdRatio).toBe(1.5);
    expect(player.headshotPct).toBe(55.4);
    expect(player.adr).toBe(85.2);
    expect(player.utilityDmgPerRound).toBe(12.3);
    expect(player.killsPerRound).toBe(0.9);
    expect(player.assistsPerRound).toBe(0.24);
    expect(player.deathsPerRound).toBe(0.6);
    expect(player.impactRating).toBe(1.25);
    expect(player.winRate).toBe(66.7);
    expect(player.sampleWeight).toBe(1.0);
    expect(player.score).toBe(1850.5);
  });

  it('preserves legitimate zero in numeric fields (25)', () => {
    const result = normalizeRanking({
      players: [
        {
          steamid64: '76561198000000001',
          kills: 0,
          deaths: 0,
          kdRatio: 0,
          adr: 0,
          winRate: 0,
          score: 0,
        },
      ],
    });
    const p = result.players[0];
    expect(p.kills).toBe(0);
    expect(p.deaths).toBe(0);
    expect(p.kdRatio).toBe(0);
    expect(p.adr).toBe(0);
    expect(p.winRate).toBe(0);
    expect(p.score).toBe(0);
  });

  it('normalizes negative numbers to zero (26)', () => {
    const result = normalizeRanking({
      players: [
        {
          steamid64: '76561198000000001',
          kills: -10,
          kdRatio: -1.5,
          score: -500,
        },
      ],
    });
    const p = result.players[0];
    expect(p.kills).toBe(0);
    expect(p.kdRatio).toBe(0);
    expect(p.score).toBe(0);
  });

  it('normalizes NaN, Infinity and -Infinity to zero (27)', () => {
    const result = normalizeRanking({
      players: [
        {
          steamid64: '76561198000000001',
          kills: NaN,
          deaths: Infinity,
          kdRatio: -Infinity,
          score: NaN,
        },
      ],
    });
    const p = result.players[0];
    expect(p.kills).toBe(0);
    expect(p.deaths).toBe(0);
    expect(p.kdRatio).toBe(0);
    expect(p.score).toBe(0);
  });

  it('parses numeric strings when valid (28)', () => {
    const result = normalizeRanking({
      players: [
        {
          steamid64: '76561198000000001',
          kills: '25',
          kdRatio: '1.45',
          score: '1200.5',
        },
      ],
    });
    const p = result.players[0];
    expect(p.kills).toBe(25);
    expect(p.kdRatio).toBe(1.45);
    expect(p.score).toBe(1200.5);
  });

  it('defaults invalid or missing numeric fields in partially valid entries to 0 (29)', () => {
    const result = normalizeRanking({
      players: [
        {
          steamid64: '76561198000000001',
          kills: 'not-a-number',
          deaths: null,
          // matchesPlayed omitted
        },
      ],
    });
    const p = result.players[0];
    expect(p.kills).toBe(0);
    expect(p.deaths).toBe(0);
    expect(p.matchesPlayed).toBe(0);
  });

  it('preserves received order of valid players (30)', () => {
    const result = normalizeRanking({
      players: [
        { steamid64: '76561198000000001', name: 'Alpha' },
        { steamid64: '76561198000000002', name: 'Beta' },
        { steamid64: '76561198000000003', name: 'Gamma' },
      ],
    });
    expect(result.players.map((p) => p.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('does not reorder players by score (31)', () => {
    const result = normalizeRanking({
      players: [
        { steamid64: '101', name: 'Lower Score', score: 100 },
        { steamid64: '102', name: 'Higher Score', score: 999 },
      ],
    });
    expect(result.players[0].name).toBe('Lower Score');
    expect(result.players[1].name).toBe('Higher Score');
  });

  it('assigns 1-based position sequentially based on final array (32)', () => {
    const result = normalizeRanking({
      players: [
        { steamid64: '101' },
        { steamid64: '102' },
        { steamid64: '103' },
      ],
    });
    expect(result.players[0].position).toBe(1);
    expect(result.players[1].position).toBe(2);
    expect(result.players[2].position).toBe(3);
  });

  it('recalculates position correctly after filtering invalid players (33)', () => {
    const result = normalizeRanking({
      players: [
        { steamid64: '101', name: 'Valid One' },
        { invalidPlayer: true }, // invalid
        { steamid64: '', name: 'Empty ID' }, // invalid
        { steamid64: '102', name: 'Valid Two' },
      ],
    });
    expect(result.players).toHaveLength(2);
    expect(result.players[0]).toMatchObject({ steamId64: '101', position: 1 });
    expect(result.players[1]).toMatchObject({ steamId64: '102', position: 2 });
  });

  it('deduplicates SteamID entries keeping only the first occurrence (34)', () => {
    const result = normalizeRanking({
      players: [
        { steamid64: '100', name: 'First Occurrence', score: 500 },
        { steamid64: '101', name: 'Unique Player', score: 400 },
        { steamid64: '100', name: 'Duplicate Occurrence', score: 999 },
      ],
    });
    expect(result.players).toHaveLength(2);
    expect(result.players[0]).toMatchObject({
      steamId64: '100',
      name: 'First Occurrence',
      position: 1,
      score: 500,
    });
    expect(result.players[1]).toMatchObject({
      steamId64: '101',
      name: 'Unique Player',
      position: 2,
    });
  });

  it('derives rankedPlayerCount from final valid players length (35)', () => {
    const result = normalizeRanking({
      players: [
        { steamid64: '101' },
        { invalid: true },
        { steamid64: '102' },
      ],
    });
    expect(result.rankedPlayerCount).toBe(2);
    expect(result.rankedPlayerCount).toBe(result.players.length);
  });

  it('derives leader from first player (36)', () => {
    const result = normalizeRanking({
      players: [
        { steamid64: '101', name: 'Top Dog' },
        { steamid64: '102', name: 'Second Place' },
      ],
    });
    expect(result.leader).not.toBeNull();
    expect(result.leader?.name).toBe('Top Dog');
    expect(result.leader?.position).toBe(1);
  });

  it('sets leader to null for empty ranking (37)', () => {
    const result = normalizeRanking({ players: [] });
    expect(result.leader).toBeNull();
  });

  it('handles objects created with Object.create(null) safely (38)', () => {
    const root: Record<string, unknown> = Object.create(null);
    root['generatedAt'] = '2026-08-03T00:00:00Z';
    root['mapsFinalizados'] = 5;

    const player: Record<string, unknown> = Object.create(null);
    player['steamid64'] = '76561198000000001';
    player['name'] = 'Null Proto Player';

    root['players'] = [player];

    const result = normalizeRanking(root);
    expect(result.completedMaps).toBe(5);
    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBe('Null Proto Player');
  });

  it('does not throw for root object getter that throws when accessed (39)', () => {
    const root = {};
    Object.defineProperty(root, 'generatedAt', {
      get() {
        throw new Error('Hostile getter triggered');
      },
    });

    expect(() => normalizeRanking(root)).not.toThrow();
    const result = normalizeRanking(root);
    expect(result.generatedAt).toBeNull();
  });

  it('does not throw for player getter that throws when accessed (40)', () => {
    const playerItem = { steamid64: '76561198000000001' };
    Object.defineProperty(playerItem, 'name', {
      get() {
        throw new Error('Hostile player getter triggered');
      },
    });

    const root = { players: [playerItem] };
    expect(() => normalizeRanking(root)).not.toThrow();
    const result = normalizeRanking(root);
    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBeNull();
  });

  it('ignores unknown or extra properties on payload (41)', () => {
    const result = normalizeRanking({
      unknownRootProp: 'ignored',
      players: [
        {
          steamid64: '101',
          unknownPlayerProp: 'ignored',
          extraData: { foo: 'bar' },
        },
      ],
    });
    expect(result.players).toHaveLength(1);
    expect(Object.keys(result)).toEqual([
      'generatedAt',
      'completedMaps',
      'players',
      'rankedPlayerCount',
      'leader',
    ]);
    expect('unknownRootProp' in result).toBe(false);
  });

  it('does not throw for arbitrary hostile payload structures (42)', () => {
    const hostilePayloads: unknown[] = [
      { players: 'string' },
      { players: [null, undefined, 123, 'str', Symbol('test')] },
      { players: [{ steamid64: {} }] },
      { mapsFinalizados: {} },
      { generatedAt: [] },
    ];

    for (const payload of hostilePayloads) {
      expect(() => normalizeRanking(payload)).not.toThrow();
    }
  });

  it('handles revoked array Proxy safely (43)', () => {
    const { proxy, revoke } = Proxy.revocable<unknown[]>([], {});
    revoke();

    const result = normalizeRanking({ players: proxy });
    expect(result.players).toEqual([]);
    expect(result.rankedPlayerCount).toBe(0);
    expect(result.leader).toBeNull();
  });

  it('handles array Proxy whose getOwnPropertyDescriptor throws for length (44)', () => {
    const proxy = new Proxy([{ steamid64: '101', name: 'Player One' }], {
      getOwnPropertyDescriptor(target, prop) {
        if (prop === 'length') {
          throw new Error('Hostile length descriptor getter');
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });

    const result = normalizeRanking({ players: proxy });
    expect(result.players).toEqual([]);
    expect(result.rankedPlayerCount).toBe(0);
    expect(result.leader).toBeNull();
  });

  it('normalizes player via descriptor without triggering hostile get trap on index (45)', () => {
    const playerItem = { steamid64: '76561198000000001', name: 'Safe Descriptor Player' };
    const proxy = new Proxy([playerItem], {
      get(target, prop, receiver) {
        if (prop === '0') {
          throw new Error('Hostile get trap triggered on index 0');
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    expect(() => normalizeRanking({ players: proxy })).not.toThrow();
    const result = normalizeRanking({ players: proxy });
    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toBe('Safe Descriptor Player');
  });

  it('ignores hostile index getter and processes subsequent valid player (46)', () => {
    const playersList: unknown[] = [];
    Object.defineProperty(playersList, '0', {
      get() {
        throw new Error('Hostile index getter executed');
      },
      enumerable: true,
      configurable: true,
    });

    const validPlayer = { steamid64: '76561198000000002', name: 'Second Valid Player' };
    Object.defineProperty(playersList, '1', {
      value: validPlayer,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(playersList, 'length', {
      value: 2,
      writable: true,
      enumerable: false,
      configurable: false,
    });

    expect(() => normalizeRanking({ players: playersList })).not.toThrow();
    const result = normalizeRanking({ players: playersList });
    expect(result.players).toHaveLength(1);
    expect(result.players[0].steamId64).toBe('76561198000000002');
    expect(result.players[0].position).toBe(1);
    expect(result.leader?.name).toBe('Second Valid Player');
  });

  it('ignores index when getOwnPropertyDescriptor throws and continues processing remaining items (47)', () => {
    const playerOne = { steamid64: '101', name: 'First Player' };
    const playerTwo = { steamid64: '102', name: 'Second Player' };
    const realArray = [playerOne, { hostile: true }, playerTwo];

    const proxy = new Proxy(realArray, {
      getOwnPropertyDescriptor(target, prop) {
        if (prop === '1') {
          throw new Error('Hostile descriptor trap on index 1');
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });

    expect(() => normalizeRanking({ players: proxy })).not.toThrow();
    const result = normalizeRanking({ players: proxy });
    expect(result.players).toHaveLength(2);
    expect(result.players[0]).toMatchObject({
      steamId64: '101',
      position: 1,
      name: 'First Player',
    });
    expect(result.players[1]).toMatchObject({
      steamId64: '102',
      position: 2,
      name: 'Second Player',
    });
  });
});
