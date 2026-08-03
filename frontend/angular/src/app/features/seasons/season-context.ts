import { SeasonDto, SeasonsIndexDto } from '../../core/api/dto/season.dto';

export type SeasonContextMode = 'active' | 'latest-closed';

export interface SeasonContext {
    slug: string;
    season: SeasonDto;
    mode: SeasonContextMode;
}

export function resolveSeasonContext(
    index?: SeasonsIndexDto | null,
): SeasonContext | null {
    const seasons = index?.seasons ?? [];
    const activeSeasonSlug = index?.activeSeasonSlug?.trim();

    if (activeSeasonSlug) {
        const activeSeason = seasons.find(
            (season) =>
                season.slug?.trim() === activeSeasonSlug &&
                season.status === 'active',
        );

        if (activeSeason) {
            return {
                slug: activeSeasonSlug,
                season: activeSeason,
                mode: 'active',
            };
        }
    }

    const latestClosedSeason = seasons
        .filter(
            (season): season is SeasonDto & { slug: string } =>
                season.status === 'closed' && Boolean(season.slug?.trim()),
        )
        .slice()
        .sort(
            (left, right) =>
                seasonTimestamp(right.end_at) - seasonTimestamp(left.end_at),
        )[0];
    if (!latestClosedSeason) {
        return null;
    }
    return {
        slug: latestClosedSeason.slug.trim(),
        season: latestClosedSeason,
        mode: 'latest-closed',
    };
}

function seasonTimestamp(value?: string | null): number {
    if (!value) {
        return Number.NEGATIVE_INFINITY;
    }

    const timestamp = Date.parse(value);

    return Number.isNaN(timestamp)
        ? Number.NEGATIVE_INFINITY
        : timestamp;
}