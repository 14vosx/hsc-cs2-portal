import { SeasonDto } from '../../core/api/dto/season.dto';
import { SeasonRankingPlayerDto } from '../../core/api/dto/season-ranking.dto';

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
