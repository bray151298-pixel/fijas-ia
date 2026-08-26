/**
 * EventValidator.ts
 * Strictly validates sports events before processing:
 * - Freshness check
 * - Date/Timezone check
 * - Duplication check
 * - Lifecycle state validation
 */

import { SportEvent } from './EventNormalizer';
import { TimeService } from './TimeService';

export type EventValidationStatus = 
  | 'VALID'
  | 'STALE_EVENT'
  | 'FINISHED'
  | 'STARTED'
  | 'CANCELLED'
  | 'POSTPONED'
  | 'INVALID_TIMEZONE'
  | 'DUPLICATED';

export interface EventValidationResult {
  status: EventValidationStatus;
  isValidForSignalCreation: boolean;
  reason: string;
}

export class EventValidator {
  public static readonly MAX_DATA_AGE_SECONDS = 900; // 15 minutes max freshness

  public static validateForSignalGeneration(event: SportEvent, existingSignalIds: Set<string>): EventValidationResult {
    // 1. Check data freshness
    const ageSeconds = TimeService.getAgeSeconds(event.last_updated_utc);
    if (ageSeconds > this.MAX_DATA_AGE_SECONDS) {
      return {
        status: 'STALE_EVENT',
        isValidForSignalCreation: false,
        reason: `Datos desactualizados: antigüedad ${ageSeconds}s supera límite de ${this.MAX_DATA_AGE_SECONDS}s`
      };
    }

    // 2. Check if already finished or cancelled
    if (event.status === 'FINISHED') {
      return {
        status: 'FINISHED',
        isValidForSignalCreation: false,
        reason: `El evento ya ha finalizado (${event.home_score ?? 0} - ${event.away_score ?? 0})`
      };
    }

    if (event.status === 'CANCELLED' || event.status === 'POSTPONED') {
      return {
        status: event.status,
        isValidForSignalCreation: false,
        reason: `El evento se encuentra ${event.status}`
      };
    }

    // 3. Check if kickoff is in the past (already started)
    if (!TimeService.isFuture(event.start_time_utc, 0)) {
      return {
        status: 'STARTED',
        isValidForSignalCreation: false,
        reason: `El evento ya inició a las ${event.start_time_local}`
      };
    }

    // 4. Check for duplicate signal
    if (existingSignalIds.has(event.event_id)) {
      return {
        status: 'DUPLICATED',
        isValidForSignalCreation: false,
        reason: `Ya existe una señal registrada para el evento ${event.event_id}`
      };
    }

    return {
      status: 'VALID',
      isValidForSignalCreation: true,
      reason: 'Evento válido y disponible para generación de pronóstico'
    };
  }
}
