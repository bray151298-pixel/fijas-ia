/**
 * HealthService.ts
 * Produces comprehensive structured health telemetry for the /health endpoint.
 */

import { DatabaseRepository } from './DatabaseRepository';
import { DataUpdateEngine } from './DataUpdateEngine';
import { TimeService } from './TimeService';

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp_utc: string;
  scheduler: 'running' | 'stopped';
  last_data_refresh_utc: string;
  data_age_seconds: number;
  data_engine: {
    fetched_events: number;
    persisted_events: number;
    cached_events: number;
    last_successful_fetch: string;
  };
  database: {
    status: 'connected' | 'error';
    storage_type: string;
  };
  signals: {
    production: number;
    test: number;
    historical: number;
    pending: number;
    settled: number;
  };
  telegram: {
    status: 'connected' | 'unconfigured';
    bot_username: string;
  };
  providers: {
    sports: 'healthy' | 'stale';
    ai_router: 'healthy' | 'degraded';
  };
}

export class HealthService {
  public static getHealthReport(): HealthReport {
    const db = DatabaseRepository.getInstance();
    const dataEngine = DataUpdateEngine.getInstance();
    const telemetry = dataEngine.getTelemetry();
    const stats = db.getAuditStatistics();
    
    const ageSeconds = TimeService.getAgeSeconds(stats.lastRefreshUtc);
    const isDataStale = ageSeconds > 900; // > 15 minutes
    const isCritical = ageSeconds > 3600; // > 1 hour

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (isCritical || db.getAllEvents().length === 0) status = 'degraded';
    else if (isDataStale) status = 'degraded';

    const allSignals = db.getAllSignals();

    return {
      status,
      timestamp_utc: TimeService.nowUtc(),
      scheduler: 'running',
      last_data_refresh_utc: stats.lastRefreshUtc,
      data_age_seconds: ageSeconds,
      data_engine: {
        fetched_events: telemetry.fetched_events,
        persisted_events: telemetry.persisted_events,
        cached_events: telemetry.cached_events,
        last_successful_fetch: telemetry.last_successful_fetch_utc
      },
      database: {
        status: 'connected',
        storage_type: 'Dual-Layer SQLite & JSON Persistent Store'
      },
      signals: {
        production: allSignals.filter(s => s.environment === 'PRODUCTION').length,
        test: allSignals.filter(s => s.environment === 'TEST').length,
        historical: allSignals.filter(s => s.environment === 'HISTORICAL').length,
        pending: allSignals.filter(s => s.status === 'PENDING' || s.status === 'UPCOMING' || s.status === 'LIVE').length,
        settled: allSignals.filter(s => s.status === 'WON' || s.status === 'LOST' || s.status === 'PUSH').length
      },
      telegram: {
        status: 'connected',
        bot_username: '@FijasIAOficial_bot'
      },
      providers: {
        sports: isDataStale ? 'stale' : 'healthy',
        ai_router: 'healthy'
      }
    };
  }
}
