import { SeasonDto } from '../../core/api/dto/season.dto';
import { SeasonRankingPlayerDto } from '../../core/api/dto/season-ranking.dto';

export interface SeasonPresentationLabel {
  readonly translationKey: string | null;
  readonly raw: string | null;
}

interface PrizeEligibilitySource {
  readonly prizeEligible?: boolean | null;
  readonly prizeEligibilityReason?: string | null;
}

const translated = (translationKey: string): SeasonPresentationLabel => ({ translationKey, raw: null });
const preserved = (raw: string): SeasonPresentationLabel => ({ translationKey: null, raw });

export function formatSeasonBoundaryDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const boundary = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/.exec(value);

  if (!boundary) {
    return value;
  }

  const [, year, month, day] = boundary;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export function seasonCoverImage(season?: SeasonDto | null): string {
  const imageUrl =
    season?.cover_image_url ||
    season?.coverImageUrl ||
    season?.image_url ||
    season?.hero_image_url ||
    '';

  return imageUrl ? `url("${imageUrl}")` : 'none';
}

export function playerAvatar(player?: SeasonRankingPlayerDto | null): string {
  return (
    player?.avatarUrl ||
    player?.avatar_url ||
    player?.steamAvatarUrl ||
    player?.steam_avatar_url ||
    player?.avatar ||
    ''
  );
}

export function playerInitials(player?: SeasonRankingPlayerDto | null): string {
  const name = player?.name?.trim();

  if (!name) {
    return 'HSC';
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function seasonStatusLabel(status?: string | null): SeasonPresentationLabel {
  if (!status) return translated('seasons.shared.status.unavailable');
  if (status === 'active') return translated('seasons.shared.status.active');
  if (status === 'closed') return translated('seasons.shared.status.closed');
  return preserved(status);
}

export function eligibilityLabel(player: Pick<PrizeEligibilitySource, 'prizeEligible'>): SeasonPresentationLabel {
  if (player.prizeEligible === true) {
    return translated('seasons.shared.eligibility.eligible');
  }

  if (player.prizeEligible === false) {
    return translated('seasons.shared.eligibility.inProgress');
  }

  return translated('seasons.shared.eligibility.unknown');
}

export function eligibilityReason(player: PrizeEligibilitySource): SeasonPresentationLabel {
  if (player.prizeEligible) {
    return translated('seasons.shared.eligibility.eligibleForPrize');
  }

  switch (player.prizeEligibilityReason) {
    case 'below_minimum_maps_and_rounds':
      return translated('seasons.shared.eligibility.missingMapsAndRounds');
    case 'below_minimum_maps':
      return translated('seasons.shared.eligibility.missingMaps');
    case 'below_minimum_rounds':
      return translated('seasons.shared.eligibility.missingRounds');
    default:
      return player.prizeEligibilityReason
        ? preserved(player.prizeEligibilityReason)
        : translated('seasons.shared.eligibility.inProgress');
  }
}

export function podiumPlacementLabel(player: Pick<SeasonRankingPlayerDto, 'prizeRank' | 'rank'>): SeasonPresentationLabel {
  switch (player.prizeRank ?? player.rank) {
    case 1:
      return translated('seasons.podium.placement.first');
    case 2:
      return translated('seasons.podium.placement.second');
    case 3:
      return translated('seasons.podium.placement.third');
    default:
      return translated('seasons.podium.placement.top');
  }
}

export function formatStat(value?: number | null, digits = 2): string {
  return typeof value === 'number' ? value.toFixed(digits) : '—';
}

export function formatInteger(value?: number | null): string {
  return typeof value === 'number' ? String(value) : '—';
}

export function formatPercent(value?: number | null, digits = 1): string {
  return typeof value === 'number' ? `${value.toFixed(digits)}%` : '—';
}
