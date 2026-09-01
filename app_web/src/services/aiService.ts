import { Match, EngineConfig, TacticalAIReport } from '../types';

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  mode: 'gemini',
  geminiModel: 'gemini-3.7-flash',
  omnirouteUrl: 'http://localhost:20128/v1',
  omnirouteKey: '',
  omnirouteModel: 'auto/best-free',
  status: 'connected',
};

export async function testEngineConnection(config: EngineConfig) {
  try {
    const startTime = performance.now();
    const res = await fetch('/api/engine-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engineType: config.mode,
        omnirouteUrl: config.omnirouteUrl,
        omnirouteKey: config.omnirouteKey,
        omnirouteModel: config.omnirouteModel
      })
    });
    const endTime = performance.now();
    const data = await res.json();
    return {
      ...data,
      measuredLatencyMs: Math.round(endTime - startTime)
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error de red con el servidor',
      measuredLatencyMs: 0
    };
  }
}

export async function requestMatchAnalysis(
  match: Match,
  engineConfig: EngineConfig,
  customQuery?: string
): Promise<{ analysis: TacticalAIReport; source: string }> {
  try {
    const res = await fetch('/api/analyze-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match,
        engineConfig,
        customQuery
      })
    });

    if (!res.ok) {
      throw new Error(`Error en servidor: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      analysis: data.analysis,
      source: data.source || (engineConfig.mode === 'gemini' ? 'Motor Neural de Inteligencia Deportiva' : 'Gateway Cuantitativo Privado FIJAS IA')
    };
  } catch (error: any) {
    console.warn('API error, analysis unavailable:', error);

    // PRE-F00 FAIL CLOSED: sin síntesis cuantitativa inventada. El análisis
    // cuantitativo verificable sólo se emite desde el pipeline certificado (F00).
    const fallbackReport: TacticalAIReport = {
      tacticalOverview: `Análisis cuantitativo no disponible para ${match.homeTeam} vs ${match.awayTeam}: no existen cuotas ni métricas verificadas en esta etapa PRE-F00 (FAIL CLOSED). La publicación de pronósticos se habilitará con el Motor Cuantitativo certificado en F00.`,
      keyFactors: [
        `Estado del pipeline: SIN ANÁLISIS CUANTITATIVO VERIFICADO.`,
        `Datos reales disponibles: programación confirmada (${match.homeTeam} vs ${match.awayTeam}, ${match.time}).`,
        `Cuotas, probabilidades y edge: pendientes de provider certificado (F00).`
      ],
      absencesImpact: 'Información de bajas no verificada en esta etapa.',
      bestValuePick: {
        market: 'SIN PRONÓSTICO',
        selection: 'FAIL CLOSED: no se emiten señales sin datos verificados',
        marketOdds: 1,
        fairOdds: 1,
        edgePercent: 0,
        modelProbability: 0,
        recommendedStake: '+0.0u',
        verdict: 'No se detecta ningún valor comprobable en esta etapa PRE-F00.'
      },
      riskRating: 'Alto',
      confidenceScore: 0
    };

    return {
      analysis: fallbackReport,
      source: 'Pipeline PRE-F00 (FAIL CLOSED — sin datos verificados)'
    };
  }
}
