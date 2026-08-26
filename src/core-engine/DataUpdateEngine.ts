/**
 * DataUpdateEngine.ts
 * Coordinates real-time data fetching across multiple sports endpoints with adaptive intervals.
 */

import { SportEvent, EventNormalizer } from './EventNormalizer';
import { DatabaseRepository } from './DatabaseRepository';
import { TimeService } from './TimeService';
import { SportCategory } from './MarketRulesRegistry';

export interface LeagueEndpoint {
  league: string;
  sport: SportCategory;
  url: string;
}

export class DataUpdateEngine {
  private static instance: DataUpdateEngine;
  private db: DatabaseRepository;
  private lastSuccessfulFetchUtc: string = TimeService.nowUtc();
  private fetchedEventsCount: number = 0;
  private persistedEventsCount: number = 0;

  // Refresh intervals in milliseconds
  public static readonly INTERVAL_UPCOMING_MS = 10 * 60 * 1000;   // 10 minutes
  public static readonly INTERVAL_NEAR_START_MS = 3 * 60 * 1000;  // 3 minutes
  public static readonly INTERVAL_LIVE_MS = 30 * 1000;            // 30 seconds
  public static readonly INTERVAL_FINAL_CONFIRM_MS = 60 * 1000;   // 1 minute

  private constructor() {
    this.db = DatabaseRepository.getInstance();
  }

  public static getInstance(): DataUpdateEngine {
    if (!DataUpdateEngine.instance) {
      DataUpdateEngine.instance = new DataUpdateEngine();
    }
    return DataUpdateEngine.instance;
  }

  public getEndpoints(dateIsoParam?: string): LeagueEndpoint[] {
    const query = dateIsoParam ? `?dates=${dateIsoParam}` : '';
    return [
      { league: 'Copa Libertadores', sport: 'football', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/conmebol.libertadores/scoreboard${query}` },
      { league: 'Copa Sudamericana', sport: 'football', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/conmebol.sudamericana/scoreboard${query}` },
      { league: 'UEFA Champions League', sport: 'football', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard${query}` },
      { league: 'Liga 1 Perú', sport: 'football', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/per.1/scoreboard${query}` },
      { league: 'Liga Profesional Argentina', sport: 'football', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard${query}` },
      { league: 'Brasileirao Serie A', sport: 'football', url: `https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/scoreboard${query}` },
      { league: 'MLB Grandes Ligas', sport: 'baseball', url: `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard${query}` },
      { league: 'WNBA Baloncesto', sport: 'basketball', url: `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard${query}` }
    ];
  }

  public async fetchRealEvents(dateIsoParam?: string): Promise<SportEvent[]> {
    const targetDate = dateIsoParam || TimeService.getLimaDateIsoFormat();
    const endpoints = this.getEndpoints(targetDate);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.espn.com/'
    };

    const fetchedEvents: SportEvent[] = [];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(ep.url, { headers, signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          for (const raw of (data.events || [])) {
            const normalized = EventNormalizer.normalizeEspnEvent(raw, ep.league, ep.sport);
            fetchedEvents.push(normalized);
          }
        }
      } catch (err) {
        // Individual league timeout ignored gracefully
      }
    }

    this.fetchedEventsCount = fetchedEvents.length;
    if (fetchedEvents.length > 0) {
      this.lastSuccessfulFetchUtc = TimeService.nowUtc();
      this.db.saveEvents(fetchedEvents);
      this.persistedEventsCount = this.db.getAllEvents().length;
    } else {
      this.persistedEventsCount = this.db.getAllEvents().length;
    }

    return fetchedEvents;
  }

  public getTelemetry() {
    return {
      fetched_events: this.fetchedEventsCount,
      persisted_events: this.db.getAllEvents().length,
      cached_events: this.db.getAllEvents().length,
      last_successful_fetch_utc: this.lastSuccessfulFetchUtc
    };
  }
}
