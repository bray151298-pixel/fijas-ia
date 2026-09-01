import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight, 
  Plus, 
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Coins
} from 'lucide-react';
import { EVSignal, Match, BankrollSettings, SportType } from '../types';

interface EVSignalsColumnProps {
  signals: EVSignal[];
  matches: Match[];
  bankrollSettings: BankrollSettings;
  onSelectSignal: (signal: EVSignal) => void;
  onAddToParlay: (signal: EVSignal) => void;
  addedSignalIds?: string[];
  selectedSport?: SportType | 'all';
}

export const EVSignalsColumn: React.FC<EVSignalsColumnProps> = ({
  signals,
  matches,
  bankrollSettings,
  onSelectSignal,
  onAddToParlay,
  addedSignalIds = [],
  selectedSport = 'all'
}) => {
  const [minEdgeFilter, setMinEdgeFilter] = useState<number>(0);
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'ALTA'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sportEmojiMap: Record<string, string> = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    baseball: '⚾',
    mma: '🥊'
  };

  const filteredSignals = signals.filter(s => {
    if (selectedSport !== 'all' && s.sport !== selectedSport) return false;
    if (s.edge < minEdgeFilter) return false;
    if (urgencyFilter === 'ALTA' && s.urgency !== 'ALTA') return false;
    return true;
  });

  const getMultiplier = (stakeStr: string): number => {
    if (stakeStr.includes('2.5')) return 2.5;
    if (stakeStr.includes('2.0')) return 2.0;
    if (stakeStr.includes('1.5')) return 1.5;
    return 1.0;
  };

  const handleCopyApuestaTotalPlay = (signal: EVSignal) => {
    const stakeMultiplier = getMultiplier(signal.stake);
    const solesAmount = (bankrollSettings.unitValueSoles * stakeMultiplier).toFixed(2);
    const potentialPayout = (Number(solesAmount) * signal.odds).toFixed(2);
    
    const playText = `🎯 JUGADA APUESTA TOTAL [${signal.apuestaTotalMarketCode || 'AT-PRO'}]
⚽ Partido: ${signal.matchTitle} (${signal.league})
📌 Mercado: ${signal.market}
✅ Selección: ${signal.selection}
📈 Cuota Apuesta Total: @${signal.odds} (Cuota Fair: @${signal.fairOdds})
⚡ Edge Matemático: +${signal.edge}%
💰 Stake Sugerido: ${signal.stake} = S/. ${solesAmount}
💵 Ganancia Potencial: S/. ${potentialPayout}
🔗 Apostar en: https://www.apuestatotal.com/apuestas-deportivas/`;

    navigator.clipboard.writeText(playText);
    setCopiedId(signal.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Column Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Señales +EV Apuesta Total
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
                {filteredSignals.length} PICKS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Desajustes matemáticos calibrados para el catálogo de Apuesta Total
            </p>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            id="filter-edge-all"
            onClick={() => setMinEdgeFilter(0)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              minEdgeFilter === 0 
                ? 'bg-slate-800 text-white border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            id="filter-edge-10"
            onClick={() => setMinEdgeFilter(10)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              minEdgeFilter === 10 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Edge &gt;10%
          </button>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-3.5 overflow-y-auto pr-0.5">
        {filteredSignals.map((signal) => {
          const isAdded = addedSignalIds.includes(signal.id);
          const stakeMultiplier = getMultiplier(signal.stake);
          const stakeSoles = (bankrollSettings.unitValueSoles * stakeMultiplier).toFixed(0);
          const potentialReturnSoles = (Number(stakeSoles) * signal.odds).toFixed(1);
          const netProfitSoles = (Number(potentialReturnSoles) - Number(stakeSoles)).toFixed(1);

          return (
            <div
              key={signal.id}
              id={`ev-card-${signal.id}`}
              className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-[#0A0F1D] border border-rose-500/30 hover:border-rose-400/60 shadow-xl hover:shadow-rose-950/30 transition-all group flex flex-col justify-between gap-3.5"
            >
              {/* Header: League & Apuesta Total Code & Time */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 font-medium text-[11px] border border-slate-700/60 flex items-center gap-1">
                    <span>{signal.sport ? sportEmojiMap[signal.sport] : '⚽'}</span>
                    <span>{signal.league}</span>
                  </span>
                  {signal.apuestaTotalSpecialBoost && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      <Flame className="w-3 h-3 text-amber-400" />
                      LIGA 1 APUESTA TOTAL
                    </span>
                  )}
                  {signal.urgency === 'ALTA' && !signal.apuestaTotalSpecialBoost && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                      <Flame className="w-3 h-3 text-rose-400" />
                      ALTO VALOR
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{signal.timeToKickoff}</span>
                </div>
              </div>

              {/* Match Title */}
              <div>
                <h3 
                  onClick={() => onSelectSignal(signal)}
                  className="text-base font-bold text-white group-hover:text-rose-300 cursor-pointer transition-colors flex items-center justify-between gap-2"
                >
                  <span className="truncate">{signal.matchTitle}</span>
                  <div className="flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)] shrink-0">
                    <span>+{signal.edge}% VENTAJA</span>
                  </div>
                </h3>
                
                {/* 1 & 2: Highlighted "¿A qué apostar?" Box in vivid green */}
                <div className="mt-2.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 shadow-inner">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-[11px] uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ¿A qué apostar?
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Mercado: <strong className="text-slate-200">{signal.market}</strong>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <div className="text-sm sm:text-base font-black text-white leading-snug">
                      👉 <span className="text-emerald-300">{signal.selection}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 block font-medium">Cuota</span>
                      <span className="text-lg font-black text-emerald-400">
                        @{signal.odds}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3: Simple & Transparent Stake Explanation */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recomendación de Apuesta (Stake):</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Probabilidad: <strong className="text-emerald-400">{signal.modelProb}%</strong>
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-extrabold text-rose-300">
                      Apostar: {stakeMultiplier} {stakeMultiplier === 1 ? 'Unidad' : 'Unidades'}
                    </span>
                    <span className="text-slate-400 ml-1">
                      (Ejemplo: <strong className="text-white">S/. {stakeSoles}</strong> si tu unidad es S/. {bankrollSettings.unitValueSoles})
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400">
                    Ganancia neta: +S/. {netProfitSoles}
                  </div>
                </div>
              </div>

              {/* 4: 2-Line "Por qué apostar" with Tactical & Injuries Details */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>¿Por qué apostar? (Análisis Táctico & Bajas)</span>
                </div>
                
                {/* Line 1: Tactical Reason */}
                <div className="text-slate-300 text-[11px] leading-relaxed flex items-start gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20 shrink-0 mt-0.5">
                    TÁCTICA
                  </span>
                  <span>{signal.tacticalReason || signal.rationale}</span>
                </div>

                {/* Line 2: Injuries / Rival Context */}
                {signal.injuriesContext && (
                  <div className="text-slate-300 text-[11px] leading-relaxed flex items-start gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-extrabold text-[10px] border border-rose-500/20 shrink-0 mt-0.5">
                      BAJAS
                    </span>
                    <span>{signal.injuriesContext}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer with Apuesta Total Deep Link */}
              <div className="flex items-center gap-1.5 pt-1">
                {/* Direct Bet on Apuesta Total */}
                <a
                  id={`bet-at-btn-${signal.id}`}
                  href="https://www.apuestatotal.com/apuestas-deportivas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-md shadow-rose-950/30 transition-all shrink-0"
                  title="Abrir página oficial de Apuesta Total"
                >
                  <span>Apostar en Apuesta Total</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* Copy play for Apuesta Total ticket */}
                <button
                  id={`copy-play-btn-${signal.id}`}
                  onClick={() => handleCopyApuestaTotalPlay(signal)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0"
                  title="Copiar jugada para boleto de Apuesta Total"
                >
                  {copiedId === signal.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Match Intelligence */}
                <button
                  id={`view-match-btn-${signal.id}`}
                  onClick={() => onSelectSignal(signal)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all truncate"
                >
                  <span className="truncate">Ver Detalle</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                </button>

                {/* Add to Parlay */}
                <button
                  id={`add-parlay-btn-${signal.id}`}
                  onClick={() => onAddToParlay(signal)}
                  className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isAdded
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-extrabold shadow-sm'
                  }`}
                  title="Añadir selección a la calculadora de Parlays"
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">En Ticket</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {filteredSignals.length === 0 && (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
            <Zap className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-300">
              No hay señales activas con este filtro
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Reduce el filtro de Edge para explorar más oportunidades en Apuesta Total.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

