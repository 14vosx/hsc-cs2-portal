import { SeasonsIndexDto } from '../../core/api/dto/season.dto';
import { resolveSeasonContext } from './season-context';

describe('resolveSeasonContext', () => {
  it('uses the explicitly active season', () => {
    const index: SeasonsIndexDto = {
      activeSeasonSlug: 'season-02',
      seasons: [
        {
          slug: 'season-01',
          status: 'closed',
          end_at: '2026-06-30T23:59:59Z',
        },
        {
          slug: 'season-02',
          status: 'active',
          end_at: '2026-08-31T23:59:59Z',
        },
      ],
    };

    expect(resolveSeasonContext(index)).toEqual({
      slug: 'season-02',
      season: index.seasons?.[1],
      mode: 'active',
    });
  });

  it('falls back to the latest closed season when none is active', () => {
    const index: SeasonsIndexDto = {
      activeSeasonSlug: null,
      seasons: [
        {
          slug: 'season-01',
          status: 'closed',
          end_at: '2026-06-30T23:59:59Z',
        },
        {
          slug: 'season-02',
          status: 'closed',
          end_at: '2026-07-31T23:59:59Z',
        },
      ],
    };

    expect(resolveSeasonContext(index)).toEqual({
      slug: 'season-02',
      season: index.seasons?.[1],
      mode: 'latest-closed',
    });
  });

  it('does not expose draft seasons as fallback', () => {
    const index: SeasonsIndexDto = {
      activeSeasonSlug: null,
      seasons: [
        {
          slug: 'season-03',
          status: 'draft',
          end_at: '2026-09-30T23:59:59Z',
        },
      ],
    };

    expect(resolveSeasonContext(index)).toBeNull();
  });
});