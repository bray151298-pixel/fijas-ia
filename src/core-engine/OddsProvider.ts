/**
 * OddsProvider.ts
 * Multi-source, pluggable odds feed interface and aggregators.
 * Guarantees that odds are traceable to real bookmaker quotations with timestamps.
 */

import { MarketType } from './MarketRulesRegistry';
import { SportEvent } from './EventNormalizer';

export interface MarketOdds {
  bookmaker: string;
  market_type: MarketType;
  selection: string;
  line: number | null;
  odds: number;
  timestamp_utc: string;
}

export interface IOddsProvider {
  getOddsForEvent(event: SportEvent): Promise<MarketOdds[]>;
}

export class OddsProvider implements IOddsProvider {
  private static instance: OddsProvider;

  // FAIL CLOSED: no hay catálogo de cuotas hardcodeadas/inventadas.
  // Las cuotas solo provienen de un feed real de bookmakers (F00). Mientras no
  // exista provider certificado, getOddsForEvent devuelve [] -> NO_EMIT_SIGNAL.
  private bookmakerOddsMap: Record<string, MarketOdds[]> = {};

  private constructor() {}

  public static getInstance(): OddsProvider {
    if (!OddsProvider.instance) {
      OddsProvider.instance = new OddsProvider();
    }
    return OddsProvider.instance;
  }

  public async getOddsForEvent(event: SportEvent): Promise<MarketOdds[]> {
    const key = `${event.home_team} vs ${event.away_team}`;
    const foundKey = Object.keys(this.bookmakerOddsMap).find(k =>
      k.toLowerCase() === key.toLowerCase() ||
      (k.includes(event.home_team) && k.includes(event.away_team))
    );

    if (foundKey) {
      return this.bookmakerOddsMap[foundKey];
    }

    return []; // Returns empty array if no verified market odds exist (Triggers NO_EMIT_SIGNAL)
  }
}
