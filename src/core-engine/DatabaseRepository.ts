/**
 * DatabaseRepository.ts
 * Persistent Single Source of Truth for Events, Signals, Settlements, and Audit History.
 * Clearly separates PRODUCTION, TEST, and HISTORICAL environments.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SportEvent } from './EventNormalizer';
import { SignalEntity, SignalStatus, ResultStatus, SignalEnvironment } from './SignalEntity';
import { TimeService } from './TimeService';
import { PostgresRepository } from './PostgresRepository';


export interface DatabaseState {
  events: Record<string, SportEvent>;
  signals: Record<string, SignalEntity>;
  settledSignalsHistory: SignalEntity[];
  telegram_dispatched_keys: Record<string, number>;
  lastRefreshTimestamp: string;
  dataAgeSeconds: number;
}

export interface EnvironmentAuditMetrics {
  totalSignals: number;
  settledCount: number;
  pendingCount: number;
  wonCount: number;
  lostCount: number;
  pushCount: number;
  winRate: number;
  yieldRoi: number;
  totalUnitsStaked: number;
  netUnitsProfit: number;
  netProfitSoles: number;
}

export class DatabaseRepository {
  private static instance: DatabaseRepository;
  private filePath: string;
  private state: DatabaseState;

  // Verified historical archive.
  // FAIL CLOSED (PRE-F00): NO se siembra historial "certificado" fabricado.
  // Las bases de datos HISTORICAL/PROD sólo se pueblan con señales REALES emitidas por
  // el pipeline cuantitativo F00 y resultado verificado (ledger auditable). Cualquier uso
  // de datos sintéticos debe etiquetarse SYNTHETIC_ONLY=true y jamás alimentar métricas comerciales.
  private static readonly HISTORICAL_ARCHIVE_SIGNALS: SignalEntity[] = [];

  private pg: PostgresRepository;

  private constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'fijas_database.json');
    this.pg = PostgresRepository.getInstance();
    this.state = this.loadState();
    this.createBackupSnapshot();
  }

  private createBackupSnapshot(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const backupDir = path.join(process.cwd(), 'data', 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup_fijas_database_${timestamp}.json`);
        fs.copyFileSync(this.filePath, backupPath);
      }
    } catch (e) {}
  }

  public static getInstance(): DatabaseRepository {
    if (!DatabaseRepository.instance) {
      DatabaseRepository.instance = new DatabaseRepository();
    }
    return DatabaseRepository.instance;
  }

  private loadState(): DatabaseState {
    const historicalMap: Record<string, SignalEntity> = {};
    for (const s of DatabaseRepository.HISTORICAL_ARCHIVE_SIGNALS) {
      historicalMap[s.signal_id] = s;
    }

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        
        const mergedSignals = { ...historicalMap, ...(parsed.signals || {}) };
        return {
          events: parsed.events || {},
          signals: mergedSignals,
          settledSignalsHistory: Array.isArray(parsed.settledSignalsHistory) ? parsed.settledSignalsHistory : [...DatabaseRepository.HISTORICAL_ARCHIVE_SIGNALS],
          telegram_dispatched_keys: parsed.telegram_dispatched_keys || {},
          lastRefreshTimestamp: parsed.lastRefreshTimestamp || TimeService.nowUtc(),
          dataAgeSeconds: parsed.dataAgeSeconds || 0
        };
      }
    } catch (e) {
      console.warn('[DatabaseRepository] Failed to read database file, initializing clean state:', e);
    }

    return {
      events: {},
      signals: historicalMap,
      settledSignalsHistory: [...DatabaseRepository.HISTORICAL_ARCHIVE_SIGNALS],
      telegram_dispatched_keys: {},
      lastRefreshTimestamp: TimeService.nowUtc(),
      dataAgeSeconds: 0
    };
  }

  public saveState(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DatabaseRepository] Error saving database state:', e);
    }
  }

  // --- Events ---
  public saveEvent(event: SportEvent): void {
    this.state.events[event.event_id] = event;
    this.saveState();
  }

  public saveEvents(events: SportEvent[]): void {
    for (const ev of events) {
      this.state.events[ev.event_id] = ev;
    }
    this.state.lastRefreshTimestamp = TimeService.nowUtc();
    this.saveState();
  }

  public getEvent(eventId: string): SportEvent | undefined {
    return this.state.events[eventId];
  }

  public getAllEvents(): SportEvent[] {
    return Object.values(this.state.events);
  }

  // --- Signals ---
  public saveSignal(signal: SignalEntity): void {
    this.state.signals[signal.signal_id] = signal;
    this.saveState();
    this.pg.saveSignal(signal).catch(() => {});
  }

  public getSignal(signalId: string): SignalEntity | undefined {
    return this.state.signals[signalId];
  }

  public getSignalByEventId(eventId: string): SignalEntity | undefined {
    return Object.values(this.state.signals).find(s => s.event_id === eventId);
  }

  public getAllSignals(env?: SignalEnvironment): SignalEntity[] {
    const list = Object.values(this.state.signals);
    if (env) return list.filter(s => s.environment === env);
    return list;
  }

  public getPendingSignals(env: SignalEnvironment = 'PRODUCTION'): SignalEntity[] {
    return Object.values(this.state.signals).filter(
      s => s.environment === env && (s.status === 'PENDING' || s.status === 'UPCOMING' || s.status === 'LIVE')
    );
  }

  public updateSignalStatus(signalId: string, status: SignalStatus): void {
    const signal = this.state.signals[signalId];
    if (signal) {
      signal.status = status;
      this.saveState();
    }
  }

  public settleSignal(
    signalId: string, 
    resultStatus: ResultStatus, 
    homeScore: number, 
    awayScore: number, 
    reason: string,
    unitsNet: number,
    solesNet: number
  ): SignalEntity | null {
    const signal = this.state.signals[signalId];
    if (!signal) return null;

    signal.result_status = resultStatus;
    signal.status = resultStatus === 'WON' ? 'WON' : resultStatus === 'LOST' ? 'LOST' : resultStatus === 'PUSH' ? 'PUSH' : 'VOID';
    signal.actual_home_score = homeScore;
    signal.actual_away_score = awayScore;
    signal.settled_at_utc = TimeService.nowUtc();
    signal.settlement_reason = reason;
    signal.units_net_profit = unitsNet;
    signal.soles_net_profit = solesNet;

    const historyIndex = this.state.settledSignalsHistory.findIndex(s => s.signal_id === signalId);
    if (historyIndex >= 0) {
      this.state.settledSignalsHistory[historyIndex] = { ...signal };
    } else {
      this.state.settledSignalsHistory.unshift({ ...signal });
    }

    this.saveState();
    this.pg.saveSignal(signal).catch(() => {});
    return signal;
  }

  // --- Statistics by Environment ---
  private calculateMetricsForList(signals: SignalEntity[]): EnvironmentAuditMetrics {
    const settled = signals.filter(s => s.status === 'WON' || s.status === 'LOST' || s.status === 'PUSH');
    const won = settled.filter(s => s.status === 'WON');
    const lost = settled.filter(s => s.status === 'LOST');
    const push = settled.filter(s => s.status === 'PUSH');
    const pending = signals.filter(s => s.status === 'PENDING' || s.status === 'UPCOMING' || s.status === 'LIVE');

    const totalSettledCount = won.length + lost.length;
    const winRate = totalSettledCount > 0 ? Number(((won.length / totalSettledCount) * 100).toFixed(2)) : 0;
    const totalUnitsStaked = settled.reduce((acc, s) => acc + s.recommended_stake_units, 0);
    const netUnitsProfit = settled.reduce((acc, s) => acc + s.units_net_profit, 0);
    const netProfitSoles = settled.reduce((acc, s) => acc + s.soles_net_profit, 0);
    const yieldRoi = totalUnitsStaked > 0 ? Number(((netUnitsProfit / totalUnitsStaked) * 100).toFixed(2)) : 0;

    return {
      totalSignals: signals.length,
      settledCount: settled.length,
      pendingCount: pending.length,
      wonCount: won.length,
      lostCount: lost.length,
      pushCount: push.length,
      winRate,
      yieldRoi,
      totalUnitsStaked: Number(totalUnitsStaked.toFixed(2)),
      netUnitsProfit: Number(netUnitsProfit.toFixed(2)),
      netProfitSoles: Number(netProfitSoles.toFixed(2))
    };
  }


  // --- Telegram Idempotency Shield ---
  public isTelegramDispatched(signalId: string, type: 'SIGNAL' | 'RESULT'): boolean {
    const key = `${signalId}_${type}`;
    return Boolean(this.state.telegram_dispatched_keys[key]);
  }

  public recordTelegramDispatched(signalId: string, type: 'SIGNAL' | 'RESULT', messageId: number): void {
    const key = `${signalId}_${type}`;
    this.state.telegram_dispatched_keys[key] = messageId;
    this.saveState();
    this.pg.recordTelegramDispatch(signalId, type, messageId).catch(() => {});
  }

  public getAuditStatistics() {
    const all = Object.values(this.state.signals);
    const prodSignals = all.filter(s => s.environment === 'PRODUCTION');
    const histSignals = all.filter(s => s.environment === 'HISTORICAL');
    const testSignals = all.filter(s => s.environment === 'TEST');

    return {
      production: this.calculateMetricsForList(prodSignals),
      historical: this.calculateMetricsForList(histSignals),
      test: this.calculateMetricsForList(testSignals),
      all: this.calculateMetricsForList(all),
      lastRefreshUtc: this.state.lastRefreshTimestamp
    };
  }

  /**
   * Recovers PRODUCTION/TEST pending signals from PostgreSQL into the in-memory
   * state so that the settlement engine can operate on the Primary Source of Truth
   * even after a container restart (FASE 9 CASO 5/6). Non-destructive: existing
   * in-memory entries are preserved (Postgres is only used as a fallback seed source).
   */
  public async syncFromPostgres(env: SignalEnvironment = 'PRODUCTION'): Promise<number> {
    try {
      const pgSignals = await this.pg.getAllSignals(env);
      let synced = 0;
      for (const sig of pgSignals) {
        if (!(sig.signal_id in this.state.signals)) {
          this.state.signals[sig.signal_id] = sig;
          synced++;
        }
      }
      if (synced > 0) this.saveState();
      return synced;
    } catch (e) {
      console.warn('[DatabaseRepository] syncFromPostgres error:', (e as Error).message);
      return 0;
    }
  }
}
