/**
 * MarketRulesRegistry.ts
 * Enforces valid sports markets per sport category.
 * Strictly prevents cross-sport incompatibilities (e.g. MLB + Over 1.5 Goals).
 */

export type SportCategory = 'football' | 'baseball' | 'basketball' | 'tennis' | 'mma';

export type MarketType = 
  | 'MONEYLINE'
  | 'DOUBLE_CHANCE'
  | 'OVER_UNDER_GOALS'
  | 'OVER_UNDER_RUNS'
  | 'OVER_UNDER_POINTS'
  | 'OVER_UNDER_GAMES'
  | 'OVER_UNDER_ROUNDS'
  | 'ASIAN_HANDICAP'
  | 'RUN_LINE'
  | 'POINT_SPREAD'
  | 'SET_HANDICAP'
  | 'BTTS'
  | 'METHOD_OF_VICTORY';

export interface MarketRule {
  allowedMarkets: MarketType[];
  forbiddenTerms: string[];
  defaultMarket: MarketType;
}

export class MarketRulesRegistry {
  private static readonly RULES: Record<SportCategory, MarketRule> = {
    football: {
      allowedMarkets: ['MONEYLINE', 'DOUBLE_CHANCE', 'OVER_UNDER_GOALS', 'BTTS', 'ASIAN_HANDICAP'],
      forbiddenTerms: ['carreras', 'runs', 'puntos', 'innings', 'asaltos', 'sets'],
      defaultMarket: 'DOUBLE_CHANCE'
    },
    baseball: {
      allowedMarkets: ['MONEYLINE', 'RUN_LINE', 'OVER_UNDER_RUNS'],
      forbiddenTerms: ['goles', 'goals', '1x', '2x', '12', 'empate', 'btts', 'ambos anotan', 'asaltos'],
      defaultMarket: 'MONEYLINE'
    },
    basketball: {
      allowedMarkets: ['MONEYLINE', 'POINT_SPREAD', 'OVER_UNDER_POINTS'],
      forbiddenTerms: ['goles', 'goals', 'carreras', 'runs', '1x', '2x', 'empate', 'btts', 'asaltos'],
      defaultMarket: 'POINT_SPREAD'
    },
    tennis: {
      allowedMarkets: ['MONEYLINE', 'OVER_UNDER_GAMES', 'SET_HANDICAP'],
      forbiddenTerms: ['goles', 'goals', 'carreras', 'runs', '1x', '2x', 'empate', 'btts', 'asaltos'],
      defaultMarket: 'MONEYLINE'
    },
    mma: {
      allowedMarkets: ['MONEYLINE', 'OVER_UNDER_ROUNDS', 'METHOD_OF_VICTORY'],
      forbiddenTerms: ['goles', 'goals', 'carreras', 'runs', 'puntos', '1x', '2x', 'empate', 'btts'],
      defaultMarket: 'OVER_UNDER_ROUNDS'
    }
  };

  public static isMarketValidForSport(sport: SportCategory, market: MarketType): boolean {
    const rule = this.RULES[sport];
    if (!rule) return false;
    return rule.allowedMarkets.includes(market);
  }

  public static validateSelectionText(sport: SportCategory, market: MarketType, selectionText: string): { valid: boolean; reason?: string } {
    const rule = this.RULES[sport];
    if (!rule) {
      return { valid: false, reason: `Deporte no reconocido: ${sport}` };
    }

    if (!rule.allowedMarkets.includes(market)) {
      return { 
        valid: false, 
        reason: `Mercado ${market} incompatible con el deporte ${sport.toUpperCase()}` 
      };
    }

    const lowerSelection = selectionText.toLowerCase();
    for (const forbidden of rule.forbiddenTerms) {
      if (lowerSelection.includes(forbidden)) {
        return {
          valid: false,
          reason: `Selección "${selectionText}" contiene término incompatible "${forbidden}" para ${sport.toUpperCase()}`
        };
      }
    }

    return { valid: true };
  }

  public static getValidMarkets(sport: SportCategory): MarketType[] {
    return this.RULES[sport]?.allowedMarkets || [];
  }
}
