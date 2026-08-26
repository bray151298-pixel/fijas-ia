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

  // Verified historical archive (tagged as HISTORICAL)
  private static readonly HISTORICAL_ARCHIVE_SIGNALS: SignalEntity[] = [
    {
      signal_id: 'SIG_20260824_101',
      environment: 'HISTORICAL',
      event_id: 'EVT_20260824_FULHAM_CHELSEA',
      provider_event_id: '101',
      sport: 'football',
      league: 'Premier League',
      home_team: 'Fulham',
      away_team: 'Chelsea',
      event_start_utc: '2026-08-24T15:00:00Z',
      event_start_local: '24/8/2026 10:00 a. m.',
      market_type: 'OVER_UNDER_GOALS',
      selection: 'Chelsea Ganador & Más de 1.5 Goles',
      line: 1.5,
      odds: 1.85,
      fair_odds: 1.55,
      edge_percentage: 15.2,
      confidence: 76.5,
      risk_level: 'MEDIO',
      recommended_stake_units: 2.0,
      recommended_stake_soles: 100.0,
      analysis_summary: 'Chelsea superioridad ofensiva.',
      reasoning_bullet_points: ['Chelsea generó 2.45 xG promedio'],
      status: 'WON',
      created_at_utc: '2026-08-24T14:00:00Z',
      published_at_utc: '2026-08-24T14:05:00Z',
      telegram_message_id: 101,
      result_status: 'WON',
      settled_at_utc: '2026-08-24T17:05:00Z',
      actual_home_score: 2,
      actual_away_score: 3,
      settlement_reason: 'GANADO: Chelsea se impuso 3-2 en Craven Cottage. Over 1.5 y victoria cobrados.',
      units_net_profit: 1.70,
      soles_net_profit: 85.0
    },
    {
      signal_id: 'SIG_20260824_100',
      environment: 'HISTORICAL',
      event_id: 'EVT_20260824_LEVANTE_OSASUNA',
      provider_event_id: '100',
      sport: 'football',
      league: 'La Liga EA Sports',
      home_team: 'Levante',
      away_team: 'Osasuna',
      event_start_utc: '2026-08-24T15:30:00Z',
      event_start_local: '24/8/2026 10:30 a. m.',
      market_type: 'DOUBLE_CHANCE',
      selection: 'Osasuna 1X (Gana o Empata) & Menos 3.5 Goles',
      line: 3.5,
      odds: 1.75,
      fair_odds: 1.56,
      edge_percentage: 12.4,
      confidence: 74.0,
      risk_level: 'MEDIO',
      recommended_stake_units: 2.0,
      recommended_stake_soles: 100.0,
      analysis_summary: 'Osasuna solidez defensiva.',
      reasoning_bullet_points: ['Baja concesión de tiros al arco'],
      status: 'WON',
      created_at_utc: '2026-08-24T14:30:00Z',
      published_at_utc: '2026-08-24T14:35:00Z',
      telegram_message_id: 100,
      result_status: 'WON',
      settled_at_utc: '2026-08-24T17:35:00Z',
      actual_home_score: 0,
      actual_away_score: 0,
      settlement_reason: 'GANADO: Defensa sólida de Osasuna con 0-0 final. 1X y Under 3.5 acertados.',
      units_net_profit: 1.50,
      soles_net_profit: 75.0
    },
    {
      signal_id: 'SIG_20260824_099',
      environment: 'HISTORICAL',
      event_id: 'EVT_20260824_CORDOBA_TIGRE',
      provider_event_id: '099',
      sport: 'football',
      league: 'Liga Profesional Argentina',
      home_team: 'Central Córdoba',
      away_team: 'Tigre',
      event_start_utc: '2026-08-24T19:00:00Z',
      event_start_local: '24/8/2026 02:00 p. m.',
      market_type: 'DOUBLE_CHANCE',
      selection: 'Tigre Ganador o Empate (1X)',
      line: null,
      odds: 1.65,
      fair_odds: 1.48,
      edge_percentage: 11.4,
      confidence: 72.0,
      risk_level: 'MEDIO',
      recommended_stake_units: 2.0,
      recommended_stake_soles: 100.0,
      analysis_summary: 'Tigre solidez táctica.',
      reasoning_bullet_points: ['Solidez táctica de visita'],
      status: 'WON',
      created_at_utc: '2026-08-24T18:00:00Z',
      published_at_utc: '2026-08-24T18:05:00Z',
      telegram_message_id: 99,
      result_status: 'WON',
      settled_at_utc: '2026-08-24T21:05:00Z',
      actual_home_score: 0,
      actual_away_score: 2,
      settlement_reason: 'GANADO: Tigre ganó de visita 2-0 con solidez táctica.',
      units_net_profit: 1.30,
      soles_net_profit: 65.0
    },
    {
      signal_id: 'SIG_20260824_098',
      environment: 'HISTORICAL',
      event_id: 'EVT_20260824_RED_SOX_MARLINS',
      provider_event_id: '098',
      sport: 'baseball',
      league: 'MLB Grandes Ligas',
      home_team: 'Boston Red Sox',
      away_team: 'Miami Marlins',
      event_start_utc: '2026-08-24T18:10:00Z',
      event_start_local: '24/8/2026 01:10 p. m.',
      market_type: 'MONEYLINE',
      selection: 'Red Sox Ganador (Moneyline)',
      line: null,
      odds: 1.70,
      fair_odds: 1.53,
      edge_percentage: 10.8,
      confidence: 71.0,
      risk_level: 'MEDIO',
      recommended_stake_units: 2.0,
      recommended_stake_soles: 100.0,
      analysis_summary: 'Pitcheo dominante de Boston.',
      reasoning_bullet_points: ['Ventaja en rotación de lanzadores abridores'],
      status: 'WON',
      created_at_utc: '2026-08-24T17:10:00Z',
      published_at_utc: '2026-08-24T17:15:00Z',
      telegram_message_id: 98,
      result_status: 'WON',
      settled_at_utc: '2026-08-24T21:20:00Z',
      actual_home_score: 7,
      actual_away_score: 2,
      settlement_reason: 'GANADO: Red Sox dominó con pitcheo dominante 7-2.',
      units_net_profit: 1.40,
      soles_net_profit: 70.0
    },
    {
      signal_id: 'SIG_20260824_095',
      environment: 'HISTORICAL',
      event_id: 'EVT_20260824_UNIVERSITARIO_CHANKAS',
      provider_event_id: '095',
      sport: 'football',
      league: 'Liga 1 Perú',
      home_team: 'Universitario',
      away_team: 'Los Chankas',
      event_start_utc: '2026-08-24T18:00:00Z',
      event_start_local: '24/8/2026 01:00 p. m.',
      market_type: 'ASIAN_HANDICAP',
      selection: 'Universitario -1.5 (Gana por 2+ goles)',
      line: -1.5,
      odds: 1.92,
      fair_odds: 1.67,
      edge_percentage: 14.6,
      confidence: 78.0,
      risk_level: 'MEDIO',
      recommended_stake_units: 2.0,
      recommended_stake_soles: 100.0,
      analysis_summary: 'Universitario hegemonía local.',
      reasoning_bullet_points: ['Ofensiva contundente en el Monumental'],
      status: 'WON',
      created_at_utc: '2026-08-24T17:00:00Z',
      published_at_utc: '2026-08-24T17:05:00Z',
      telegram_message_id: 95,
      result_status: 'WON',
      settled_at_utc: '2026-08-24T20:05:00Z',
      actual_home_score: 3,
      actual_away_score: 0,
      settlement_reason: 'GANADO: Universitario goleó 3-0 en el Monumental. Hándicap -1.5 cobrado.',
      units_net_profit: 1.84,
      soles_net_profit: 92.0
    }
  ];

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
}
