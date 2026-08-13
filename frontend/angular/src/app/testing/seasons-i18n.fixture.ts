import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export type SeasonsTestLocale = 'pt-BR' | 'en-US';

export const PT_BR_SEASONS_TRANSLATIONS = {
  "tabs": {
    "ariaLabel": "Navegação da temporada",
    "overview": "Visão geral",
    "ranking": "Ranking",
    "matches": "Partidas",
    "maps": "Mapas"
  },
  "shared": {
    "back": "Todas as temporadas",
    "period": "Período",
    "until": "até",
    "updated": "Dados atualizados",
    "updatedAt": "Atualizado em",
    "lastActivity": "Última atividade",
    "players": "Jogadores",
    "eligiblePlayers": "Elegíveis",
    "matches": "Partidas",
    "maps": "Mapas",
    "rounds": "Rounds",
    "player": "Jogador",
    "position": "Pos.",
    "eligibilityLabel": "Elegibilidade",
    "date": {
      "short": "Sem data",
      "open": "Data em aberto"
    },
    "status": {
      "active": "Temporada ativa",
      "closed": "Temporada encerrada",
      "unavailable": "Status indisponível"
    },
    "eligibility": {
      "eligible": "Elegível",
      "inProgress": "Em progresso",
      "unknown": "Indefinido",
      "eligibleForPrize": "Elegível para premiação",
      "missingMapsAndRounds": "Faltam mapas e rounds",
      "missingMaps": "Faltam mapas",
      "missingRounds": "Faltam rounds"
    },
    "fallbacks": {
      "season": "Temporada HSC",
      "description": "Temporada competitiva oficial do HSC.",
      "player": "Sem nome",
      "team": "Time não informado",
      "map": "Mapa não informado"
    }
  },
  "index": {
    "hero": {
      "eyebrow": "Temporadas HSC",
      "titleStart": "Circuito",
      "titleEmphasis": "competitivo HSC",
      "description": "Temporada atual, histórico competitivo e ranking em um só lugar."
    },
    "states": {
      "loadingEyebrow": "Arquivo competitivo",
      "loading": "Carregando temporadas...",
      "errorTitle": "Temporadas indisponíveis",
      "errorMessage": "Não foi possível carregar as temporadas neste momento.",
      "emptyTitle": "Nenhuma temporada disponível",
      "emptyMessage": "As temporadas oficiais do clube aparecerão por aqui."
    },
    "active": {
      "label": "Temporada ativa"
    },
    "archive": {
      "eyebrow": "Arquivo competitivo",
      "title": "Histórico de temporadas",
      "description": "Consulte as temporadas publicadas pelo HSC."
    },
    "actions": {
      "enter": "Entrar na temporada",
      "ranking": "Ver ranking",
      "season": "Ver temporada"
    },
    "fallbacks": {
      "description": "Temporada competitiva HSC."
    }
  },
  "overview": {
    "states": {
      "loadingEyebrow": "Central da temporada",
      "loading": "Carregando temporada...",
      "errorTitle": "Temporada indisponível",
      "errorMessage": "Não foi possível carregar esta temporada neste momento.",
      "notFoundTitle": "Temporada não encontrada",
      "notFoundMessage": "A temporada solicitada não está disponível."
    },
    "summary": {
      "ariaLabel": "Resumo competitivo da temporada"
    },
    "prize": {
      "eyebrow": "Premiação",
      "title": "Top 3 premiável",
      "description": "Candidatos publicados para premiação nesta temporada."
    },
    "rankingPreview": {
      "eyebrow": "Ranking oficial",
      "title": "Top da temporada",
      "complete": "Ranking completo",
      "ariaLabel": "Top 5 da temporada",
      "emptyTitle": "Ranking ainda sem dados",
      "emptyMessage": "Os jogadores aparecerão aqui quando o ranking for publicado."
    },
    "rules": {
      "eyebrow": "Premiação e regras",
      "title": "Critérios de elegibilidade",
      "description": "O Top 3 da temporada será premiado. A premiação será anunciada em breve.",
      "minMaps": "Mapas mínimos",
      "minRounds": "Rounds mínimos",
      "roundsPerMap": "Rounds por mapa válido"
    },
    "explore": {
      "eyebrow": "Explore a temporada",
      "title": "Partidas e mapas",
      "description": "Acesse os recortes competitivos desta temporada.",
      "matchesDescription": "Consulte os confrontos desta temporada.",
      "mapsDescription": "Veja os mapas disputados nesta temporada.",
      "viewMatches": "Ver partidas",
      "viewMaps": "Ver mapas"
    }
  },
  "podium": {
    "ariaLabel": "Top 3 premiável",
    "placement": {
      "first": "Primeiro lugar",
      "second": "Segundo lugar",
      "third": "Terceiro lugar",
      "top": "Top da temporada"
    },
    "record": "V/D"
  },
  "ranking": {
    "states": {
      "loadingTitle": "Carregando ranking da temporada...",
      "loadingMessage": "Sincronizando a classificação da temporada.",
      "errorTitle": "Ranking indisponível",
      "errorMessage": "Não foi possível carregar o ranking da temporada neste momento.",
      "retry": "Tentar novamente",
      "unavailableTitle": "Nenhuma temporada disponível",
      "unavailableMessage": "Não existe uma temporada disponível para exibir o ranking neste momento."
    },
    "hero": {
      "eyebrow": "Ranking da temporada",
      "description": "Classificação competitiva desta temporada.",
      "formula": "Fórmula"
    },
    "classification": {
      "eyebrow": "Classificação",
      "title": "Classificação",
      "description": "A ordem segue a classificação oficial publicada.",
      "emptyTitle": "Ainda não há jogadores classificados",
      "emptyMessage": "A temporada {{ season }} existe, mas ainda não possui jogadores no ranking.",
      "searchEmptyTitle": "Nenhum jogador encontrado",
      "searchEmptyMessage": "Ajuste a busca para ver a classificação completa."
    },
    "search": {
      "label": "Buscar jogador",
      "placeholder": "Nome do jogador"
    },
    "prize": {
      "eyebrow": "Premiação",
      "title": "Top 3 premiável",
      "description": "Os candidatos são publicados pelo ranking oficial da temporada.",
      "empty": "Ainda não há candidatos publicados para o Top 3.",
      "criteriaAriaLabel": "Critérios de premiação"
    },
    "accessibility": {
      "full": "Classificação completa da temporada"
    },
    "table": {
      "wins": "V",
      "losses": "D",
      "record": "V/D",
      "winPct": "Vit%"
    }
  },
  "matches": {
    "states": {
      "loadingTitle": "Carregando partidas...",
      "loadingMessage": "Buscando histórico de partidas da temporada.",
      "unavailableTitle": "Temporada não encontrada",
      "unavailableMessage": "A temporada solicitada não está disponível no histórico do Portal CS2.",
      "back": "Voltar para temporadas",
      "errorTitle": "Partidas indisponíveis",
      "errorMessage": "Não foi possível carregar as partidas da temporada no momento.",
      "retry": "Tentar novamente",
      "emptyTitle": "Nenhuma partida na temporada",
      "emptyMessage": "O recorte publicado não retornou partidas válidas para esta temporada."
    },
    "hero": {
      "eyebrow": "Histórico de partidas",
      "description": "Histórico competitivo oficial desta temporada."
    },
    "summary": {
      "ariaLabel": "Resumo das partidas da temporada",
      "lastMap": "Último mapa"
    },
    "history": {
      "eyebrow": "Partidas",
      "title": "Histórico da temporada",
      "description": "Confrontos publicados nesta temporada, na ordem oficial.",
      "feedAriaLabel": "Feed de partidas da temporada"
    },
    "match": {
      "label": "Partida",
      "winner": "Vencedor",
      "mapsAriaLabel": "Mapas do confronto",
      "report": "Ver relatório"
    },
    "counts": {
      "maps": {
        "one": "{{ count }} mapa na temporada",
        "other": "{{ count }} mapas na temporada"
      },
      "rounds": {
        "one": "{{ count }} round válido",
        "other": "{{ count }} rounds válidos"
      }
    }
  },
  "maps": {
    "states": {
      "loadingTitle": "Carregando mapas...",
      "loadingMessage": "Buscando estatísticas dos mapas da temporada.",
      "unavailableTitle": "Temporada não encontrada",
      "unavailableMessage": "A temporada solicitada não está disponível no histórico do Portal CS2.",
      "back": "Voltar para temporadas",
      "errorTitle": "Mapas indisponíveis",
      "errorMessage": "Não foi possível carregar os mapas da temporada no momento.",
      "retry": "Tentar novamente",
      "searchEmptyTitle": "Nenhum mapa encontrado",
      "searchEmptyMessage": "A busca atual não encontrou mapas nesta temporada.",
      "emptyTitle": "Nenhum mapa na temporada",
      "emptyMessage": "O recorte publicado não retornou mapas válidos para esta temporada."
    },
    "hero": {
      "eyebrow": "Map pool da temporada",
      "description": "Mapas disputados no recorte publicado desta temporada."
    },
    "summary": {
      "ariaLabel": "Resumo dos mapas da temporada",
      "distinct": "Mapas distintos",
      "lastMap": "Último mapa"
    },
    "pool": {
      "eyebrow": "Map pool da temporada",
      "title": "Mapas da temporada",
      "description": "Mapas disputados nesta temporada, com métricas publicadas e acesso ao detalhe global."
    },
    "search": {
      "label": "Buscar mapa",
      "placeholder": "Ex.: de_mirage",
      "sortLabel": "Ordenar por"
    },
    "sort": {
      "published": "Ordem oficial (publicada)",
      "matches": "Mais partidas",
      "rounds": "Mais rounds",
      "lastPlayed": "Último uso",
      "name": "Nome (A–Z)"
    },
    "card": {
      "map": "Mapa",
      "averageRounds": "Média de rounds",
      "lastUsed": "Último uso",
      "view": "Ver mapa"
    }
  }
} as const;

export const EN_US_SEASONS_TRANSLATIONS = {
  "tabs": {
    "ariaLabel": "Season navigation",
    "overview": "Overview",
    "ranking": "Ranking",
    "matches": "Matches",
    "maps": "Maps"
  },
  "shared": {
    "back": "All seasons",
    "period": "Period",
    "until": "to",
    "updated": "Data updated",
    "updatedAt": "Updated at",
    "lastActivity": "Last activity",
    "players": "Players",
    "eligiblePlayers": "Eligible",
    "matches": "Matches",
    "maps": "Maps",
    "rounds": "Rounds",
    "player": "Player",
    "position": "Rank",
    "eligibilityLabel": "Eligibility",
    "date": {
      "short": "No date",
      "open": "Open date"
    },
    "status": {
      "active": "Active season",
      "closed": "Closed season",
      "unavailable": "Status unavailable"
    },
    "eligibility": {
      "eligible": "Eligible",
      "inProgress": "In progress",
      "unknown": "Unknown",
      "eligibleForPrize": "Eligible for prize",
      "missingMapsAndRounds": "Missing maps and rounds",
      "missingMaps": "Missing maps",
      "missingRounds": "Missing rounds"
    },
    "fallbacks": {
      "season": "HSC Season",
      "description": "Official HSC competitive season.",
      "player": "Unnamed player",
      "team": "Team unavailable",
      "map": "Map unavailable"
    }
  },
  "index": {
    "hero": {
      "eyebrow": "HSC Seasons",
      "titleStart": "HSC competitive",
      "titleEmphasis": "circuit",
      "description": "Current season, competitive history, and ranking in one place."
    },
    "states": {
      "loadingEyebrow": "Competitive archive",
      "loading": "Loading seasons...",
      "errorTitle": "Seasons unavailable",
      "errorMessage": "Could not load seasons right now.",
      "emptyTitle": "No seasons available",
      "emptyMessage": "The club's official seasons will appear here."
    },
    "active": {
      "label": "Active season"
    },
    "archive": {
      "eyebrow": "Competitive archive",
      "title": "Season history",
      "description": "Browse seasons published by HSC."
    },
    "actions": {
      "enter": "Enter season",
      "ranking": "View ranking",
      "season": "View season"
    },
    "fallbacks": {
      "description": "HSC competitive season."
    }
  },
  "overview": {
    "states": {
      "loadingEyebrow": "Season command center",
      "loading": "Loading season...",
      "errorTitle": "Season unavailable",
      "errorMessage": "Could not load this season right now.",
      "notFoundTitle": "Season not found",
      "notFoundMessage": "The requested season is unavailable."
    },
    "summary": {
      "ariaLabel": "Season competitive summary"
    },
    "prize": {
      "eyebrow": "Prize",
      "title": "Prize-eligible Top 3",
      "description": "Published prize candidates for this season."
    },
    "rankingPreview": {
      "eyebrow": "Official ranking",
      "title": "Season top",
      "complete": "Full ranking",
      "ariaLabel": "Season Top 5",
      "emptyTitle": "No ranking data yet",
      "emptyMessage": "Players will appear here when the ranking is published."
    },
    "rules": {
      "eyebrow": "Prize and rules",
      "title": "Eligibility criteria",
      "description": "The Season Top 3 will receive prizes. Prizes will be announced soon.",
      "minMaps": "Minimum maps",
      "minRounds": "Minimum rounds",
      "roundsPerMap": "Rounds per valid map"
    },
    "explore": {
      "eyebrow": "Explore the season",
      "title": "Matches and maps",
      "description": "Browse this season's competitive views.",
      "matchesDescription": "Browse this season's matchups.",
      "mapsDescription": "View maps played this season.",
      "viewMatches": "View matches",
      "viewMaps": "View maps"
    }
  },
  "podium": {
    "ariaLabel": "Prize-eligible Top 3",
    "placement": {
      "first": "First place",
      "second": "Second place",
      "third": "Third place",
      "top": "Season top"
    },
    "record": "W/L"
  },
  "ranking": {
    "states": {
      "loadingTitle": "Loading season ranking...",
      "loadingMessage": "Syncing the season leaderboard.",
      "errorTitle": "Ranking unavailable",
      "errorMessage": "Could not load the season ranking right now.",
      "retry": "Try again",
      "unavailableTitle": "No season available",
      "unavailableMessage": "There is no season available to display a ranking right now."
    },
    "hero": {
      "eyebrow": "Season ranking",
      "description": "This season's competitive ranking.",
      "formula": "Formula"
    },
    "classification": {
      "eyebrow": "Ranking",
      "title": "Leaderboard",
      "description": "The order follows the official published ranking.",
      "emptyTitle": "No ranked players yet",
      "emptyMessage": "Season {{ season }} exists but has no ranked players yet.",
      "searchEmptyTitle": "No players found",
      "searchEmptyMessage": "Adjust your search to view the full ranking."
    },
    "search": {
      "label": "Search player",
      "placeholder": "Player name"
    },
    "prize": {
      "eyebrow": "Prize",
      "title": "Prize-eligible Top 3",
      "description": "Candidates are published by the official season ranking.",
      "empty": "No Top 3 candidates have been published yet.",
      "criteriaAriaLabel": "Prize criteria"
    },
    "accessibility": {
      "full": "Full season leaderboard"
    },
    "table": {
      "wins": "W",
      "losses": "L",
      "record": "W/L",
      "winPct": "Win%"
    }
  },
  "matches": {
    "states": {
      "loadingTitle": "Loading matches...",
      "loadingMessage": "Fetching the season match history.",
      "unavailableTitle": "Season not found",
      "unavailableMessage": "The requested season is unavailable in the CS2 Portal history.",
      "back": "Back to seasons",
      "errorTitle": "Matches unavailable",
      "errorMessage": "Could not load the season matches right now.",
      "retry": "Try again",
      "emptyTitle": "No matches in this season",
      "emptyMessage": "The published view returned no valid matches for this season."
    },
    "hero": {
      "eyebrow": "Season match log",
      "description": "This season's official competitive history."
    },
    "summary": {
      "ariaLabel": "Season match summary",
      "lastMap": "Latest map"
    },
    "history": {
      "eyebrow": "Matches",
      "title": "Season history",
      "description": "Matchups published this season in official order.",
      "feedAriaLabel": "Season match feed"
    },
    "match": {
      "label": "Match",
      "winner": "Winner",
      "mapsAriaLabel": "Matchup maps",
      "report": "View report"
    },
    "counts": {
      "maps": {
        "one": "{{ count }} map in the season",
        "other": "{{ count }} maps in the season"
      },
      "rounds": {
        "one": "{{ count }} valid round",
        "other": "{{ count }} valid rounds"
      }
    }
  },
  "maps": {
    "states": {
      "loadingTitle": "Loading maps...",
      "loadingMessage": "Fetching season map statistics.",
      "unavailableTitle": "Season not found",
      "unavailableMessage": "The requested season is unavailable in the CS2 Portal history.",
      "back": "Back to seasons",
      "errorTitle": "Maps unavailable",
      "errorMessage": "Could not load the season maps right now.",
      "retry": "Try again",
      "searchEmptyTitle": "No maps found",
      "searchEmptyMessage": "The current search found no maps in this season.",
      "emptyTitle": "No maps in this season",
      "emptyMessage": "The published view returned no valid maps for this season."
    },
    "hero": {
      "eyebrow": "Season map pool",
      "description": "Maps played in this season's published view."
    },
    "summary": {
      "ariaLabel": "Season map summary",
      "distinct": "Distinct maps",
      "lastMap": "Latest map"
    },
    "pool": {
      "eyebrow": "Season map pool",
      "title": "Season maps",
      "description": "Maps played this season, with published metrics and links to global details."
    },
    "search": {
      "label": "Search map",
      "placeholder": "E.g.: de_mirage",
      "sortLabel": "Sort by"
    },
    "sort": {
      "published": "Official order (published)",
      "matches": "Most matches",
      "rounds": "Most rounds",
      "lastPlayed": "Last used",
      "name": "Name (A–Z)"
    },
    "card": {
      "map": "Map",
      "averageRounds": "Average rounds",
      "lastUsed": "Last used",
      "view": "View map"
    }
  }
} as const;

export async function installSeasonsTranslations(
  translate: TranslateService,
  initialLocale: SeasonsTestLocale = 'pt-BR',
): Promise<void> {
  translate.setTranslation('pt-BR', { seasons: PT_BR_SEASONS_TRANSLATIONS });
  translate.setTranslation('en-US', { seasons: EN_US_SEASONS_TRANSLATIONS });
  await firstValueFrom(translate.use(initialLocale));
}

