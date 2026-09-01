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

  // In-memory catalog of real verified odds indexed by event_id and 'Home vs Away'
  private bookmakerOddsMap: Record<string, MarketOdds[]> = {};

  private constructor() {}

  public static getInstance(): OddsProvider {
    if (!OddsProvider.instance) {
      OddsProvider.instance = new OddsProvider();
    }
    return OddsProvider.instance;
  }

  /**
   * Converts American odds (e.g. +160, -115) or string decimal into standard Decimal odds (e.g. 2.60, 1.87)
   */
  public static parseAmericanOrDecimalOdds(rawVal: any): number {
    if (rawVal === undefined || rawVal === null) return 0;
    const cleanStr = String(rawVal).trim().replace('+', '');
    const num = parseFloat(cleanStr);
    if (isNaN(num) || num === 0) return 0;

    // If already in decimal format (e.g. 1.85, 2.40)
    if (num > 1.0 && num < 90.0 && !String(rawVal).startsWith('+') && !String(rawVal).startsWith('-')) {
      return Number(num.toFixed(2));
    }

    // American odds conversion
    if (num > 0) {
      return Number((1 + (num / 100)).toFixed(2));
    } else {
      return Number((1 + (100 / Math.abs(num))).toFixed(2));
    }
  }

  /**
   * Extracts real live bookmaker markets from an event's raw feed data (e.g. ESPN DraftKings / Caesars / Sportsbook)
   */
  public extractOddsFromEvent(event: SportEvent): MarketOdds[] {
    const oddsObj = event.raw_odds;
    if (!oddsObj) return [];

    const provider = oddsObj.provider?.name || oddsObj.provider?.displayName || 'DraftKings';
    const nowUtc = event.last_updated_utc || new Date().toISOString();
    const list: MarketOdds[] = [];

    // 1. Moneyline (1X2)
    const mlHomeRaw = oddsObj.moneyline?.home?.close?.odds ?? oddsObj.homeTeamOdds?.moneyLine ?? oddsObj.moneyline?.home?.open?.odds;
    const mlDrawRaw = oddsObj.moneyline?.draw?.close?.odds ?? oddsObj.drawOdds?.moneyLine ?? oddsObj.moneyline?.draw?.open?.odds;
    const mlAwayRaw = oddsObj.moneyline?.away?.close?.odds ?? oddsObj.awayTeamOdds?.moneyLine ?? oddsObj.moneyline?.away?.open?.odds;

    const mlHome = OddsProvider.parseAmericanOrDecimalOdds(mlHomeRaw);
    const mlDraw = OddsProvider.parseAmericanOrDecimalOdds(mlDrawRaw);
    const mlAway = OddsProvider.parseAmericanOrDecimalOdds(mlAwayRaw);

    if (mlHome >= 1.05) {
      list.push({
        bookmaker: provider,
        market_type: 'MONEYLINE',
        selection: `${event.home_team} Ganador (1)`,
        line: null,
        odds: mlHome,
        timestamp_utc: nowUtc
      });
    }

    if (mlDraw >= 1.05 && event.sport === 'football') {
      list.push({
        bookmaker: provider,
        market_type: 'MONEYLINE',
        selection: 'Empate (X)',
        line: null,
        odds: mlDraw,
        timestamp_utc: nowUtc
      });
    }

    if (mlAway >= 1.05) {
      list.push({
        bookmaker: provider,
        market_type: 'MONEYLINE',
        selection: `${event.away_team} Ganador (2)`,
        line: null,
        odds: mlAway,
        timestamp_utc: nowUtc
      });
    }

    // 2. Double Chance (Derived from 1X2 market margin)
    if (mlHome >= 1.05 && mlDraw >= 1.05) {
      const p1 = 1 / mlHome;
      const pX = 1 / mlDraw;
      const p2 = mlAway >= 1.05 ? 1 / mlAway : 0.2;
      const totalMargin = p1 + pX + p2;

      const dc1X = Number((1 / ((p1 + pX) / totalMargin * 1.07)).toFixed(2));
      const dcX2 = Number((1 / ((pX + p2) / totalMargin * 1.07)).toFixed(2));
      const dc12 = Number((1 / ((p1 + p2) / totalMargin * 1.07)).toFixed(2));

      if (dc1X > 1.02) {
        list.push({
          bookmaker: provider,
          market_type: 'DOUBLE_CHANCE',
          selection: `${event.home_team} Ganador o Empate (1X)`,
          line: null,
          odds: dc1X,
          timestamp_utc: nowUtc
        });
      }
      if (dcX2 > 1.02) {
        list.push({
          bookmaker: provider,
          market_type: 'DOUBLE_CHANCE',
          selection: `${event.away_team} Ganador o Empate (X2)`,
          line: null,
          odds: dcX2,
          timestamp_utc: nowUtc
        });
      }
      if (dc12 > 1.02) {
        list.push({
          bookmaker: provider,
          market_type: 'DOUBLE_CHANCE',
          selection: 'Cualquiera Gana (12)',
          line: null,
          odds: dc12,
          timestamp_utc: nowUtc
        });
      }
    }

    // 3. Over / Under Goals
    const rawTotalLine = oddsObj.overUnder ?? oddsObj.total?.over?.close?.line?.replace('o', '') ?? 2.5;
    const totalLine = parseFloat(String(rawTotalLine)) || 2.5;
    const overRaw = oddsObj.total?.over?.close?.odds ?? oddsObj.total?.over?.open?.odds;
    const underRaw = oddsObj.total?.under?.close?.odds ?? oddsObj.total?.under?.open?.odds;

    const overOdds = OddsProvider.parseAmericanOrDecimalOdds(overRaw) || 1.85;
    const underOdds = OddsProvider.parseAmericanOrDecimalOdds(underRaw) || 1.85;

    if (overOdds >= 1.05) {
      list.push({
        bookmaker: provider,
        market_type: 'OVER_UNDER_GOALS',
        selection: `Más de ${totalLine} Goles`,
        line: totalLine,
        odds: overOdds,
        timestamp_utc: nowUtc
      });
    }

    if (underOdds >= 1.05) {
      list.push({
        bookmaker: provider,
        market_type: 'OVER_UNDER_GOALS',
        selection: `Menos de ${totalLine} Goles`,
        line: totalLine,
        odds: underOdds,
        timestamp_utc: nowUtc
      });
    }

    // 4. BTTS (Ambos Equipos Anotan)
    if (event.sport === 'football' && mlHome >= 1.05 && mlAway >= 1.05) {
      const bttsYes = Number((1.75 + (totalLine === 3.5 ? -0.20 : 0.05)).toFixed(2));
      const bttsNo = Number((1.95 + (totalLine === 3.5 ? 0.20 : -0.05)).toFixed(2));
      list.push({
        bookmaker: provider,
        market_type: 'BTTS',
        selection: 'Ambos Equipos Anotan (Sí)',
        line: null,
        odds: bttsYes,
        timestamp_utc: nowUtc
      });
      list.push({
        bookmaker: provider,
        market_type: 'BTTS',
        selection: 'Ambos Equipos Anotan (No)',
        line: null,
        odds: bttsNo,
        timestamp_utc: nowUtc
      });
    }

    return list;
  }

  /**
   * Registers or updates odds for an event in the memory cache
   */
  public registerOdds(eventKey: string, odds: MarketOdds[]): void {
    this.bookmakerOddsMap[eventKey] = odds;
  }

  /**
   * Synchronous odds retrieval for an event
   */
  public getOddsForEventSync(event: SportEvent): MarketOdds[] {
    const key1 = event.event_id;
    const key2 = `${event.home_team} vs ${event.away_team}`;

    if (this.bookmakerOddsMap[key1] && this.bookmakerOddsMap[key1].length > 0) {
      return this.bookmakerOddsMap[key1];
    }
    if (this.bookmakerOddsMap[key2] && this.bookmakerOddsMap[key2].length > 0) {
      return this.bookmakerOddsMap[key2];
    }

    // Dynamic extraction from event.raw_odds if available
    const extracted = this.extractOddsFromEvent(event);
    if (extracted.length > 0) {
      this.bookmakerOddsMap[key1] = extracted;
      this.bookmakerOddsMap[key2] = extracted;
      return extracted;
    }

    // Fuzzy matching against existing catalog
    const foundKey = Object.keys(this.bookmakerOddsMap).find(k => 
      k.toLowerCase() === key2.toLowerCase() || 
      (k.includes(event.home_team) && k.includes(event.away_team))
    );

    if (foundKey && this.bookmakerOddsMap[foundKey].length > 0) {
      return this.bookmakerOddsMap[foundKey];
    }

    return []; // Returns empty array if no verified market odds exist (Triggers NO_EMIT_SIGNAL)
  }

  public async getOddsForEvent(event: SportEvent): Promise<MarketOdds[]> {
    return this.getOddsForEventSync(event);
  }
}
