import { seasonTabLink } from './season-tabs';

describe('seasonTabLink', () => {
  it('builds the canonical overview route', () => {
    expect(seasonTabLink('season-02', 'overview')).toBe(
      '/seasons/season-02',
    );
  });

  it('builds canonical child routes', () => {
    expect(seasonTabLink('season-02', 'ranking')).toBe(
      '/seasons/season-02/ranking',
    );
    expect(seasonTabLink('season-02', 'matches')).toBe(
      '/seasons/season-02/matches',
    );
    expect(seasonTabLink('season-02', 'maps')).toBe(
      '/seasons/season-02/maps',
    );
  });

  it('normalizes whitespace in the slug', () => {
    expect(seasonTabLink('  season-02  ', 'ranking')).toBe(
      '/seasons/season-02/ranking',
    );
  });

  it('falls back safely to the seasons index without a slug', () => {
    expect(seasonTabLink(undefined, 'ranking')).toBe('/seasons');
  });
});