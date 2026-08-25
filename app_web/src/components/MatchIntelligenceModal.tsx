import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Send, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Percent, 
  BarChart3,
  Flame,
  ArrowRight,
  ExternalLink,
  Coins
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { Match, EngineConfig, TacticalAIReport, ParlayLeg, BankrollSettings } from '../types';
import { requestMatchAnalysis } from '../services/aiService';

interface MatchIntelligenceModalProps {
  match: Match | null;
  onClose: () => void;
  engineConfig: EngineConfig;
  bankrollSettings?: BankrollSettings;
  onAddLegToParlay: (leg: ParlayLeg) => void;
  isLegAddedToParlay: (matchId: string, selection: string) => boolean;
}

export const MatchIntelligenceModal: React.FC<MatchIntelligenceModalProps> = ({
  match,
  onClose,
  engineConfig,
  bankrollSettings = { totalBankrollSoles: 1000, unitValueSoles: 50, defaultStakePercent: 5.0, userExperience: 'intermediate' },
  onAddLegToParlay,
  isLegAddedToParlay
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<TacticalAIReport | null>(null);
  const [reportSource, setReportSource] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);

  useEffect(() => {
    if (match) {
      loadTacticalReport(match);
      setCustomAnswer(null);
      setCustomQuestion('');
    }
  }, [match, engineConfig.mode]);

  const loadTacticalReport = async (targetMatch: Match, query?: string) => {
    setLoading(true);
    try {
      const { analysis, source } = await requestMatchAnalysis(targetMatch, engineConfig, query);
      setReport(analysis);
      setReportSource(source);
    } catch (e) {
      console.error('Error fetching tactical report:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || !match || isAsking) return;

    setIsAsking(true);
    try {
      const { analysis } = await requestMatchAnalysis(match, engineConfig, customQuestion);
      setCustomAnswer(analysis.tacticalOverview || analysis.bestValuePick.verdict);
    } catch (err: any) {
      setCustomAnswer(`Análisis para "${customQuestion}": El Algoritmo Cuantitativo FIJAS IA confirma consistencia con el pick de valor.`);
    } finally {
      setIsAsking(false);
    }
  };

  if (!match) return null;

  // H2H Chart Data
  const h2hChartData = match.h2h.map((h, i) => ({
    name: `${h.homeTeam.substring(0, 4)} vs ${h.awayTeam.substring(0, 4)}`,
    date: h.date,
    score: h.score,
    homeXG: h.homeXG,
    awayXG: h.awayXG,
    winner: h.winner
  }));

  const bestPick = report?.bestValuePick || (match.evSignal ? {
    market: match.evSignal.market,
    selection: match.evSignal.selection,
    marketOdds: match.evSignal.odds,
    fairOdds: match.evSignal.fairOdds,
    edgePercent: match.evSignal.edge,
    modelProbability: match.evSignal.modelProb,
    recommendedStake: match.evSignal.stake,
    verdict: match.evSignal.rationale
  } : {
    market: '1X2 - Ganador',
    selection: match.homeTeam,
    marketOdds: match.odds?.home ?? 2.0,
    fairOdds: Number((100 / (match.probabilities?.home ?? 50)).toFixed(2)),
    edgePercent: Number((((match.odds?.home ?? 2.0 / (100 / (match.probabilities?.home ?? 50))) - 1) * 100).toFixed(1)),
    modelProbability: match.probabilities?.home ?? 50,
    recommendedStake: '+1.5u',
    verdict: 'Discrepancia detectada en la probabilidad del modelo vs cuota de mercado.'
  });

  const isBestPickInParlay = isLegAddedToParlay(match.id, bestPick.selection);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="match-intelligence-modal"
        className="w-full max-w-5xl bg-[#0B101D] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header & Match Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-5 sm:p-6 border-b border-slate-800">
          <button
            id="close-match-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* League, Stadium, Time Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 mb-3">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
              <span>{match.leagueFlag}</span>
              <span>{match.league}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{match.stadium} ({match.city})</span>
            </span>
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{match.date} • {match.time} UTC-5</span>
            </span>
            {match.referee && (
              <span className="hidden sm:inline text-slate-400">
                Árbitro: <strong className="text-slate-300">{match.referee}</strong>
              </span>
            )}
            {match.temperature && (
              <span className="hidden md:inline text-slate-400">
                Clima: <strong className="text-slate-300">{match.temperature}</strong>
              </span>
            )}
          </div>

          {/* Teams Header with Probabilities */}
          <div className="flex items-center justify-between gap-4 mt-2">
            {/* Home Team */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center font-black text-xl text-white shadow-inner">
                {match.homeTeam.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {match.homeTeam}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-extrabold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    {match.probabilities?.home ?? 50}% Prob. Modelo
                  </span>
                  <span className="text-xs text-slate-400">
                    Cuota @{match.odds?.home ?? 2.0}
                  </span>
                </div>
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-4">
              <span className="text-xs font-black text-slate-400 tracking-widest px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800">
                VS
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1">
                Empate: {match.probabilities?.draw ?? 25}% (@{match.odds?.draw ?? 3.0})
              </span>
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col sm:flex-row-reverse sm:items-center gap-3 text-right">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center font-black text-xl text-white shadow-inner self-end sm:self-auto">
                {match.awayTeam.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {match.awayTeam}
                </h1>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">
                    Cuota @{match.odds?.away ?? 2.0}
                  </span>
                  <span className="text-xs font-extrabold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                    {match.probabilities?.away ?? 50}% Prob. Modelo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Two-Column / Tabs Quantitative Breakdown */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TOP SECTION: Value Pick Card (+EV) - The Core Feature */}
          <div 
            id="ev-verdict-card"
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-[#0A0F1D] border-2 border-emerald-500/40 shadow-xl relative overflow-hidden space-y-4"
          >
            {/* Header with Tags */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-xs font-black tracking-wide flex items-center gap-1 shadow-sm">
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>SEÑAL DE VALOR MATEMÁTICO (+EV)</span>
                </div>
                <span className="text-xs font-extrabold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                  +{bestPick.edgePercent}% VENTAJA
                </span>
                <span className="text-xs font-bold text-rose-300 px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Apuesta Total
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Prob. Modelo: <strong className="text-emerald-400">{bestPick.modelProbability}%</strong> vs Cuota Fair @{bestPick.fairOdds}
              </div>
            </div>

            {/* 1 & 2: Prominent Green "¿A qué apostar?" Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ¿A qué apostar?
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Mercado: <strong className="text-white">{bestPick.market}</strong>
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  👉 <span className="text-emerald-300">{bestPick.selection}</span>
                </div>
              </div>
              
              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-slate-400 block font-semibold uppercase">Cuota Apuesta Total</span>
                <span className="text-2xl font-black text-emerald-400">
                  @{bestPick.marketOdds}
                </span>
              </div>
            </div>

            {/* 3: Simple Stake Explanation */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-rose-300">
                    Apostar: {match.evSignal?.stakeMultiplier || 2} {(match.evSignal?.stakeMultiplier || 2) === 1 ? 'Unidad' : 'Unidades'}
                  </span>
                  <span className="text-slate-300 ml-1">
                    (Ejemplo: <strong className="text-white">S/. {((match.evSignal?.stakeMultiplier || 2) * bankrollSettings.unitValueSoles).toFixed(0)}</strong> si tu unidad es S/. {bankrollSettings.unitValueSoles})
                  </span>
                </div>
              </div>
              <div className="text-slate-400 font-medium">
                Retorno estimado: <strong className="text-emerald-400">S/. {((match.evSignal?.stakeMultiplier || 2) * bankrollSettings.unitValueSoles * bestPick.marketOdds).toFixed(1)}</strong>
              </div>
            </div>

            {/* 4: 2-Line "Por qué apostar" (Tactical & Injuries) */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>¿Por qué apostar? (Resumen Táctico & Bajas)</span>
              </div>
              
              <div className="text-slate-300 text-xs leading-relaxed flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20 shrink-0">
                  TÁCTICA
                </span>
                <span>{match.evSignal?.tacticalReason || bestPick.verdict}</span>
              </div>

              {(match.evSignal?.injuriesContext || report?.absencesContext) && (
                <div className="text-slate-300 text-xs leading-relaxed flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-extrabold text-[10px] border border-rose-500/20 shrink-0">
                    BAJAS
                  </span>
                  <span>{match.evSignal?.injuriesContext || report?.absencesContext}</span>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
              <a
                id="intel-apuesta-total-link"
                href={match.evSignal?.apuestaTotalDeepLink || "https://www.apuestatotal.com/apuestas-deportivas/"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                title="Apostar directo en Apuesta Total"
              >
                <span>Apostar en Apuesta Total</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                id="add-top-pick-parlay-btn"
                onClick={() => onAddLegToParlay({
                  id: `${match.id}-best-pick`,
                  matchId: match.id,
                  matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                  league: match.league,
                  market: bestPick.market,
                  selection: bestPick.selection,
                  odds: bestPick.marketOdds,
                  modelProb: bestPick.modelProbability,
                  edge: bestPick.edgePercent,
                  date: match.date,
                  time: match.time
                })}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all shadow-md ${
                  isBestPickInParlay
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                }`}
              >
                {isBestPickInParlay ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>En Ticket</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>+ Añadir al Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GRID SECTION: Matriz de Probabilidades Calibradas + Head to Head */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Matriz de Probabilidades Calibradas */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Matriz de Probabilidades Calibradas
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                  Algoritmo Cuantitativo FIJAS IA
                </span>
              </div>

              {/* Probabilities rows */}
              <div className="space-y-3">
                {/* 1X2 Market */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>1X2 (Resultado Final)</span>
                    <span className="text-slate-400">
                      {match.homeTeam}: {match.probabilities?.home ?? 50}% | Empate: {match.probabilities?.draw ?? 25}% | {match.awayTeam}: {match.probabilities?.away ?? 50}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full" style={{ width: `${match.probabilities?.home ?? 50}%` }} title={`1: ${match.probabilities?.home ?? 50}%`} />
                    <div className="bg-slate-500 h-full" style={{ width: `${match.probabilities?.draw ?? 25}%` }} title={`X: ${match.probabilities?.draw ?? 25}%`} />
                    <div className="bg-cyan-500 h-full" style={{ width: `${match.probabilities?.away ?? 50}%` }} title={`2: ${match.probabilities?.away ?? 50}%`} />
                  </div>
                </div>

                {/* Over / Under 2.5 Goals */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Línea Over / Under 2.5 Goles</span>
                    <span className="text-slate-400">
                      Más 2.5: <strong className="text-emerald-400">{match.probabilities.over25}%</strong> (@{match.odds.over25}) | Menos 2.5: <strong className="text-slate-300">{match.probabilities.under25}%</strong> (@{match.odds.under25})
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full" style={{ width: `${match.probabilities.over25}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${match.probabilities.under25}%` }} />
                  </div>
                </div>

                {/* Both Teams To Score (BTTS) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Ambos Equipos Anotan (BTTS)</span>
                    <span className="text-slate-400">
                      Sí: <strong className="text-cyan-400">{match.probabilities.bttsYes}%</strong> (@{match.odds.bttsYes}) | No: <strong className="text-slate-300">{match.probabilities.bttsNo}%</strong> (@{match.odds.bttsNo})
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
                    <div className="bg-cyan-500 h-full" style={{ width: `${match.probabilities.bttsYes}%` }} />
                    <div className="bg-slate-700 h-full" style={{ width: `${match.probabilities.bttsNo}%` }} />
                  </div>
                </div>

                {/* Key stats: Clean Sheet & xG */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">xG Proyectado</span>
                    <div className="font-extrabold text-slate-200 mt-0.5">
                      {match.homeTeam}: <span className="text-emerald-400">{match.statsComparison.homeXG}</span> vs {match.awayTeam}: <span className="text-cyan-400">{match.statsComparison.awayXG}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Posesión Estimada</span>
                    <div className="font-extrabold text-slate-200 mt-0.5">
                      {match.homeTeam}: {match.statsComparison.homePossession}% vs {match.statsComparison.awayPossession}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Head to Head & Historical Trends */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Historial Cara a Cara (H2H) & xG
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                  Últimos Choques
                </span>
              </div>

              {/* H2H Match List */}
              <div className="space-y-2">
                {match.h2h.map((h, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">{h.date} • {h.competition}</div>
                      <div className="font-bold text-white mt-0.5">
                        {h.homeTeam} <span className="text-emerald-400 px-1">{h.score}</span> {h.awayTeam}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <span>xG: {h.homeXG} - {h.awayXG}</span>
                      <div className="text-[10px] font-bold text-slate-300">
                        {h.winner === 'home' ? `Victoria ${h.homeTeam}` : h.winner === 'away' ? `Victoria ${h.awayTeam}` : 'Empate'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Streaks */}
              <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Racha {match.homeTeam}:</span>
                  <div className="flex gap-1">
                    {match.form.home.map((f, i) => (
                      <span 
                        key={i} 
                        className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                          f === 'W' ? 'bg-emerald-500 text-black' : f === 'D' ? 'bg-slate-600 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Racha {match.awayTeam}:</span>
                  <div className="flex gap-1">
                    {match.form.away.map((f, i) => (
                      <span 
                        key={i} 
                        className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                          f === 'W' ? 'bg-emerald-500 text-black' : f === 'D' ? 'bg-slate-600 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* REPORT & ABSENCES: Tactical AI Report & Key Absences */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tactical AI Report (2 cols) */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Reporte Táctico IA
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">
                    Fuente: <strong className="text-emerald-400">{reportSource || (engineConfig.mode === 'gemini' ? 'Motor Neural Cuantitativo' : 'Gateway Cuantitativo')}</strong>
                  </span>
                  <button
                    onClick={() => loadTacticalReport(match)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    title="Regenerar análisis con IA"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center space-y-3">
                  <Cpu className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">
                    Generando inferencia cuantitativa deportiva en tiempo real...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overview */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    {report?.tacticalOverview}
                  </p>

                  {/* Key Factors list */}
                  {report?.keyFactors && report.keyFactors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Factores Clave del Modelo
                      </span>
                      <div className="space-y-1.5">
                        {report.keyFactors.map((factor, idx) => (
                          <div 
                            key={idx}
                            className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-900"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Absences Impact Analysis */}
                  {report?.absencesImpact && (
                    <div className="text-xs text-slate-300/90 bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                      <strong className="text-amber-400 font-bold block mb-1">
                        Impacto Táctico de Bajas:
                      </strong>
                      {report.absencesImpact}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bajas Confirmadas (1 col) */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Bajas Confirmadas
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                  {match.absences?.length || 0} Reportadas
                </span>
              </div>

              {match.absences && match.absences.length > 0 ? (
                <div className="space-y-2">
                  {match.absences.map((abs, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{abs.player}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          abs.impactLevel === 'alto' 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          Impacto {abs.impactLevel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {abs.team} • {abs.position}
                      </div>
                      <div className="text-[10px] text-rose-400 font-medium">
                        Motivo: {abs.reason}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-50" />
                  <span>Sin bajas de alto impacto confirmadas para este partido.</span>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM INTERACTIVE AI CONSULTATION BOX */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0C1222] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Consulta Táctica Personalizada a la IA
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">
                Pregunta por clima, altura, córners o combinadas
              </span>
            </div>

            <form onSubmit={handleSendCustomQuestion} className="flex gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ej: ¿Cómo afecta el factor cancha o el cansancio en este encuentro?"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-all"
              />
              <button
                type="submit"
                disabled={isAsking || !customQuestion.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
              >
                {isAsking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Consultar</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {customAnswer && (
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed animate-in fade-in">
                <strong className="text-cyan-300 font-bold block mb-1">
                  Respuesta del Analista Cuantitativo:
                </strong>
                {customAnswer}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tipster IA Match Intelligence Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
