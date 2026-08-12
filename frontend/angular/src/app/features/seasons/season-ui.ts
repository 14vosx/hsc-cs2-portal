import { SeasonDto } from '../../core/api/dto/season.dto';
import { SeasonRankingPlayerDto } from '../../core/api/dto/season-ranking.dto';

export function formatSeasonBoundaryDate(value?: string | null, fallback = 'Sem data'): string {
  if (!value) {
    return fallback;
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

export function eligibilityLabel(player: SeasonRankingPlayerDto): 'Elegível' | 'Em progresso' | 'Indefinido' {
  if (player.prizeEligible === true) {
    return 'Elegível';
  }

  if (player.prizeEligible === false) {
    return 'Em progresso';
  }

  return 'Indefinido';
}

export function eligibilityReason(player: SeasonRankingPlayerDto): string {
  if (player.prizeEligible) {
    return 'Elegível para premiação';
  }

  switch (player.prizeEligibilityReason) {
    case 'below_minimum_maps_and_rounds':
      return 'Faltam mapas e rounds';
    case 'below_minimum_maps':
      return 'Faltam mapas';
    case 'below_minimum_rounds':
      return 'Faltam rounds';
    default:
      return 'Em progresso';
  }
}

export function podiumPlacementLabel(player: SeasonRankingPlayerDto): string {
  switch (player.prizeRank ?? player.rank) {
    case 1:
      return 'Primeiro lugar';
    case 2:
      return 'Segundo lugar';
    case 3:
      return 'Terceiro lugar';
    default:
      return 'Top da Season';
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
