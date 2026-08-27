/**
 * PostgresRepository.ts
 * Enterprise PostgreSQL Persistence Layer for FIJAS IA Single Source of Truth.
 * Handles auto DDL creation, row migrations from JSON/SQLite, and resilient connection pooling.
 */

import { Pool, PoolConfig } from 'pg';
import { SignalEntity, SignalEnvironment, SignalStatus, ResultStatus } from './SignalEntity';
import { SportEvent } from './EventNormalizer';
import { TimeService } from './TimeService';

export class PostgresRepository {
  private static instance: PostgresRepository;
  private pool: Pool | null = null;
  private isConnected: boolean = false;
  private connectionError: string | null = null;

  private constructor() {
    this.initPool();
  }

  public static getInstance(): PostgresRepository {
    if (!PostgresRepository.instance) {
      PostgresRepository.instance = new PostgresRepository();
    }
    return PostgresRepository.instance;
  }

  private initPool(): void {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!databaseUrl) {
      this.isConnected = false;
      this.connectionError = 'DATABASE_URL not configured in environment';
      console.log('[PostgresRepository] DATABASE_URL not configured. Operating in Dual SQLite + JSON fallback mode.');
      return;
    }

    try {
      const config: PoolConfig = {
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') 
          ? false 
          : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      };

      this.pool = new Pool(config);
      this.testAndMigrate();
    } catch (err) {
      this.isConnected = false;
      this.connectionError = (err as Error).message;
      console.warn('[PostgresRepository] Failed to initialize connection pool:', (err as Error).message);
    }
  }

  private async testAndMigrate(): Promise<void> {
    if (!this.pool) return;
    try {
      const client = await this.pool.connect();
      this.isConnected = true;
      this.connectionError = null;
      console.log('[PostgresRepository] ✅ PostgreSQL connected successfully to Primary Source of Truth.');

      await this.createTables(client);
      client.release();
    } catch (err) {
      this.isConnected = false;
      this.connectionError = (err as Error).message;
      console.warn('[PostgresRepository] PostgreSQL connection error:', (err as Error).message);
    }
  }

  private async createTables(client: any): Promise<void> {
    // 1. events
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        event_id VARCHAR(100) PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        provider_event_id VARCHAR(50),
        sport VARCHAR(50) NOT NULL,
        league VARCHAR(100) NOT NULL,
        home_team VARCHAR(100) NOT NULL,
        away_team VARCHAR(100) NOT NULL,
        start_time_utc TIMESTAMPTZ NOT NULL,
        start_time_local VARCHAR(50),
        status VARCHAR(50) NOT NULL,
        home_score INT,
        away_score INT,
        period_detail VARCHAR(50),
        last_updated_utc TIMESTAMPTZ NOT NULL,
        data_age_seconds INT DEFAULT 0
      );
    `);

    // 2. signals
    await client.query(`
      CREATE TABLE IF NOT EXISTS signals (
        signal_id VARCHAR(50) PRIMARY KEY,
        environment VARCHAR(20) NOT NULL DEFAULT 'PRODUCTION',
        event_id VARCHAR(100) NOT NULL,
        provider_event_id VARCHAR(50),
        sport VARCHAR(50) NOT NULL,
        league VARCHAR(100) NOT NULL,
        home_team VARCHAR(100) NOT NULL,
        away_team VARCHAR(100) NOT NULL,
        event_start_utc TIMESTAMPTZ NOT NULL,
        event_start_local VARCHAR(50),
        market_type VARCHAR(50) NOT NULL,
        selection VARCHAR(255) NOT NULL,
        line NUMERIC(6,2),
        odds NUMERIC(6,2) NOT NULL,
        fair_odds NUMERIC(6,2),
        edge_percentage NUMERIC(6,2),
        confidence NUMERIC(6,2),
        risk_level VARCHAR(20),
        recommended_stake_units NUMERIC(6,2),
        recommended_stake_soles NUMERIC(8,2),
        analysis_summary TEXT,
        reasoning_bullet_points JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        created_at_utc TIMESTAMPTZ NOT NULL,
        published_at_utc TIMESTAMPTZ,
        telegram_message_id BIGINT,
        result_status VARCHAR(30) DEFAULT 'UNRESOLVED',
        settled_at_utc TIMESTAMPTZ,
        actual_home_score INT,
        actual_away_score INT,
        settlement_reason TEXT,
        units_net_profit NUMERIC(8,2) DEFAULT 0,
        soles_net_profit NUMERIC(10,2) DEFAULT 0,
        settlement_attempts INT DEFAULT 0,
        last_settlement_attempt TIMESTAMPTZ,
        last_settlement_error TEXT,
        updated_at_utc TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_signals_env ON signals(environment);
      CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
      CREATE INDEX IF NOT EXISTS idx_signals_event ON signals(event_id);
    `);

    // 3. signal_settlements
    await client.query(`
      CREATE TABLE IF NOT EXISTS signal_settlements (
        id SERIAL PRIMARY KEY,
        signal_id VARCHAR(50) REFERENCES signals(signal_id),
        result_status VARCHAR(30) NOT NULL,
        actual_home_score INT NOT NULL,
        actual_away_score INT NOT NULL,
        settlement_reason TEXT,
        units_net_profit NUMERIC(8,2) NOT NULL,
        soles_net_profit NUMERIC(10,2) NOT NULL,
        settled_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. telegram_dispatches
    await client.query(`
      CREATE TABLE IF NOT EXISTS telegram_dispatches (
        dispatch_key VARCHAR(100) PRIMARY KEY,
        signal_id VARCHAR(50) NOT NULL,
        dispatch_type VARCHAR(30) NOT NULL,
        telegram_message_id BIGINT,
        dispatched_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. system_state
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_state (
        state_key VARCHAR(50) PRIMARY KEY,
        state_value JSONB NOT NULL,
        updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Idempotent migrations for settlement-retry observability columns (FASE 8)
    await client.query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS settlement_attempts INT DEFAULT 0;`);
    await client.query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS last_settlement_attempt TIMESTAMPTZ;`);
    await client.query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS last_settlement_error TEXT;`);

    console.log('[PostgresRepository] Schema tables verified and ready.');
  }

  public getStatus() {
    return {
      configured: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      connected: this.isConnected,
      error: this.connectionError
    };
  }

  // --- Async Operations ---
  public async saveSignal(signal: SignalEntity): Promise<void> {
    if (!this.pool || !this.isConnected) return;
    const query = `
      INSERT INTO signals (
        signal_id, environment, event_id, provider_event_id, sport, league,
        home_team, away_team, event_start_utc, event_start_local, market_type,
        selection, line, odds, fair_odds, edge_percentage, confidence, risk_level,
        recommended_stake_units, recommended_stake_soles, analysis_summary,
        reasoning_bullet_points, status, created_at_utc, published_at_utc,
        telegram_message_id, result_status, settled_at_utc, actual_home_score,
        actual_away_score, settlement_reason, units_net_profit, soles_net_profit,
        settlement_attempts, last_settlement_attempt, last_settlement_error, updated_at_utc
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
        $34, $35, $36, NOW()
      )
      ON CONFLICT (signal_id) DO UPDATE SET
        status = EXCLUDED.status,
        result_status = EXCLUDED.result_status,
        actual_home_score = EXCLUDED.actual_home_score,
        actual_away_score = EXCLUDED.actual_away_score,
        settled_at_utc = EXCLUDED.settled_at_utc,
        settlement_reason = EXCLUDED.settlement_reason,
        units_net_profit = EXCLUDED.units_net_profit,
        soles_net_profit = EXCLUDED.soles_net_profit,
        telegram_message_id = EXCLUDED.telegram_message_id,
        published_at_utc = EXCLUDED.published_at_utc,
        settlement_attempts = EXCLUDED.settlement_attempts,
        last_settlement_attempt = EXCLUDED.last_settlement_attempt,
        last_settlement_error = EXCLUDED.last_settlement_error,
        updated_at_utc = NOW();
    `;

    try {
      await this.pool.query(query, [
        signal.signal_id,
        signal.environment,
        signal.event_id,
        signal.provider_event_id,
        signal.sport,
        signal.league,
        signal.home_team,
        signal.away_team,
        signal.event_start_utc,
        signal.event_start_local,
        signal.market_type,
        signal.selection,
        signal.line,
        signal.odds,
        signal.fair_odds,
        signal.edge_percentage,
        signal.confidence,
        signal.risk_level,
        signal.recommended_stake_units,
        signal.recommended_stake_soles,
        signal.analysis_summary,
        JSON.stringify(signal.reasoning_bullet_points || []),
        signal.status,
        signal.created_at_utc,
        signal.published_at_utc,
        signal.telegram_message_id,
        signal.result_status,
        signal.settled_at_utc,
        signal.actual_home_score,
        signal.actual_away_score,
        signal.settlement_reason,
        signal.units_net_profit,
        signal.soles_net_profit,
        signal.settlement_attempts ?? 0,
        signal.last_settlement_attempt ?? null,
        signal.last_settlement_error ?? null
      ]);
    } catch (err) {
      console.warn(`[PostgresRepository] Error saving signal ${signal.signal_id}:`, (err as Error).message);
    }
  }

  public async getSignal(signalId: string): Promise<SignalEntity | null> {
    if (!this.pool || !this.isConnected) return null;
    try {
      const res = await this.pool.query('SELECT * FROM signals WHERE signal_id = $1', [signalId]);
      if (res.rows.length === 0) return null;
      return this.mapRowToSignal(res.rows[0]);
    } catch (err) {
      console.warn(`[PostgresRepository] Error reading signal ${signalId}:`, (err as Error).message);
      return null;
    }
  }

  public async getAllSignals(env?: SignalEnvironment): Promise<SignalEntity[]> {
    if (!this.pool || !this.isConnected) return [];
    try {
      const query = env 
        ? 'SELECT * FROM signals WHERE environment = $1 ORDER BY created_at_utc DESC'
        : 'SELECT * FROM signals ORDER BY created_at_utc DESC';
      const res = env ? await this.pool.query(query, [env]) : await this.pool.query(query);
      return res.rows.map(r => this.mapRowToSignal(r));
    } catch (err) {
      console.warn('[PostgresRepository] Error fetching all signals:', (err as Error).message);
      return [];
    }
  }

  public async recordTelegramDispatch(signalId: string, dispatchType: string, messageId: number): Promise<void> {
    if (!this.pool || !this.isConnected) return;
    const key = `${signalId}_${dispatchType}`;
    try {
      await this.pool.query(`
        INSERT INTO telegram_dispatches (dispatch_key, signal_id, dispatch_type, telegram_message_id, dispatched_at_utc)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (dispatch_key) DO NOTHING;
      `, [key, signalId, dispatchType, messageId]);
    } catch (err) {
      console.warn('[PostgresRepository] Error recording telegram dispatch:', (err as Error).message);
    }
  }

  public async isTelegramDispatched(signalId: string, dispatchType: string): Promise<boolean> {
    if (!this.pool || !this.isConnected) return false;
    const key = `${signalId}_${dispatchType}`;
    try {
      const res = await this.pool.query('SELECT 1 FROM telegram_dispatches WHERE dispatch_key = $1', [key]);
      return res.rows.length > 0;
    } catch (err) {
      return false;
    }
  }

  private mapRowToSignal(row: any): SignalEntity {
    return {
      signal_id: row.signal_id,
      environment: row.environment as SignalEnvironment,
      event_id: row.event_id,
      provider_event_id: row.provider_event_id,
      sport: row.sport,
      league: row.league,
      home_team: row.home_team,
      away_team: row.away_team,
      event_start_utc: new Date(row.event_start_utc).toISOString(),
      event_start_local: row.event_start_local,
      market_type: row.market_type,
      selection: row.selection,
      line: row.line !== null ? Number(row.line) : null,
      odds: Number(row.odds),
      fair_odds: Number(row.fair_odds),
      edge_percentage: Number(row.edge_percentage),
      confidence: Number(row.confidence),
      risk_level: row.risk_level,
      recommended_stake_units: Number(row.recommended_stake_units),
      recommended_stake_soles: Number(row.recommended_stake_soles),
      analysis_summary: row.analysis_summary,
      reasoning_bullet_points: typeof row.reasoning_bullet_points === 'string' 
        ? JSON.parse(row.reasoning_bullet_points) 
        : (row.reasoning_bullet_points || []),
      status: row.status as SignalStatus,
      created_at_utc: new Date(row.created_at_utc).toISOString(),
      published_at_utc: row.published_at_utc ? new Date(row.published_at_utc).toISOString() : null,
      telegram_message_id: row.telegram_message_id ? Number(row.telegram_message_id) : null,
      result_status: row.result_status as ResultStatus,
      settled_at_utc: row.settled_at_utc ? new Date(row.settled_at_utc).toISOString() : null,
      actual_home_score: row.actual_home_score !== null ? Number(row.actual_home_score) : null,
      actual_away_score: row.actual_away_score !== null ? Number(row.actual_away_score) : null,
      settlement_reason: row.settlement_reason,
      units_net_profit: Number(row.units_net_profit || 0),
      soles_net_profit: Number(row.soles_net_profit || 0),
      settlement_attempts: row.settlement_attempts !== null ? Number(row.settlement_attempts) : 0,
      last_settlement_attempt: row.last_settlement_attempt ? new Date(row.last_settlement_attempt).toISOString() : null,
      last_settlement_error: row.last_settlement_error || null
    };
  }
}
