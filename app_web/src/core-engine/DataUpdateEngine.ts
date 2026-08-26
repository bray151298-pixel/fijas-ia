/**
 * DataUpdateEngine.ts
 * Coordinates real-time data fetching across multiple sports endpoints via Fastly CDN & API edge.
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
    const dateQuery = dateIsoParam ? `&dates=${dateIsoParam}` : '';
    return [
      { league: 'Copa Libertadores', sport: 'football', url: `https://cdn.espn.com/core/soccer/scoreboard?league=conmebol.libertadores&xhr=1${dateQuery}` },
      { league: 'Copa Sudamericana', sport: 'football', url: `https://cdn.espn.com/core/soccer/scoreboard?league=conmebol.sudamericana&xhr=1${dateQuery}` },
      { league: 'UEFA Champions League', sport: 'football', url: `https://cdn.espn.com/core/soccer/scoreboard?league=uefa.champions&xhr=1${dateQuery}` },
      { league: 'Liga 1 Perú', sport: 'football', url: `https://cdn.espn.com/core/soccer/scoreboard?league=per.1&xhr=1${dateQuery}` },
      { league: 'Liga Profesional Argentina', sport: 'football', url: `https://cdn.espn.com/core/soccer/scoreboard?league=arg.1&xhr=1${dateQuery}` },
      { league: 'Brasileirao Serie A', sport: 'football', url: `https://cdn.espn.com/core/soccer/scoreboard?league=bra.1&xhr=1${dateQuery}` },
      { league: 'MLB Grandes Ligas', sport: 'baseball', url: `https://cdn.espn.com/core/mlb/scoreboard?xhr=1${dateQuery}` },
      { league: 'WNBA Baloncesto', sport: 'basketball', url: `https://cdn.espn.com/core/wnba/scoreboard?xhr=1${dateQuery}` }
    ];
  }

  public async fetchRealEvents(dateIsoParam?: string): Promise<SportEvent[]> {
    const endpoints = this.getEndpoints(dateIsoParam);

    const fetchTasks = endpoints.map(async (ep) => {
      const epEvents: SportEvent[] = [];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(ep.url, {
          headers: {
            'Accept': 'application/json, text/plain, */*'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const rawEvents = data.content?.sbData?.events || data.events || [];
          for (const raw of rawEvents) {
            try {
              const normalized = EventNormalizer.normalizeEspnEvent(raw, ep.league, ep.sport);
              if (normalized && normalized.home_team && normalized.away_team) {
                epEvents.push(normalized);
              }
            } catch (errNormalizing) {
              // Ignore single malformed match
            }
          }
        }
      } catch (errFetch) {
        // Individual league error handled gracefully
      }
      return epEvents;
    });

    const settledResults = await Promise.allSettled(fetchTasks);
    const fetchedEvents: SportEvent[] = [];

    for (const result of settledResults) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        fetchedEvents.push(...result.value);
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
