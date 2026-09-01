/**
 * HistoricalStatsRepository.ts
 * Repositorio histórico de estadísticas de equipos y ligas.
 *
 * PRE-F00 FAIL CLOSED: no se seedan ni se inventan perfiles históricos.
 * Las estadísticas reales (por liga y por equipo) se incorporan en F00 mediante
 * providers certificados. Hasta entonces este repositorio devuelve null (equipo)
 * y un objeto NEUTRO sin muestra (liga), y el DataQualityValidator emite
 * NO_EMIT_SIGNAL (muestra insuficiente) para impedir señales no verificadas.
 */

export interface TeamHistoricalStats {
  team: string;
  league: string;
  matchesPlayed: number;
  homeMatches: number;
  awayMatches: number;
  homeGoalsScored: number;
  homeGoalsConceded: number;
  awayGoalsScored: number;
  awayGoalsConceded: number;
  recentFormGf: number; // Goals scored last 5
  recentFormGa: number; // Goals conceded last 5
  lastUpdatedUtc: string;
}

export interface LeagueAverages {
  league: string;
  avgHomeGoals: number;
  avgAwayGoals: number;
  totalMatchesSampled: number;
}

export class HistoricalStatsRepository {
  private static instance: HistoricalStatsRepository;

  // FAIL CLOSED: sin datos fabricados. Proveedores reales en F00.
  private leagueStats: Record<string, LeagueAverages> = {};
  private teamProfiles: Record<string, TeamHistoricalStats> = {};

  private constructor() {}

  public static getInstance(): HistoricalStatsRepository {
    if (!HistoricalStatsRepository.instance) {
      HistoricalStatsRepository.instance = new HistoricalStatsRepository();
    }
    return HistoricalStatsRepository.instance;
  }

  public getLeagueAverages(league: string): LeagueAverages {
    // FAIL CLOSED: sin datos verificados -> objeto neutro con muestra 0.
    return { league, avgHomeGoals: 0, avgAwayGoals: 0, totalMatchesSampled: 0 };
  }

  public getTeamStats(team: string, league: string): TeamHistoricalStats | null {
    // FAIL CLOSED: sólo se devuelven perfiles verificados (F00). Sin datos -> null.
    return null;
  }
}