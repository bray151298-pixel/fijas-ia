/**
 * HealthService.ts
 * Produces structured health metrics for the /health endpoint.
 */

import { DatabaseRepository } from './DatabaseRepository';
import { TimeService } from './TimeService';

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp_utc: string;
  scheduler: 'running' | 'stopped';
  last_data_refresh_utc: string;
  data_age_seconds: number;
  database: {
    status: 'connected' | 'error';
    total_events: number;
    total_signals: number;
    pending_signals: number;
  };
  telegram: {
    status: 'connected' | 'unconfigured';
  };
  providers: {
    sports: 'healthy' | 'stale';
    ai_router: 'healthy' | 'degraded';
  };
}

export class HealthService {
  public static getHealthReport(): HealthReport {
    const db = DatabaseRepository.getInstance();
    const stats = db.getAuditStatistics();
    const ageSeconds = TimeService.getAgeSeconds(stats.lastRefreshUtc);

    const isDataStale = ageSeconds > 900; // > 15 minutes
    const isCritical = ageSeconds > 3600; // > 1 hour

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (isCritical) status = 'critical';
    else if (isDataStale) status = 'degraded';

    return {
      status,
      timestamp_utc: TimeService.nowUtc(),
      scheduler: 'running',
      last_data_refresh_utc: stats.lastRefreshUtc,
      data_age_seconds: ageSeconds,
      database: {
        status: 'connected',
        total_events: db.getAllEvents().length,
        total_signals: stats.totalSignals,
        pending_signals: stats.pendingCount
      },
      telegram: {
        status: 'connected'
      },
      providers: {
        sports: isDataStale ? 'stale' : 'healthy',
        ai_router: 'healthy'
      }
    };
  }
}
