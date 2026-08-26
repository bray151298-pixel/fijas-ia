/**
 * EventNormalizer.ts
 * Normalizes raw sports provider data (ESPN API) into canonical SportEvent format.
 */

import { SportCategory } from './MarketRulesRegistry';
import { TimeService } from './TimeService';

export type EventStatus = 
  | 'SCHEDULED'
  | 'LIVE'
  | 'HALFTIME'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED';

export interface SportEvent {
  event_id: string;              // Deterministic: EVT_YYYYMMDD_HOME_AWAY
  provider: string;              // 'espn'
  provider_event_id: string;
  sport: SportCategory;
  league: string;
  home_team: string;
  away_team: string;
  start_time_utc: string;        // ISO 8601 UTC
  start_time_local: string;      // America/Lima readable
  status: EventStatus;
  home_score: number | null;
  away_score: number | null;
  period_detail: string;
  last_updated_utc: string;
  data_age_seconds: number;
}

export class EventNormalizer {
  public static normalizeEspnEvent(rawEvent: any, leagueName: string, sport: SportCategory): SportEvent {
    const comp = rawEvent.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    
    const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0] || {};
    const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1] || {};
    
    const homeTeam = homeComp.team?.displayName || 'Local';
    const awayTeam = awayComp.team?.displayName || 'Visita';
    
    const rawState = rawEvent.status?.type?.state || 'pre';
    const status = this.mapEspnState(rawState, rawEvent.status?.type?.name);
    
    const homeScore = homeComp.score !== undefined && homeComp.score !== null ? parseInt(homeComp.score, 10) : null;
    const awayScore = awayComp.score !== undefined && awayComp.score !== null ? parseInt(awayComp.score, 10) : null;
    
    const startTimeUtc = new Date(rawEvent.date || Date.now()).toISOString();
    const startTimeLocal = TimeService.getLimaTimeString(startTimeUtc);
    
    const dateKey = TimeService.getLimaDateIsoFormat(startTimeUtc);
    const cleanHome = homeTeam.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().slice(0, 10);
    const cleanAway = awayTeam.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().slice(0, 10);
    const eventId = `EVT_${dateKey}_${cleanHome}_${cleanAway}`;
    
    const nowUtc = TimeService.nowUtc();

    return {
      event_id: eventId,
      provider: 'espn',
      provider_event_id: rawEvent.id || `${Date.now()}`,
      sport,
      league: leagueName,
      home_team: homeTeam,
      away_team: awayTeam,
      start_time_utc: startTimeUtc,
      start_time_local: startTimeLocal,
      status,
      home_score: isNaN(homeScore as number) ? null : homeScore,
      away_score: isNaN(awayScore as number) ? null : awayScore,
      period_detail: rawEvent.status?.type?.shortDetail || rawEvent.status?.type?.detail || '',
      last_updated_utc: nowUtc,
      data_age_seconds: 0
    };
  }

  private static mapEspnState(state: string, typeName?: string): EventStatus {
    if (state === 'in') return 'LIVE';
    if (state === 'post') return 'FINISHED';
    if (typeName === 'STATUS_POSTPONED' || state === 'postponed') return 'POSTPONED';
    if (typeName === 'STATUS_CANCELED' || state === 'cancelled') return 'CANCELLED';
    if (typeName === 'STATUS_HALFTIME') return 'HALFTIME';
    return 'SCHEDULED';
  }
}
