/**
 * ESPN Live Scoreboards & Real-Time Schedule Integration Service
 * Conexión en Vivo con Feeds Oficiales de ESPN y Filtro Cuantitativo Estricto Pre-Partido (Hora de Lima UTC-5)
 */

export interface ESPNRosterTeam {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo?: string;
}

export interface ESPNMatchCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: ESPNRosterTeam;
  score?: string;
  records?: Array<{ name: string; summary: string }>;
}

export interface ESPNScheduledMatch {
  id: string;
  name: string;
  shortName: string;
  league: string;
  leagueId: string;
  sport: 'football' | 'basketball' | 'tennis' | 'baseball' | 'mma';
  sportEmoji: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  venue: string;
  isoDate: string;
  kickoffTimestamp: number;
  kickoffLima: string;
  timeOnlyLima: string;
  statusName: string;
  statusState: 'pre' | 'in' | 'post';
  // Quantitative Analysis fields
  recommendedPick?: {
    market: string;
    selection: string;
    odds: number;
    fairOdds: number;
    modelProb: number;
    edge: number;
    stakeUnits: number;
    isVIP: boolean;
    analysis: string;
  };
}

export const ESPN_LEAGUE_ENDPOINTS = [
  {
    id: 'per.1',
    name: 'Liga 1 Perú (Torneo Clausura)',
    sport: 'football' as const,
    sportEmoji: '⚽',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/per.1/scoreboard'
  },
  {
    id: 'esp.1',
    name: 'La Liga EA Sports (España)',
    sport: 'football' as const,
    sportEmoji: '⚽',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard'
  },
  {
    id: 'ita.1',
    name: 'Serie A (Italia)',
    sport: 'football' as const,
    sportEmoji: '⚽',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard'
  },
  {
    id: 'eng.1',
    name: 'Premier League (Inglaterra)',
    sport: 'football' as const,
    sportEmoji: '⚽',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard'
  },
  {
    id: 'ger.1',
    name: 'Bundesliga (Alemania)',
    sport: 'football' as const,
    sportEmoji: '⚽',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard'
  },
  {
    id: 'arg.1',
    name: 'Liga Profesional Argentina',
    sport: 'football' as const,
    sportEmoji: '⚽',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard'
  },
  {
    id: 'bra.1',
    name: 'Brasileirão Serie A',
    sport: 'football' as const,
    sportEmoji: '⚽',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/scoreboard'
  },
  {
    id: 'mlb',
    name: 'MLB Grandes Ligas',
    sport: 'baseball' as const,
    sportEmoji: '⚾',
    url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard'
  },
  {
    id: 'wnba',
    name: 'Básquetbol WNBA / NBA',
    sport: 'basketball' as const,
    sportEmoji: '🏀',
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard'
  }
];

/**
 * Convierte cualquier fecha ISO al huso horario de Lima (America/Lima UTC-5)
 * Ejemplo: "Hoy 18:30 (6:30 p.m. Lima)"
 */
export function formatToLimaTime(isoDateStr: string): { fullDisplay: string; timeOnly: string } {
  try {
    const date = new Date(isoDateStr);
    if (isNaN(date.getTime())) {
      return { fullDisplay: "Hora por confirmar", timeOnly: "Por confirmar" };
    }

    const timeFormatted = date.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const time12h = date.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Comparar fecha de hoy en Lima
    const nowInLima = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    const matchInLima = date.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    const isToday = nowInLima === matchInLima;

    let dayPrefix = "Hoy";
    if (!isToday) {
      const matchDay = date.toLocaleDateString('es-PE', { 
        timeZone: 'America/Lima', 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
      dayPrefix = matchDay.charAt(0).toUpperCase() + matchDay.slice(1);
    }

    return {
      fullDisplay: `${dayPrefix} ${timeFormatted} (${time12h} Lima)`,
      timeOnly: `${timeFormatted} (${time12h})`
    };
  } catch {
    return { fullDisplay: "Hora por confirmar", timeOnly: "Por confirmar" };
  }
}

/**
 * Genera el análisis cuantitativo y selección +EV para un partido programado real.
 *
 * PRE-F00 FAIL CLOSED: los pronósticos cuantitativos (probabilidad, edge, stake,
 * cuota justa) se generarán únicamente con el Motor Cuantitativo certificado (F00).
 * Hasta entonces NO se inventan picks: devuelve null para todos los partidos.
 */
function buildQuantitativePrediction(
  homeTeam: string,
  awayTeam: string,
  league: string,
  sport: string
): ESPNScheduledMatch['recommendedPick'] {
  return null; // FAIL CLOSED: sin pronóstico cuantitativo verificado (F00)
}

/**
 * Consulta en vivo todos los endpoints oficiales de ESPN Scoreboard y aplica
 * el FILTRO ESTRICTO PRE-MATCH (solo partidos futuros con kickoffTime > now).
 */
export async function fetchLiveESPNFutureMatches(): Promise<{
  allScheduled: ESPNScheduledMatch[];
  freePicks: ESPNScheduledMatch[];
  vipPicks: ESPNScheduledMatch[];
  lastUpdated: string;
}> {
  const now = Date.now();
  const scheduledList: ESPNScheduledMatch[] = [];

  for (const endpoint of ESPN_LEAGUE_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(endpoint.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FijasIA/3.0'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;
      const data = await response.json();
      const events: any[] = data.events || [];

      for (const e of events) {
        const state = e.status?.type?.state; // 'pre', 'in', 'post'
        const statusName = e.status?.type?.name; // 'STATUS_SCHEDULED', 'STATUS_FINAL', etc.
        const matchTimestamp = new Date(e.date).getTime();

        // VALIDACIÓN ESTRICTA: SOLO PARTIDOS FUTUROS PRE-MATCH
        // Descartar inmediatamente partidos terminados (post/final) o en juego (in)
        const isStrictlyFuture = matchTimestamp > now;
        const isPreMatch = state === 'pre' && (statusName === 'STATUS_SCHEDULED' || statusName?.includes('SCHEDULED'));

        if (isPreMatch && isStrictlyFuture) {
          const comp = e.competitions?.[0] || {};
          const competitors: any[] = comp.competitors || [];
          const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
          const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};

          const homeName = home.team?.displayName || home.team?.name || 'Local';
          const awayName = away.team?.displayName || away.team?.name || 'Visita';
          const venue = comp.venue?.fullName || comp.venue?.address?.city || 'Estadio Principal';

          const { fullDisplay, timeOnly } = formatToLimaTime(e.date);

          const quantitativePick = buildQuantitativePrediction(
            homeName,
            awayName,
            endpoint.name,
            endpoint.sport
          );

          scheduledList.push({
            id: `espn-${e.id || Math.random().toString(36).substring(7)}`,
            name: e.name || `${homeName} vs ${awayName}`,
            shortName: e.shortName || `${homeName} vs ${awayName}`,
            league: endpoint.name,
            leagueId: endpoint.id,
            sport: endpoint.sport,
            sportEmoji: endpoint.sportEmoji,
            homeTeam: homeName,
            awayTeam: awayName,
            homeLogo: home.team?.logo,
            awayLogo: away.team?.logo,
            venue,
            isoDate: e.date,
            kickoffTimestamp: matchTimestamp,
            kickoffLima: fullDisplay,
            timeOnlyLima: timeOnly,
            statusName: statusName || 'STATUS_SCHEDULED',
            statusState: 'pre',
            recommendedPick: quantitativePick
          });
        }
      }
    } catch (err: any) {
      console.warn(`[ESPN Service] Warning fetching ${endpoint.name}:`, err.message);
    }
  }

  // Ordenar por hora de inicio cronológica (más próximo primero)
  scheduledList.sort((a, b) => a.kickoffTimestamp - b.kickoffTimestamp);

  // Separar en pronósticos Gratuitos (abiertos) y VIP (+EV de élite).
  // FAIL CLOSED: sólo se consideran picks reales del pipeline cuantitativo (F00).
  const freePicks = scheduledList.filter(m => m.recommendedPick && !m.recommendedPick.isVIP);
  const vipPicks = scheduledList.filter(m => m.recommendedPick?.isVIP);

  const nowLimaStr = new Date().toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return {
    allScheduled: scheduledList,
    freePicks: freePicks.slice(0, 4),
    vipPicks: vipPicks.slice(0, 8),
    lastUpdated: `Hoy, ${nowLimaStr} (Hora Lima)`
  };
}
