import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Trash2, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  ArrowRight,
  Calculator,
  Percent,
  Copy,
  Check,
  ExternalLink,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParlayLeg, EVSignal, Match, BankrollSettings } from '../types';

interface ParlayCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  legs: ParlayLeg[];
  bankrollSettings: BankrollSettings;
  onRemoveLeg: (legId: string) => void;
  onClearParlay: () => void;
  onAddPresetParlay: (presetType: 'gold' | 'triplet' | 'mega') => void;
  availableSignals: EVSignal[];
  matches: Match[];
  onAddSignalToParlay: (signal: EVSignal) => void;
}

export const ParlayCalculatorModal: React.FC<ParlayCalculatorModalProps> = ({
  isOpen,
  onClose,
  legs,
  bankrollSettings,
  onRemoveLeg,
  onClearParlay,
  onAddPresetParlay,
  availableSignals,
  matches,
  onAddSignalToParlay
}) => {
  const [betAmountUnits, setBetAmountUnits] = useState<number>(1.0);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Compute live parlay analytics
  const totalOdds = legs.reduce((acc, leg) => acc * leg.odds, 1);
  const formattedTotalOdds = totalOdds > 1 ? Number(totalOdds.toFixed(2)) : 0;

  // Joint model probability (Product of independent probabilities)
  const jointModelProb = legs.length > 0
    ? legs.reduce((acc, leg) => acc * (leg.modelProb / 100), 1) * 100
    : 0;

  const jointImpliedProb = formattedTotalOdds > 0 ? (1 / formattedTotalOdds) * 100 : 0;
  const jointFairOdds = jointModelProb > 0 ? Number((100 / jointModelProb).toFixed(2)) : 0;
  
  // Total Edge %
  const totalEdge = jointFairOdds > 0 && formattedTotalOdds > 0
    ? Number((((formattedTotalOdds / jointFairOdds) - 1) * 100).toFixed(1))
    : 0;

  // Check for same-match correlation
  const matchIds = legs.map(l => l.matchId);
  const hasCorrelation = new Set(matchIds).size !== matchIds.length;

  // Recommended Kelly Staking Units for parlays
  let recommendedStake = 0.5;
  if (totalEdge > 15 && legs.length <= 3) recommendedStake = 1.5;
  else if (totalEdge > 8) recommendedStake = 1.0;
  else if (totalEdge > 0) recommendedStake = 0.5;
  else recommendedStake = 0.25;

  const betAmountSoles = (betAmountUnits * bankrollSettings.unitValueSoles).toFixed(2);
  const potentialPayoutSoles = (Number(betAmountSoles) * formattedTotalOdds).toFixed(2);
  const potentialProfitSoles = (Number(potentialPayoutSoles) - Number(betAmountSoles)).toFixed(2);

  const potentialPayoutUnits = Number((betAmountUnits * formattedTotalOdds).toFixed(2));
  const potentialProfitUnits = Number((potentialPayoutUnits - betAmountUnits).toFixed(2));

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleCopyTicket = () => {
    const legsText = legs.map((l, i) => `${i + 1}. ⚽ ${l.matchTitle} (${l.league})\n   📌 Mercado: ${l.market}\n   ✅ Selección: ${l.selection} (@${l.odds})`).join('\n\n');

    const fullTicket = `🎟️ TICKET DE APUESTA TOTAL - TIPSTER IA PRO
═════════════════════════════
${legsText}
═════════════════════════════
📊 Cuota Total Apuesta Total: @${formattedTotalOdds}
⚡ Ventaja Algorítmica (+EV): +${totalEdge}%
💰 Monto a Apostar: S/. ${betAmountSoles} (${betAmountUnits}u)
💵 Ganancia Potencial: S/. ${potentialPayoutSoles} (Beneficio Neto: S/. ${potentialProfitSoles})
🔗 Realizar apuesta en: https://www.apuestatotal.com/apuestas-deportivas/`;

    navigator.clipboard.writeText(fullTicket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="parlay-calculator-modal"
        className="w-full max-w-4xl bg-[#0B101D] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                Ticket de Combinadas Apuesta Total
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {legs.length} / 8 Selecciones
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cálculo cuantitativo de ventaja matemática (+EV) y retorno calibrado en Soles (PEN)
              </p>
            </div>
          </div>

          <button
            id="close-parlay-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Quick Presets Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>Plantillas Rápidas Apuesta Total:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="preset-gold-btn"
                onClick={() => onAddPresetParlay('gold')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-extrabold border border-rose-500/30 transition-all flex items-center gap-1"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Combo +EV de Oro (3P)</span>
              </button>
              <button
                id="preset-triplet-btn"
                onClick={() => onAddPresetParlay('triplet')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-extrabold border border-cyan-500/30 transition-all flex items-center gap-1"
              >
                <span>Triplete Liga 1 & Premier (3P)</span>
              </button>
              <button
                id="preset-mega-btn"
                onClick={() => onAddPresetParlay('mega')}
                className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-extrabold border border-purple-500/30 transition-all flex items-center gap-1"
              >
                <span>Mega Parlay Cuantitativo (5P)</span>
              </button>
            </div>
          </div>

          {/* Core Analytics Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Cuota Combinada */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Cuota Combinada
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
                @{formattedTotalOdds > 0 ? formattedTotalOdds : '1.00'}
              </span>
              <span className="text-[10px] text-slate-400">
                Multiplicador Apuesta Total
              </span>
            </div>

            {/* Probabilidad del Modelo */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Prob. Conjunta Modelo
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
                {jointModelProb.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">
                vs {jointImpliedProb.toFixed(1)}% implícita
              </span>
            </div>

            {/* Edge Matemático */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Ventaja (+EV)
              </span>
              <span className={`text-2xl sm:text-3xl font-black mt-1 block ${
                totalEdge > 0 ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {totalEdge > 0 ? `+${totalEdge}%` : `${totalEdge}%`}
              </span>
              <span className="text-[10px] text-slate-400">
                Cuota Fair: @{jointFairOdds}
              </span>
            </div>

            {/* Stake Kelly Sugerido */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Stake Sugerido (S/.)
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-300 mt-1 block">
                S/. {(recommendedStake * bankrollSettings.unitValueSoles).toFixed(0)}
              </span>
              <span className="text-[10px] text-slate-400">
                ({recommendedStake}u • S/. {bankrollSettings.totalBankrollSoles} bank)
              </span>
            </div>
          </div>

          {/* Correlation warning if applicable */}
          {hasCorrelation && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Aviso de Correlación:</strong> Has añadido múltiples selecciones del mismo partido. En Apuesta Total te recomendamos jugarlas como Crear Apuesta si son del mismo encuentro.
              </span>
            </div>
          )}

          {/* Legs List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" />
                Selecciones del Ticket ({legs.length}/8)
              </span>
              {legs.length > 0 && (
                <button
                  id="clear-parlay-btn"
                  onClick={onClearParlay}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar Ticket</span>
                </button>
              )}
            </div>

            {legs.length === 0 ? (
              <div className="py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
                <Layers className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
                <p className="text-sm font-bold text-slate-300">
                  No hay selecciones en el ticket de Apuesta Total
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Añade selecciones con el botón &quot;+ Ticket&quot; desde las Señales +EV o el Calendario de Partidos, o carga una plantilla rápida arriba.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {legs.map((leg, idx) => (
                  <div
                    key={leg.id || idx}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 font-black flex items-center justify-center text-[11px] shrink-0 border border-rose-500/30">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {leg.matchTitle}
                          </span>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                            {leg.league}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                          <span className="font-semibold text-emerald-400">{leg.selection}</span>
                          <span>•</span>
                          <span>{leg.market}</span>
                          <span>•</span>
                          <span className="text-slate-300 font-bold">Prob: {leg.modelProb}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-white px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                        @{leg.odds}
                      </span>
                      <button
                        onClick={() => onRemoveLeg(leg.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Eliminar pierna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Staking Simulator in Soles */}
          {legs.length >= 2 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/30 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-rose-400" />
                  Simulación de Apuesta en Soles (PEN)
                </span>
                <span className="text-xs font-extrabold text-emerald-400">
                  Beneficio Neto: +S/. {potentialProfitSoles} (+{potentialProfitUnits}u)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">Monto a Jugar:</span>
                  <div className="flex items-center gap-1.5">
                    {[0.5, 1.0, 1.5, 2.0].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBetAmountUnits(val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          betAmountUnits === val
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        S/. {(val * bankrollSettings.unitValueSoles).toFixed(0)} ({val}u)
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Pago Total Estimado en Apuesta Total</span>
                  <span className="text-2xl font-black text-emerald-300">
                    S/. {potentialPayoutSoles}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Direct Apuesta Total Bet & Copy */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            {legs.length >= 2 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Ticket calibrado listo para Apuesta Total (+{totalEdge}% Edge)
              </span>
            ) : (
              <span>Se requieren al menos 2 selecciones para armar la combinada</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {legs.length >= 2 && (
              <>
                <button
                  id="copy-ticket-btn"
                  onClick={handleCopyTicket}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all"
                  title="Copiar texto del ticket"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Ticket</span>
                    </>
                  )}
                </button>

                <a
                  id="direct-at-link-btn"
                  href="https://www.apuestatotal.com/apuestas-deportivas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  <span>Apostar en Apuesta Total</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
