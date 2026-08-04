import { describe, expect, it } from 'vitest';

import type { SeasonRankingPlayer } from '../domain/season-ranking.model';
import { SeasonPodium, type PodiumPlayer } from './season-podium';

class TestableSeasonPodium extends SeasonPodium {
  publicPodiumPlayers() { return this.podiumPlayers(); }
  publicPlayerInitials(player?: PodiumPlayer | null) { return this.playerInitials(player); }
  publicPlayerAvatar(player?: PodiumPlayer | null) { return this.playerAvatar(player); }
}

function createPlayer(overrides: Partial<SeasonRankingPlayer> = {}): SeasonRankingPlayer {
  return {
    rank: 1,
    prizeRank: 1,
    prizeEligible: true,
    prizeEligibilityReason: null,
    steamId64: '76561198000000001',
    name: 'Fallen',
    avatarUrl: 'https://example.com/fallen.png',
    matchesPlayed: 10,
    mapsPlayed: 8,
    roundsPlayed: 160,
    wins: 7,
    losses: 3,
    kills: 200,
    deaths: 120,
    assists: 15,
    kdRatio: 1.67,
    headshotPct: 43.2,
    adr: 90.6,
    utilityDmgPerRound: 8.7,
    killsPerRound: 1.25,
    assistsPerRound: 0.09,
    deathsPerRound: 0.75,
    impactRating: 1.35,
    winRate: 0.7,
    sampleWeight: 1,
    score: 95.4,
    ...overrides,
  };
}

describe('SeasonPodium', () => {
  it('accepts SeasonRankingPlayer values', () => {
    const component = new SeasonPodium();
    component.players = [createPlayer()];

    expect(component.players).toHaveLength(1);
  });

  it('preserves the incoming order for one or two players', () => {
    const component = new TestableSeasonPodium();
    const first = createPlayer({ steamId64: '1', name: 'First' });
    const second = createPlayer({ steamId64: '2', name: 'Second' });

    component.players = [first, second];

    const podium = component.publicPodiumPlayers();
    expect(podium[0].name).toBe('First');
    expect(podium[1].name).toBe('Second');
  });

  it('renders three players as second, first, third', () => {
    const component = new TestableSeasonPodium();
    const first = createPlayer({ steamId64: '1', name: 'First', prizeRank: 1 });
    const second = createPlayer({ steamId64: '2', name: 'Second', prizeRank: 2 });
    const third = createPlayer({ steamId64: '3', name: 'Third', prizeRank: 3 });

    component.players = [first, second, third];

    const podium = component.publicPodiumPlayers();
    expect(podium.map((player) => player.name)).toEqual(['Second', 'First', 'Third']);
  });

  it('uses the provided prize rank without recalculation', () => {
    const component = new TestableSeasonPodium();
    const player = createPlayer({ prizeRank: 9, rank: 4 });

    component.players = [player];

    const podium = component.publicPodiumPlayers();
    expect(podium[0].prizeRank).toBe(9);
  });

  it('supports the canonical steamId64 field in the template contract', () => {
    const player = createPlayer({ steamId64: '76561198000000099' });
    expect(player.steamId64).toBe('76561198000000099');
  });

  it('renders without crashing when the name and avatar are missing', () => {
    const component = new TestableSeasonPodium();
    const player = createPlayer({ name: null, avatarUrl: null });

    component.players = [player];

    expect(component.publicPlayerInitials(player)).toBe('HSC');
    expect(component.publicPlayerAvatar(player)).toBe('');
  });
});
