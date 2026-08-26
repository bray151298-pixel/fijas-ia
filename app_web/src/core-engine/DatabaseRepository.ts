/**
 * DatabaseRepository.ts
 * Persistent Single Source of Truth for Events, Signals, Settlements, and Audit History.
 * Supports persistent JSON storage on disk with cold-boot recovery and SQLite-ready schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SportEvent } from './EventNormalizer';
import { SignalEntity, SignalStatus, ResultStatus } from './SignalEntity';
import { TimeService } from './TimeService';

export interface DatabaseState {
  events: Record<string, SportEvent>;
  signals: Record<string, SignalEntity>;
  settledSignalsHistory: SignalEntity[];
  lastRefreshTimestamp: string;
  dataAgeSeconds: number;
}

export class DatabaseRepository {
  private static instance: DatabaseRepository;
  private filePath: string;
  private state: DatabaseState;

  private constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'fijas_database.json');
    this.state = this.loadState();
  }

  public static getInstance(): DatabaseRepository {
    if (!DatabaseRepository.instance) {
      DatabaseRepository.instance = new DatabaseRepository();
    }
    return DatabaseRepository.instance;
  }

  private loadState(): DatabaseState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          events: parsed.events || {},
          signals: parsed.signals || {},
          settledSignalsHistory: Array.isArray(parsed.settledSignalsHistory) ? parsed.settledSignalsHistory : [],
          lastRefreshTimestamp: parsed.lastRefreshTimestamp || TimeService.nowUtc(),
          dataAgeSeconds: parsed.dataAgeSeconds || 0
        };
      }
    } catch (e) {
      console.warn('[DatabaseRepository] Failed to read database file, initializing clean state:', e);
    }

    return {
      events: {},
      signals: {},
      settledSignalsHistory: [],
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
  }

  public getSignal(signalId: string): SignalEntity | undefined {
    return this.state.signals[signalId];
  }

  public getSignalByEventId(eventId: string): SignalEntity | undefined {
    return Object.values(this.state.signals).find(s => s.event_id === eventId);
  }

  public getAllSignals(): SignalEntity[] {
    return Object.values(this.state.signals);
  }

  public getPendingSignals(): SignalEntity[] {
    return Object.values(this.state.signals).filter(
      s => s.status === 'PENDING' || s.status === 'UPCOMING' || s.status === 'LIVE'
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

    // Check if not already in history
    const historyIndex = this.state.settledSignalsHistory.findIndex(s => s.signal_id === signalId);
    if (historyIndex >= 0) {
      this.state.settledSignalsHistory[historyIndex] = { ...signal };
    } else {
      this.state.settledSignalsHistory.unshift({ ...signal });
    }

    this.saveState();
    return signal;
  }

  // --- Statistics ---
  public getAuditStatistics() {
    const settled = Object.values(this.state.signals).filter(
      s => s.status === 'WON' || s.status === 'LOST' || s.status === 'PUSH'
    );
    const won = settled.filter(s => s.status === 'WON');
    const lost = settled.filter(s => s.status === 'LOST');
    const push = settled.filter(s => s.status === 'PUSH');
    const pending = Object.values(this.state.signals).filter(
      s => s.status === 'PENDING' || s.status === 'UPCOMING' || s.status === 'LIVE'
    );

    const totalSettledCount = won.length + lost.length;
    const winRate = totalSettledCount > 0 ? Number(((won.length / totalSettledCount) * 100).toFixed(2)) : 0;
    const totalUnitsStaked = settled.reduce((acc, s) => acc + s.recommended_stake_units, 0);
    const netUnitsProfit = settled.reduce((acc, s) => acc + s.units_net_profit, 0);
    const netProfitSoles = settled.reduce((acc, s) => acc + s.soles_net_profit, 0);
    const yieldRoi = totalUnitsStaked > 0 ? Number(((netUnitsProfit / totalUnitsStaked) * 100).toFixed(2)) : 0;

    return {
      totalSignals: Object.keys(this.state.signals).length,
      settledCount: settled.length,
      pendingCount: pending.length,
      wonCount: won.length,
      lostCount: lost.length,
      pushCount: push.length,
      winRate,
      yieldRoi,
      totalUnitsStaked: Number(totalUnitsStaked.toFixed(2)),
      netUnitsProfit: Number(netUnitsProfit.toFixed(2)),
      netProfitSoles: Number(netProfitSoles.toFixed(2)),
      lastRefreshUtc: this.state.lastRefreshTimestamp
    };
  }
}
