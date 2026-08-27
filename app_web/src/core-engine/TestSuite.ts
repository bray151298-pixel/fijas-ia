/**
 * TestSuite.ts
 * Enterprise Automated Verification Suite for CASO 1 through CASO 13.
 */

import { EventValidator } from './EventValidator';
import { MarketRulesRegistry } from './MarketRulesRegistry';
import { SettlementEngine } from './SettlementEngine';
import { SportEvent } from './EventNormalizer';
import { SignalEntity } from './SignalEntity';
import { DatabaseRepository } from './DatabaseRepository';
import { TimeService } from './TimeService';
import { PoissonEngine } from './PoissonEngine';
import { ProbabilityEngine } from './ProbabilityEngine';
import { DataQualityValidator } from './DataQualityValidator';
import { MarketEvaluator } from './MarketEvaluator';
import { SignalDecisionEngine } from './SignalDecisionEngine';
import { OddsProvider } from './OddsProvider';

export interface TestCaseResult {
  caseId: string;
  title: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export class TestSuite {
  public static async runAllTests(): Promise<TestCaseResult[]> {
    const results: TestCaseResult[] = [];

    // CASO 1: Partido de ayer -> REJECTED / STALE_EVENT
    const yesterdayEvent: SportEvent = {
      event_id: 'EVT_20260824_YESTERDAY',
      provider: 'espn',
      provider_event_id: '123',
      sport: 'football',
      league: 'La Liga',
      home_team: 'Levante',
      away_team: 'Osasuna',
      start_time_utc: new Date(Date.now() - 86400000).toISOString(),
      start_time_local: 'Ayer',
      status: 'FINISHED',
      home_score: 0,
      away_score: 0,
      period_detail: 'Final',
      last_updated_utc: TimeService.nowUtc(),
      data_age_seconds: 0
    };
    const c1Validation = EventValidator.validateForSignalGeneration(yesterdayEvent, new Set());
    results.push({
      caseId: 'CASO_1',
      title: 'Partido de ayer debe ser rechazado',
      passed: !c1Validation.isValidForSignalCreation && (c1Validation.status === 'FINISHED' || c1Validation.status === 'STARTED'),
      expected: 'isValidForSignalCreation = false (FINISHED o STARTED)',
      actual: `status = ${c1Validation.status}, isValid = ${c1Validation.isValidForSignalCreation}`
    });

    // CASO 2: MLB + "Más de 1.5 Goles" -> MARKET_INCOMPATIBLE / REJECTED
    const c2Validation = MarketRulesRegistry.validateSelectionText('baseball', 'MONEYLINE', 'Más de 1.5 Goles');
    results.push({
      caseId: 'CASO_2',
      title: 'MLB con término "Goles" debe ser rechazado',
      passed: !c2Validation.valid,
      expected: 'valid = false',
      actual: `valid = ${c2Validation.valid}, reason = ${c2Validation.reason}`
    });

    // CASO 3: WNBA + "Ganador o Empate" -> MARKET_INCOMPATIBLE / REJECTED
    const c3Validation = MarketRulesRegistry.validateSelectionText('basketball', 'MONEYLINE', 'Ganador o Empate (1X)');
    results.push({
      caseId: 'CASO_3',
      title: 'WNBA/Básquetbol con término "Empate/1X" debe ser rechazado',
      passed: !c3Validation.valid,
      expected: 'valid = false',
      actual: `valid = ${c3Validation.valid}, reason = ${c3Validation.reason}`
    });

    // CASO 4: Signal original Connecticut Sun -4.5 con resultado 87 - 81 -> WON
    const wnbaSignal: SignalEntity = {
      signal_id: 'SIG_20260826_004',
      environment: 'TEST',
      event_id: 'EVT_20260826_SUN_SKY',
      provider_event_id: '456',
      sport: 'basketball',
      league: 'WNBA',
      home_team: 'Connecticut Sun',
      away_team: 'Chicago Sky',
      event_start_utc: TimeService.nowUtc(),
      event_start_local: 'Hoy 18:00',
      market_type: 'POINT_SPREAD',
      selection: 'Connecticut Sun -4.5 Puntos',
      line: -4.5,
      odds: 1.90,
      fair_odds: 1.70,
      edge_percentage: 11.8,
      confidence: 72.0,
      risk_level: 'MEDIO',
      recommended_stake_units: 1.5,
      recommended_stake_soles: 75.0,
      analysis_summary: 'Análisis Spread',
      reasoning_bullet_points: ['Razón 1'],
      status: 'PENDING',
      created_at_utc: TimeService.nowUtc(),
      published_at_utc: null,
      telegram_message_id: null,
      result_status: 'UNRESOLVED',
      settled_at_utc: null,
      actual_home_score: null,
      actual_away_score: null,
      settlement_reason: null,
      units_net_profit: 0,
      soles_net_profit: 0
    };
    const wnbaEvent: SportEvent = {
      event_id: 'EVT_20260826_SUN_SKY',
      provider: 'espn',
      provider_event_id: '456',
      sport: 'basketball',
      league: 'WNBA',
      home_team: 'Connecticut Sun',
      away_team: 'Chicago Sky',
      start_time_utc: TimeService.nowUtc(),
      start_time_local: 'Hoy 18:00',
      status: 'FINISHED',
      home_score: 87,
      away_score: 81,
      period_detail: 'Final',
      last_updated_utc: TimeService.nowUtc(),
      data_age_seconds: 0
    };
    const c4Settlement = SettlementEngine.settle(wnbaSignal, wnbaEvent);
    results.push({
      caseId: 'CASO_4',
      title: 'Connecticut Sun -4.5 con 87-81 evalúa Spread -4.5 y da WON',
      passed: c4Settlement.result_status === 'WON' && c4Settlement.units_net > 0,
      expected: 'result_status = WON, units_net = +1.35u',
      actual: `result_status = ${c4Settlement.result_status}, units_net = ${c4Settlement.units_net}u (${c4Settlement.settlement_reason})`
    });

    // CASO 5: MLB Moneyline Angels 2 - 4 Guardians -> LOST
    const mlbSignal: SignalEntity = {
      signal_id: 'SIG_20260826_005',
      environment: 'TEST',
      event_id: 'EVT_20260826_ANGELS_GUARDIANS',
      provider_event_id: '789',
      sport: 'baseball',
      league: 'MLB Grandes Ligas',
      home_team: 'Los Angeles Angels',
      away_team: 'Cleveland Guardians',
      event_start_utc: TimeService.nowUtc(),
      event_start_local: 'Hoy 20:00',
      market_type: 'MONEYLINE',
      selection: 'Angels Ganador (Moneyline)',
      line: null,
      odds: 1.85,
      fair_odds: 1.60,
      edge_percentage: 15.6,
      confidence: 68.0,
      risk_level: 'MEDIO',
      recommended_stake_units: 2.0,
      recommended_stake_soles: 100.0,
      analysis_summary: 'Análisis MLB',
      reasoning_bullet_points: ['Razón 1'],
      status: 'PENDING',
      created_at_utc: TimeService.nowUtc(),
      published_at_utc: null,
      telegram_message_id: null,
      result_status: 'UNRESOLVED',
      settled_at_utc: null,
      actual_home_score: null,
      actual_away_score: null,
      settlement_reason: null,
      units_net_profit: 0,
      soles_net_profit: 0
    };
    const mlbEvent: SportEvent = {
      event_id: 'EVT_20260826_ANGELS_GUARDIANS',
      provider: 'espn',
      provider_event_id: '789',
      sport: 'baseball',
      league: 'MLB Grandes Ligas',
      home_team: 'Los Angeles Angels',
      away_team: 'Cleveland Guardians',
      start_time_utc: TimeService.nowUtc(),
      start_time_local: 'Hoy 20:00',
      status: 'FINISHED',
      home_score: 2,
      away_score: 4,
      period_detail: 'Final',
      last_updated_utc: TimeService.nowUtc(),
      data_age_seconds: 0
    };
    const c5Settlement = SettlementEngine.settle(mlbSignal, mlbEvent);
    results.push({
      caseId: 'CASO_5',
      title: 'Angels 2 - 4 Guardians con Pick Angels evalúa LOST',
      passed: c5Settlement.result_status === 'LOST' && c5Settlement.units_net === -2.0,
      expected: 'result_status = LOST, units_net = -2.0u',
      actual: `result_status = ${c5Settlement.result_status}, units_net = ${c5Settlement.units_net}u`
    });

    // CASO 6: Duplication check
    const existingIds = new Set(['EVT_20260826_DUPLICATE_TEST']);
    const dupEvent: SportEvent = {
      ...yesterdayEvent,
      event_id: 'EVT_20260826_DUPLICATE_TEST',
      status: 'SCHEDULED',
      start_time_utc: new Date(Date.now() + 3600000).toISOString()
    };
    const c6Validation = EventValidator.validateForSignalGeneration(dupEvent, existingIds);
    results.push({
      caseId: 'CASO_6',
      title: 'Evento duplicado debe ser bloqueado',
      passed: !c6Validation.isValidForSignalCreation && c6Validation.status === 'DUPLICATED',
      expected: 'status = DUPLICATED, isValid = false',
      actual: `status = ${c6Validation.status}, isValid = ${c6Validation.isValidForSignalCreation}`
    });

    // CASO 7: Stale data check (> 15 min)
    const staleEvent: SportEvent = {
      ...dupEvent,
      event_id: 'EVT_20260826_STALE_TEST',
      last_updated_utc: new Date(Date.now() - 1000000).toISOString() // ~16 min ago
    };
    const c7Validation = EventValidator.validateForSignalGeneration(staleEvent, new Set());
    results.push({
      caseId: 'CASO_7',
      title: 'Datos con más de 15 minutos deben ser bloqueados (STALE_DATA)',
      passed: !c7Validation.isValidForSignalCreation && c7Validation.status === 'STALE_EVENT',
      expected: 'status = STALE_EVENT, isValid = false',
      actual: `status = ${c7Validation.status}, isValid = ${c7Validation.isValidForSignalCreation}`
    });

    // CASO 8: Persistence recovery test
    const db = DatabaseRepository.getInstance();
    db.saveSignal(wnbaSignal);
    const recoveredSignal = db.getSignal('SIG_20260826_004');
    results.push({
      caseId: 'CASO_8',
      title: 'Persistencia y recuperación de señales pendientes tras reinicio',
      passed: recoveredSignal !== undefined && recoveredSignal.signal_id === 'SIG_20260826_004',
      expected: 'Recuperar señal SIG_20260826_004 intacta',
      actual: recoveredSignal ? `Señal ${recoveredSignal.signal_id} recuperada exitosamente` : 'No se pudo recuperar'
    });

    // CASO 9: Poisson Score Matrix Normalization (Sum = 1.0)
    const xg = PoissonEngine.calculateExpectedGoals('River Plate', 'Independiente Santa Fe', 'Copa Sudamericana');
    const matrix = PoissonEngine.generateScoreMatrix(xg.lambdaHome, xg.lambdaAway);
    let matrixSum = 0;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        matrixSum += matrix[r][c];
      }
    }
    const isSumValid = Math.abs(matrixSum - 1.0) < 0.001;
    results.push({
      caseId: 'CASO_9',
      title: 'Poisson Score Matrix debe sumar exactamente 1.0 (Normalización Bivariada)',
      passed: isSumValid && xg.lambdaHome > 0 && xg.lambdaAway > 0,
      expected: 'Suma de probabilidades de matriz = 1.000',
      actual: `Suma = ${matrixSum.toFixed(4)} (λ_home=${xg.lambdaHome}, λ_away=${xg.lambdaAway})`
    });

    // CASO 10: ProbabilityEngine 1X2 Conservation (P(1) + P(X) + P(2) = 1.0)
    const probs = ProbabilityEngine.calculateFromMatrix(matrix);
    const sum1X2 = probs.pHomeWin + probs.pDraw + probs.pAwayWin;
    const is1X2Valid = Math.abs(sum1X2 - 1.0) < 0.001;
    results.push({
      caseId: 'CASO_10',
      title: 'ProbabilityEngine: Ley de Probabilidad Total para 1X2',
      passed: is1X2Valid,
      expected: 'P(Home) + P(Draw) + P(Away) = 1.000',
      actual: `P(1)=${probs.pHomeWin} + P(X)=${probs.pDraw} + P(2)=${probs.pAwayWin} = ${sum1X2.toFixed(4)}`
    });

    // CASO 11: DataQualityValidator rejects events without real odds (NO_EMIT_SIGNAL)
    const unknownEvent: SportEvent = {
      ...dupEvent,
      home_team: 'Unknown Team A',
      away_team: 'Unknown Team B'
    };
    const dqReport = DataQualityValidator.validate(unknownEvent, []);
    results.push({
      caseId: 'CASO_11',
      title: 'DataQualityValidator debe bloquear eventos sin cuotas reales (NO_EMIT_SIGNAL)',
      passed: !dqReport.isValid && dqReport.score === 0,
      expected: 'isValid = false, score = 0',
      actual: `isValid = ${dqReport.isValid}, score = ${dqReport.score} (${dqReport.reason})`
    });

    // CASO 12: MarketEvaluator calculates exact Expected Value EV = (P * Odds) - 1
    const testOdds = [
      { bookmaker: 'Bet365', market_type: 'MONEYLINE' as const, selection: 'River Plate Ganador (1)', line: null, odds: 1.48, timestamp_utc: TimeService.nowUtc() }
    ];
    const evaluated = MarketEvaluator.evaluateAll('River Plate', 'Independiente Santa Fe', probs, testOdds);
    const candidate = evaluated[0];
    const calculatedEv = Number(((candidate.model_probability * candidate.odds) - 1).toFixed(4));
    const isEvExact = Math.abs(candidate.expected_value - calculatedEv) < 0.0001;
    results.push({
      caseId: 'CASO_12',
      title: 'MarketEvaluator: Cálculo exacto de Expected Value (+EV)',
      passed: isEvExact,
      expected: `EV = (${candidate.model_probability} * ${candidate.odds}) - 1 = ${calculatedEv}`,
      actual: `EV obtenido = ${candidate.expected_value} (Fair Odds = @${candidate.fair_odds})`
    });

    // CASO 13: Fractional Kelly Stake Sizing within hard limits [1.0u, 2.5u]
    const decision = SignalDecisionEngine.decide(evaluated, 'River Plate', 'Independiente Santa Fe', xg);
    const isKellyValid = decision.recommendedStakeUnits >= 0 && decision.recommendedStakeUnits <= SignalDecisionEngine.MAX_STAKE_UNITS;
    results.push({
      caseId: 'CASO_13',
      title: 'SignalDecisionEngine: Fractional Kelly Stake con techo máximo de 2.5u',
      passed: isKellyValid,
      expected: '0.0u <= stake_units <= 2.5u',
      actual: `Decision: ${decision.decision}, Stake: ${decision.recommendedStakeUnits}u (S/ ${decision.recommendedStakeSoles})`
    });

    // ── FASE 9 / FASE 10: SETTLEMENT GUARANTEES ──────────────────────────────

    // CASO 14 (REGRESION INCIDENTE 26/08): River Plate 1-1 I. Santa Fe MONEYLINE local -> LOST.
    const riverSignal: SignalEntity = {
      signal_id: 'SIG_TEST_RIVER_ML',
      environment: 'TEST',
      event_id: 'EVT_TEST_RIVER_SANTAFE',
      provider_event_id: 'RIV-STA',
      sport: 'football',
      league: 'Copa Sudamericana',
      home_team: 'River Plate',
      away_team: 'Independiente Santa Fe',
      event_start_utc: TimeService.nowUtc(),
      event_start_local: 'Hoy 19:30',
      market_type: 'MONEYLINE',
      selection: 'River Plate Ganador (1)',
      line: null,
      odds: 1.48,
      fair_odds: 1.44,
      edge_percentage: 2.8,
      confidence: 60.0,
      risk_level: 'BAJO',
      recommended_stake_units: 1.0,
      recommended_stake_soles: 50.0,
      analysis_summary: 'Test settlement',
      reasoning_bullet_points: [],
      status: 'PENDING',
      created_at_utc: TimeService.nowUtc(),
      published_at_utc: null,
      telegram_message_id: null,
      result_status: 'UNRESOLVED',
      settled_at_utc: null,
      actual_home_score: null,
      actual_away_score: null,
      settlement_reason: null,
      units_net_profit: 0,
      soles_net_profit: 0
    };
    const riverEvent: SportEvent = {
      event_id: 'EVT_TEST_RIVER_SANTAFE',
      provider: 'espn',
      provider_event_id: 'RIV-STA',
      sport: 'football',
      league: 'Copa Sudamericana',
      home_team: 'River Plate',
      away_team: 'Independiente Santa Fe',
      start_time_utc: TimeService.nowUtc(),
      start_time_local: 'Hoy 19:30',
      status: 'FINISHED',
      home_score: 1,
      away_score: 1,
      period_detail: 'FT-Pens',
      last_updated_utc: TimeService.nowUtc(),
      data_age_seconds: 0
    };
    const c14 = SettlementEngine.settle(riverSignal, riverEvent);
    results.push({
      caseId: 'CASO_14',
      title: 'REG. River Plate 1-1 (MONEYLINE local) debe liquidar LOST, no quedar sin liquidar',
      passed: c14.result_status === 'LOST' && c14.units_net === -1.0,
      expected: 'result_status = LOST (empate 1-1 no cubre victoria local), units_net = -1.0u',
      actual: `result_status = ${c14.result_status}, units_net = ${c14.units_net}u (${c14.settlement_reason})`
    });

    // CASO 15: Doble chance 1X "River Plate o Empate (1X)" con empate 1-1 -> WON.
    const dcSignal: SignalEntity = { ...riverSignal, signal_id: 'SIG_TEST_RIVER_DC', market_type: 'DOUBLE_CHANCE', selection: 'River Plate o Empate (1X)' };
    const c15 = SettlementEngine.settle(dcSignal, riverEvent);
    results.push({
      caseId: 'CASO_15',
      title: 'Doble chance 1X con empate 1-1 debe liquidar WON (empate cubierto)',
      passed: c15.result_status === 'WON' && c15.units_net > 0,
      expected: 'result_status = WON (1X cubre empate), units_net > 0',
      actual: `result_status = ${c15.result_status}, units_net = ${c15.units_net}u (${c15.settlement_reason})`
    });

    // CASO 16: Partido NO FINISHED (SCHEDULED) -> UNRESOLVED, NUNCA LOST forzado.
    const schEvent: SportEvent = { ...riverEvent, status: 'SCHEDULED', home_score: null, away_score: null };
    const c16 = SettlementEngine.settle(riverSignal, schEvent);
    const c16Valid = c16.result_status === 'UNRESOLVED' && c16.units_net === 0;
    results.push({
      caseId: 'CASO_16',
      title: 'Partido no FINISHED debe quedar UNRESOLVED (PENDING), nunca LOST forzado',
      passed: c16Valid,
      expected: 'result_status = UNRESOLVED, units_net = 0 (no liquidar sin marcador final)',
      actual: `result_status = ${c16.result_status}, units_net = ${c16.units_net}u`
    });

    // CASO 17: FINISHED pero sin marcador oficial -> UNRESOLVED.
    const noScoreEvent: SportEvent = { ...riverEvent, home_score: null, away_score: null };
    const c17 = SettlementEngine.settle(riverSignal, noScoreEvent);
    const c17Valid = c17.result_status === 'UNRESOLVED' && c17.units_net === 0;
    results.push({
      caseId: 'CASO_17',
      title: 'FINISHED sin marcador oficial debe quedar UNRESOLVED, nunca LOST forzado',
      passed: c17Valid,
      expected: 'result_status = UNRESOLVED, units_net = 0 (marcador oficial ausente)',
      actual: `result_status = ${c17.result_status}, units_net = ${c17.units_net}u`
    });

    // CASO 18: settlement_attempts / last_settlement_error persisten y round-trip via saveSignal/getSignal.
    const retrySignal: SignalEntity = { ...riverSignal, signal_id: 'SIG_TEST_RETRY', settlement_attempts: 2, last_settlement_error: 'EVENT_NOT_FOUND', last_settlement_attempt: TimeService.nowUtc() };
    db.saveSignal(retrySignal);
    const recoveredRetry = db.getSignal('SIG_TEST_RETRY');
    const c18Valid = recoveredRetry !== undefined && recoveredRetry.settlement_attempts === 2 && recoveredRetry.last_settlement_error === 'EVENT_NOT_FOUND';
    results.push({
      caseId: 'CASO_18',
      title: 'Metadatos de reintento (settlement_attempts) persisten y se recuperan',
      passed: c18Valid,
      expected: 'settlement_attempts = 2, last_settlement_error = EVENT_NOT_FOUND',
      actual: recoveredRetry ? `settlement_attempts = ${recoveredRetry.settlement_attempts}, last_settlement_error = ${recoveredRetry.last_settlement_error}` : 'No recuperada'
    });

    // CASO 19: syncFromPostgres es resiliente cuando Postgres NO está conectado (no lanza).
    let syncResilient = false;
    let syncCountResult: number | null = null;
    try {
      syncCountResult = await db.syncFromPostgres('PRODUCTION');
      syncResilient = typeof syncCountResult === 'number';
    } catch {
      syncResilient = false;
    }
    results.push({
      caseId: 'CASO_19',
      title: 'syncFromPostgres no lanza error ni rompe el tick cuando Postgres está desconectado',
      passed: syncResilient,
      expected: 'Devuelve un número (0+), no arroja excepción',
      actual: `syncResult = ${syncCountResult}`
    });

    // CASO 20: Señal ya liquidada (WON) NO vuelve a getPendingSignals -> no re-liquida tras reinicio.
    const settledSignal: SignalEntity = { ...riverSignal, signal_id: 'SIG_TEST_ALREADY_SETTLED', status: 'WON', result_status: 'WON' };
    db.saveSignal(settledSignal);
    const pendingIds = new Set(db.getPendingSignals('TEST').map(s => s.signal_id));
    const c20Valid = !pendingIds.has('SIG_TEST_ALREADY_SETTLED');
    results.push({
      caseId: 'CASO_20',
      title: 'Señal ya liquidada (WON) queda excluida de getPendingSignals (no se re-liquida)',
      passed: c20Valid,
      expected: 'SIG_TEST_ALREADY_SETTLED NO está en getPendingSignals',
      actual: c20Valid ? 'Excluida correctamente de señales pendientes' : 'Aún presente en pendientes'
    });

    return results;
  }
}
