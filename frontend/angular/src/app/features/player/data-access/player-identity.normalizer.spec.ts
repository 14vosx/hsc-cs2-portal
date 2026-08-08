import { describe, expect, it } from 'vitest';

import { normalizePlayerIdentity } from './player-identity.normalizer';

describe('normalizePlayerIdentity', () => {
  it('normalizes identity nested in player', () => {
    expect(
      normalizePlayerIdentity({
        player: {
          displayName: 'Player One',
          steamid64: '76561198000000001',
          avatarMedium: 'https://example.test/avatar.jpg',
          steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000001',
        },
      }),
    ).toEqual({
      displayName: 'Player One',
      steamId64: '76561198000000001',
      avatarMedium: 'https://example.test/avatar.jpg',
      steamProfileUrl: 'https://steamcommunity.com/profiles/76561198000000001',
    });
  });

  it('normalizes identity nested in user', () => {
    expect(
      normalizePlayerIdentity({
        user: { displayName: 'Player Two', steamid64: '76561198000000002' },
      }),
    ).toEqual({
      displayName: 'Player Two',
      steamId64: '76561198000000002',
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('normalizes identity from the root object', () => {
    expect(
      normalizePlayerIdentity({ displayName: 'Player Three', steamid64: '76561198000000003' }),
    ).toEqual({
      displayName: 'Player Three',
      steamId64: '76561198000000003',
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('gives player precedence over user and the root object', () => {
    expect(
      normalizePlayerIdentity({
        displayName: 'Root Player',
        steamid64: 'root-id',
        user: { displayName: 'User Player', steamid64: 'user-id' },
        player: { displayName: 'Nested Player', steamid64: 'player-id' },
      }),
    ).toEqual({
      displayName: 'Nested Player',
      steamId64: 'player-id',
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('gives user precedence over the root object when player is absent', () => {
    expect(
      normalizePlayerIdentity({
        displayName: 'Root Player',
        steamid64: 'root-id',
        user: { displayName: 'User Player', steamid64: 'user-id' },
      }),
    ).toEqual({
      displayName: 'User Player',
      steamId64: 'user-id',
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('recognizes the steamid64 alias', () => {
    expect(normalizePlayerIdentity({ steamid64: 'legacy-id' })?.steamId64).toBe('legacy-id');
  });

  it('recognizes the steamId64 alias', () => {
    expect(normalizePlayerIdentity({ steamId64: 'canonical-id' })?.steamId64).toBe(
      'canonical-id',
    );
  });

  it('gives steamid64 precedence over steamId64', () => {
    expect(
      normalizePlayerIdentity({ steamid64: 'first-id', steamId64: 'second-id' })?.steamId64,
    ).toBe('first-id');
  });

  it('uses steamId64 when steamid64 is empty', () => {
    expect(
      normalizePlayerIdentity({ steamid64: '', steamId64: 'fallback-id' })?.steamId64,
    ).toBe('fallback-id');
  });

  it('uses steamId64 when steamid64 contains only whitespace', () => {
    expect(
      normalizePlayerIdentity({ steamid64: '   ', steamId64: 'fallback-id' })?.steamId64,
    ).toBe('fallback-id');
  });

  it('trims every textual identity field', () => {
    expect(
      normalizePlayerIdentity({
        displayName: '  Player Four  ',
        steamid64: '  76561198000000004  ',
        avatarMedium: '  https://example.test/avatar-four.jpg  ',
        steamProfileUrl: '  https://steamcommunity.com/id/player-four  ',
      }),
    ).toEqual({
      displayName: 'Player Four',
      steamId64: '76561198000000004',
      avatarMedium: 'https://example.test/avatar-four.jpg',
      steamProfileUrl: 'https://steamcommunity.com/id/player-four',
    });
  });

  it('converts empty optional strings to null', () => {
    expect(
      normalizePlayerIdentity({
        steamid64: '76561198000000005',
        avatarMedium: '   ',
        steamProfileUrl: '',
      }),
    ).toEqual({
      displayName: null,
      steamId64: '76561198000000005',
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('represents an absent display name as null', () => {
    expect(normalizePlayerIdentity({ steamid64: 'player-id' })?.displayName).toBeNull();
  });

  it('represents an empty display name as null', () => {
    expect(
      normalizePlayerIdentity({ displayName: '', steamid64: 'player-id' })?.displayName,
    ).toBeNull();
  });

  it('represents a whitespace-only display name as null', () => {
    expect(
      normalizePlayerIdentity({ displayName: '   ', steamid64: 'player-id' })?.displayName,
    ).toBeNull();
  });

  it('returns null when authenticated is explicitly false', () => {
    expect(normalizePlayerIdentity({ authenticated: false, steamid64: 'player-id' })).toBeNull();
  });

  it('accepts authenticated HSC account without Steam when playerAccountId is present', () => {
    expect(
      normalizePlayerIdentity({
        authenticated: true,
        player: {
          playerAccountId: 'player-account-email-only',
          displayName: 'Email Player',
          steamid64: null,
        },
      }),
    ).toEqual({
      displayName: 'Email Player',
      steamId64: null,
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('returns null when Steam ID and playerAccountId are absent', () => {
    expect(normalizePlayerIdentity({ displayName: 'Player Without Id' })).toBeNull();
  });

  it('returns null when Steam ID is empty after trimming', () => {
    expect(normalizePlayerIdentity({ steamid64: '   ', steamId64: '' })).toBeNull();
  });

  it('represents an absent avatar as null', () => {
    expect(normalizePlayerIdentity({ steamid64: 'player-id' })?.avatarMedium).toBeNull();
  });

  it('represents an absent public profile as null', () => {
    expect(normalizePlayerIdentity({ steamid64: 'player-id' })?.steamProfileUrl).toBeNull();
  });

  it('returns null for null', () => {
    expect(normalizePlayerIdentity(null)).toBeNull();
  });

  it('returns null for an array', () => {
    expect(normalizePlayerIdentity([{ steamid64: 'player-id' }])).toBeNull();
  });

  it.each([undefined, 'player-id', 42, true])('returns null for the primitive %s', (input) => {
    expect(normalizePlayerIdentity(input)).toBeNull();
  });

  it('returns null for an incomplete nested identity', () => {
    expect(
      normalizePlayerIdentity({
        player: { displayName: 'Incomplete Player' },
        user: { steamid64: 'ignored-user-id' },
      }),
    ).toBeNull();
  });

  it('does not accept an inherited steamid64 property', () => {
    const input = Object.setPrototypeOf({}, { steamid64: 'inherited-id' });

    expect(normalizePlayerIdentity(input)).toBeNull();
  });

  it('ignores an inherited player property when applying precedence', () => {
    const input = Object.setPrototypeOf(
      { user: { displayName: 'Own User', steamid64: 'user-id' } },
      { player: { displayName: 'Inherited Player', steamid64: 'inherited-id' } },
    );

    expect(normalizePlayerIdentity(input)).toEqual({
      displayName: 'Own User',
      steamId64: 'user-id',
      avatarMedium: null,
      steamProfileUrl: null,
    });
  });

  it('does not execute a steamid64 getter', () => {
    let getterCalls = 0;
    const input = { steamId64: 'fallback-id' };
    Object.defineProperty(input, 'steamid64', {
      get() {
        getterCalls += 1;
        return 'getter-id';
      },
    });

    expect(normalizePlayerIdentity(input)?.steamId64).toBe('fallback-id');
    expect(getterCalls).toBe(0);
  });

  it('does not execute a player getter', () => {
    let getterCalls = 0;
    const input = { user: { displayName: 'Own User', steamid64: 'user-id' } };
    Object.defineProperty(input, 'player', {
      get() {
        getterCalls += 1;
        return { steamid64: 'getter-id' };
      },
    });

    expect(normalizePlayerIdentity(input)?.steamId64).toBe('user-id');
    expect(getterCalls).toBe(0);
  });

  it('does not throw for an accessor that would throw when executed', () => {
    const input = {};
    Object.defineProperty(input, 'steamid64', {
      get() {
        throw new Error('The getter must not execute');
      },
    });

    expect(() => normalizePlayerIdentity(input)).not.toThrow();
    expect(normalizePlayerIdentity(input)).toBeNull();
  });

  it('returns null for a revoked Proxy without throwing', () => {
    const revocable = Proxy.revocable({}, {});
    revocable.revoke();

    expect(() => normalizePlayerIdentity(revocable.proxy)).not.toThrow();
    expect(normalizePlayerIdentity(revocable.proxy)).toBeNull();
  });

  it('returns only canonical identity fields', () => {
    const result = normalizePlayerIdentity({ steamid64: 'player-id' });

    expect(result).not.toBeNull();

    if (!result) {
      throw new Error('Expected a normalized identity');
    }

    expect(Object.keys(result)).toEqual([
      'displayName',
      'steamId64',
      'avatarMedium',
      'steamProfileUrl',
    ]);
    expect('steamid64' in result).toBe(false);
  });

  it('does not mutate the received payload', () => {
    const input = {
      authenticated: true,
      player: {
        displayName: '  Player Five  ',
        steamid64: '  player-five-id  ',
        avatarMedium: '  ',
      },
    };
    const original = {
      authenticated: true,
      player: {
        displayName: '  Player Five  ',
        steamid64: '  player-five-id  ',
        avatarMedium: '  ',
      },
    };

    normalizePlayerIdentity(input);

    expect(input).toEqual(original);
  });
});
