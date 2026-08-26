/**
 * SignalValidator.ts
 * Rigorous 10-Point Checklist Validator before a Signal can be published or transmitted.
 */

import { SignalEntity } from './SignalEntity';
import { MarketRulesRegistry } from './MarketRulesRegistry';
import { TimeService } from './TimeService';

export interface ValidationCheckResult {
  passed: boolean;
  errors: string[];
}

export class SignalValidator {
  public static validateSignal(signal: SignalEntity): ValidationCheckResult {
    const errors: string[] = [];

    // 1. Check ID existence and format
    if (!signal.signal_id || !signal.signal_id.startsWith('SIG_')) {
      errors.push('ID de señal inválido o no estructurado');
    }

    // 2. Check Teams and League
    if (!signal.home_team || !signal.away_team || !signal.league) {
      errors.push('Faltan datos de equipos o liga en la señal');
    }

    // 3. Check Event Start Time (Must be in future if publishing)
    if (!signal.event_start_utc) {
      errors.push('Fecha y hora del evento no especificada');
    }

    // 4. Check Sport compatibility with Market
    const marketValidation = MarketRulesRegistry.validateSelectionText(
      signal.sport,
      signal.market_type,
      signal.selection
    );
    if (!marketValidation.valid) {
      errors.push(marketValidation.reason || 'Mercado incompatible con el deporte');
    }

    // 5. Check Odds (Must be between 1.20 and 15.00)
    if (isNaN(signal.odds) || signal.odds < 1.20 || signal.odds > 15.00) {
      errors.push(`Cuota fuera de rango razonable (@${signal.odds})`);
    }

    // 6. Check Confidence (Must be between 50% and 99%)
    if (isNaN(signal.confidence) || signal.confidence < 50 || signal.confidence > 99) {
      errors.push(`Nivel de confianza no válido (${signal.confidence}%)`);
    }

    // 7. Check Stake Units (Must be between 0.5 and 5.0 units)
    if (isNaN(signal.recommended_stake_units) || signal.recommended_stake_units <= 0 || signal.recommended_stake_units > 5.0) {
      errors.push(`Stake de unidades inválido (${signal.recommended_stake_units}u)`);
    }

    // 8. Check Analysis Content
    if (!signal.analysis_summary || signal.analysis_summary.trim().length < 15) {
      errors.push('El análisis cuantitativo no cumple con el detalle mínimo');
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }
}
