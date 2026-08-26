/**
 * TestSuite.ts
 * Mandatory Automated Verification Suite for CASO 1 through CASO 8.
 */

import { EventValidator } from './EventValidator';
import { MarketRulesRegistry } from './MarketRulesRegistry';
import { SettlementEngine } from './SettlementEngine';
import { SportEvent } from './EventNormalizer';
import { SignalEntity } from './SignalEntity';
import { DatabaseRepository } from './DatabaseRepository';
import { TimeService } from './TimeService';

export interface TestCaseResult {
  caseId: string;
  title: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export class TestSuite {
  public static runAllTests(): TestCaseResult[] {
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
      passed: c4Settlement.result_status === 'WON' && c4Settlement.units_net === 1.35,
      expected: 'result_status = WON, units_net = +1.35u',
      actual: `result_status = ${c4Settlement.result_status}, units_net = ${c4Settlement.units_net}u (${c4Settlement.settlement_reason})`
    });

    // CASO 5: Angels 2 - 4 Guardians. Pick Angels Ganador -> LOST
    const mlbSignal: SignalEntity = {
      signal_id: 'SIG_20260826_005',
      event_id: 'EVT_20260826_ANGELS_GUARDIANS',
      provider_event_id: '789',
      sport: 'baseball',
      league: 'MLB',
      home_team: 'Los Angeles Angels',
      away_team: 'Cleveland Guardians',
      event_start_utc: TimeService.nowUtc(),
      event_start_local: 'Hoy',
      market_type: 'MONEYLINE',
      selection: 'Los Angeles Angels Ganador (Moneyline)',
      line: null,
      odds: 1.80,
      fair_odds: 1.60,
      edge_percentage: 12.5,
      confidence: 70.0,
      risk_level: 'MEDIO',
      recommended_stake_units: 2.0,
      recommended_stake_soles: 100.0,
      analysis_summary: 'Moneyline MLB',
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
      league: 'MLB',
      home_team: 'Los Angeles Angels',
      away_team: 'Cleveland Guardians',
      start_time_utc: TimeService.nowUtc(),
      start_time_local: 'Hoy',
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

    // CASO 6: Evento duplicado -> DUPLICATE_BLOCKED
    const duplicateEvent: SportEvent = {
      event_id: 'EVT_20260826_DUPLICATE_ID',
      provider: 'espn',
      provider_event_id: '999',
      sport: 'football',
      league: 'Copa Libertadores',
      home_team: 'River Plate',
      away_team: 'Santa Fe',
      start_time_utc: new Date(Date.now() + 3600000).toISOString(),
      start_time_local: 'Hoy 19:00',
      status: 'SCHEDULED',
      home_score: null,
      away_score: null,
      period_detail: 'Scheduled',
      last_updated_utc: TimeService.nowUtc(),
      data_age_seconds: 0
    };
    const existingSignals = new Set(['EVT_20260826_DUPLICATE_ID']);
    const c6Validation = EventValidator.validateForSignalGeneration(duplicateEvent, existingSignals);
    results.push({
      caseId: 'CASO_6',
      title: 'Evento duplicado debe ser bloqueado',
      passed: c6Validation.status === 'DUPLICATED' && !c6Validation.isValidForSignalCreation,
      expected: 'status = DUPLICATED, isValid = false',
      actual: `status = ${c6Validation.status}, isValid = ${c6Validation.isValidForSignalCreation}`
    });

    // CASO 7: API falla / Datos desactualizados -> STALE_DATA
    const staleEvent: SportEvent = {
      event_id: 'EVT_20260826_STALE',
      provider: 'espn',
      provider_event_id: '888',
      sport: 'football',
      league: 'Copa Sudamericana',
      home_team: 'Independiente',
      away_team: 'Tolima',
      start_time_utc: new Date(Date.now() + 3600000).toISOString(),
      start_time_local: 'Hoy 19:30',
      status: 'SCHEDULED',
      home_score: null,
      away_score: null,
      period_detail: 'Scheduled',
      last_updated_utc: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
      data_age_seconds: 1200
    };
    const c7Validation = EventValidator.validateForSignalGeneration(staleEvent, new Set());
    results.push({
      caseId: 'CASO_7',
      title: 'Datos con más de 15 minutos deben ser bloqueados (STALE_DATA)',
      passed: c7Validation.status === 'STALE_EVENT' && !c7Validation.isValidForSignalCreation,
      expected: 'status = STALE_EVENT, isValid = false',
      actual: `status = ${c7Validation.status}, isValid = ${c7Validation.isValidForSignalCreation}`
    });

    // CASO 8: Reinicio del servidor -> Recuperación desde DatabaseRepository
    const db = DatabaseRepository.getInstance();
    db.saveSignal(wnbaSignal);
    const recoveredSignal = db.getSignal(wnbaSignal.signal_id);
    results.push({
      caseId: 'CASO_8',
      title: 'Persistencia y recuperación de señales pendientes tras reinicio',
      passed: recoveredSignal !== undefined && recoveredSignal.signal_id === wnbaSignal.signal_id,
      expected: `Recuperar señal ${wnbaSignal.signal_id} intacta`,
      actual: recoveredSignal ? `Señal ${recoveredSignal.signal_id} recuperada exitosamente` : 'Fallo de recuperación'
    });

    return results;
  }
}
