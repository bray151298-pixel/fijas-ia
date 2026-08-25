import React, { useState, useEffect } from 'react';
import {
  Radio,
  Zap,
  Activity,
  Calendar,
  Crown,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Flame,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  FileText,
  Percent,
  Play,
  Check,
  Info
} from 'lucide-react';
import {
  LiveInPlayMatch,
  NextDayMatchAnalysis,
  NextDayPipelineStatus,
  GoldenParlayVIP
} from '../types';
import {
  getLiveScannerMatches,
  triggerLiveScan,
  broadcastLiveSignal,
  settleLiveMatch,
  getNextDayPreMatchAnalysis,
  triggerNextDayScan,
  promoteNextDayToCartelera,
  getTodayGoldenParlayVIP,
  generateGoldenParlayVIP,
  broadcastGoldenParlayVIP,
  settleGoldenParlayVIP,
  formatLiveInPlayAlert,
  formatLiveInPlaySettledCelebration,
  formatGoldenParlayVIP,
  formatGoldenParlaySettledVIP
} from '../services/telegramService';

interface LiveScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshDatabase?: () => void;
}

export const LiveScannerModal: React.FC<LiveScannerModalProps> = ({
  isOpen,
  onClose,
  onRefreshDatabase
}) => {
  const [activeTab, setActiveTab] = useState<'LIVE_INPLAY' | 'NEXT_DAY_PREMATCH' | 'GOLDEN_PARLAY_VIP'>('LIVE_INPLAY');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Live in-play state
  const [liveMatches, setLiveMatches] = useState<LiveInPlayMatch[]>([]);
  const [selectedLiveMatch, setSelectedLiveMatch] = useState<LiveInPlayMatch | null>(null);

  // Next-day state
  const [nextDayStatus, setNextDayStatus] = useState<NextDayPipelineStatus | null>(null);
  const [selectedNextDayMatch, setSelectedNextDayMatch] = useState<NextDayMatchAnalysis | null>(null);

  // Golden Parlay VIP state
  const [goldenParlay, setGoldenParlay] = useState<GoldenParlayVIP | null>(null);

  // Auto-fetch data on open and poll every 15 seconds in real-time
  useEffect(() => {
    if (!isOpen) return;

    loadAllData();
    const interval = setInterval(() => {
      loadAllDataSilently();
    }, 15000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const loadAllDataSilently = async () => {
    try {
      const [liveRes, nextRes, parlayRes] = await Promise.all([
        getLiveScannerMatches(),
        getNextDayPreMatchAnalysis(),
        getTodayGoldenParlayVIP()
      ]);

      if (liveRes.ok && liveRes.matches) {
        setLiveMatches(liveRes.matches);
        setSelectedLiveMatch(prev => {
          if (!prev && liveRes.matches.length > 0) return liveRes.matches[0];
          if (prev) {
            const updated = liveRes.matches.find(m => m.id === prev.id);
            return updated || (liveRes.matches.length > 0 ? liveRes.matches[0] : null);
          }
          return null;
        });
      }

      if (nextRes.ok && nextRes.status) {
        setNextDayStatus(nextRes.status);
      }

      if (parlayRes.ok && parlayRes.parlay) {
        setGoldenParlay(parlayRes.parlay);
      }
    } catch (err) {
      // silent background refresh
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [liveRes, nextRes, parlayRes] = await Promise.all([
        getLiveScannerMatches(),
        getNextDayPreMatchAnalysis(),
        getTodayGoldenParlayVIP()
      ]);

      if (liveRes.ok && liveRes.matches) {
        setLiveMatches(liveRes.matches);
        if (liveRes.matches.length > 0) setSelectedLiveMatch(liveRes.matches[0]);
      }

      if (nextRes.ok && nextRes.status) {
        setNextDayStatus(nextRes.status);
        if (nextRes.status.scannedMatches.length > 0) setSelectedNextDayMatch(nextRes.status.scannedMatches[0]);
      }

      if (parlayRes.ok && parlayRes.parlay) {
        setGoldenParlay(parlayRes.parlay);
      }
    } catch (err) {
      console.warn('Error loading live & dual module data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Handlers for Live Scanner
  const handleScanLiveTick = async () => {
    setLoading(true);
    const res = await triggerLiveScan();
    setLoading(false);
    if (res.ok && res.matches) {
      setLiveMatches(res.matches);
      if (selectedLiveMatch) {
        const updated = res.matches.find(m => m.id === selectedLiveMatch.id);
        if (updated) setSelectedLiveMatch(updated);
      }
      showFeedback(`⚡ Escaneo en vivo completado: ${res.alertTriggeredCount} desajustes +EV detectados.`);
    }
  };

  const handleBroadcastLive = async (match: LiveInPlayMatch) => {
    setLoading(true);
    const res = await broadcastLiveSignal(match.id);
    setLoading(false);
    if (res.ok) {
      showFeedback(`📡 ¡Alerta en vivo enviada a Telegram para ${match.eventTitle}!`);
      loadAllData();
    }
  };

  const handleSettleLiveGoal = async (match: LiveInPlayMatch) => {
    setLoading(true);
    const res = await settleLiveMatch({
      matchId: match.id,
      status: 'SETTLED_WON',
      finalScore: '1 - 0 (GOL 78\')',
      goalMinute: 78,
      broadcastCelebration: true
    });
    setLoading(false);
    if (res.ok) {
      showFeedback(`✅ ¡GOL Confirmado! Celebración instantánea y +${res.match?.netUnitsGained}u enviadas a Telegram.`);
      loadAllData();
      if (onRefreshDatabase) onRefreshDatabase();
    }
  };

  // Handlers for Next Day Pre-Match
  const handleScanNextDay = async () => {
    setLoading(true);
    const res = await triggerNextDayScan();
    setLoading(false);
    if (res.ok && res.status) {
      setNextDayStatus(res.status);
      showFeedback('🔮 Análisis continuo actualizado: Bajas confirmadas y cuotas de apertura procesadas.');
    }
  };

  const handlePromoteToCartelera = async (match: NextDayMatchAnalysis) => {
    setLoading(true);
    const res = await promoteNextDayToCartelera(match.id);
    setLoading(false);
    if (res.ok) {
      showFeedback(`📋 ${match.eventTitle} promovido a la Cartelera de Medianoche (00:30 AM).`);
      loadAllData();
    }
  };

  // Handlers for Golden Parlay VIP
  const handleGenerateGoldenParlay = async () => {
    setLoading(true);
    const res = await generateGoldenParlayVIP();
    setLoading(false);
    if (res.ok && res.parlay) {
      setGoldenParlay(res.parlay);
      showFeedback(`👑 Combinada de Oro VIP generada: Cuota @${res.parlay.combinedOdds} (Certeza: ${res.parlay.jointWinProb}%).`);
    }
  };

  const handleBroadcastVIP = async () => {
    setLoading(true);
    const res = await broadcastGoldenParlayVIP();
    setLoading(false);
    if (res.ok) {
      showFeedback('👑 Combinada de Oro VIP transmitida al canal exclusivo.');
      loadAllData();
    }
  };

  const handleSettleGoldenParlayWon = async () => {
    setLoading(true);
    const res = await settleGoldenParlayVIP({
      status: 'WON',
      legsResults: (goldenParlay?.legs || []).map(l => ({ legId: l.id, status: 'WON', finalScore: l.finalScore || 'FINAL' })),
      broadcastCelebration: true
    });
    setLoading(false);
    if (res.ok) {
      showFeedback(`🎉 ¡PLENO VIP! Combinada de Oro liquidada y celebrada a cuota @${goldenParlay?.combinedOdds}.`);
      loadAllData();
      if (onRefreshDatabase) onRefreshDatabase();
    }
  };

  if (!isOpen) return null;

  return (
    <div id="live-scanner-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="live-scanner-modal-container" 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* MODAL HEADER */}
        <div id="live-scanner-modal-header" className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/40 rounded-xl">
              <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">Módulo Dual & Escáner Cuantitativo</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  MOTOR EN VIVO ACTIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Análisis continuo para el día siguiente · Escáner in-play (+EV &gt; 12%) · Combinada de Oro VIP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-refresh-scanner-data"
              onClick={loadAllData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              id="btn-close-scanner-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700/50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {actionSuccess && (
          <div id="scanner-feedback-banner" className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div id="scanner-tabs-bar" className="px-6 pt-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <button
            id="tab-btn-live-inplay"
            onClick={() => setActiveTab('LIVE_INPLAY')}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'LIVE_INPLAY'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Escáner En Vivo (Live In-Play)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
              {liveMatches.length} Activos
            </span>
          </button>

          <button
            id="tab-btn-next-day-prematch"
            onClick={() => setActiveTab('NEXT_DAY_PREMATCH')}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'NEXT_DAY_PREMATCH'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Análisis Continuo (Día Siguiente)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">
              {nextDayStatus?.scannedMatches.length || 0} Oportunidades
            </span>
          </button>

          <button
            id="tab-btn-golden-parlay-vip"
            onClick={() => setActiveTab('GOLDEN_PARLAY_VIP')}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'GOLDEN_PARLAY_VIP'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-yellow-400" />
            <span>Combinada de Oro VIP</span>
            {goldenParlay && (
              <span className="ml-1 px-1.5 py-0.2 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30 font-mono">
                @{goldenParlay.combinedOdds}
              </span>
            )}
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div id="scanner-modal-body" className="p-6 overflow-y-auto max-h-[calc(92vh-160px)] space-y-6">
          
          {/* TAB 1: ESCÁNER EN VIVO (LIVE IN-PLAY) */}
          {activeTab === 'LIVE_INPLAY' && (
            <div id="tab-content-live-inplay" className="space-y-6">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Monitor In-Play Minuto a Minuto (20' a 75')
                    </h3>
                    <p className="text-xs text-slate-400">
                      Rastreo de desajustes temporales donde la cuota sube por el tiempo y genera +EV &gt; 12%.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    id="btn-scan-inplay-now"
                    onClick={handleScanLiveTick}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-amber-900/30 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Escanear Minuto Actual</span>
                  </button>
                </div>
              </div>

              {/* Grid: Matches list + Live Telemetry & Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Match Selection Column */}
                <div className="lg:col-span-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Partidos en Curso Monitoreados ({liveMatches.length})
                  </span>
                  
                  <div className="space-y-2.5">
                    {liveMatches.map((m) => {
                      const isSelected = selectedLiveMatch?.id === m.id;
                      const hasEV = m.liveEdgeEV >= 12;

                      return (
                        <div
                          key={m.id}
                          id={`live-card-${m.id}`}
                          onClick={() => setSelectedLiveMatch(m)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-slate-800 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg'
                              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                              <span>{m.sportEmoji}</span>
                              <span>{m.league}</span>
                            </span>
                            <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-md flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {m.currentMinute}' ({m.period})
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white">{m.eventTitle}</h4>
                            <span className="text-base font-black text-amber-400 font-mono tracking-tight">
                              {m.currentScore}
                            </span>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-slate-300">
                              <span className="text-slate-400">Jugada:</span>
                              <span className="font-semibold text-white">{m.liveSelection}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-amber-400">@{m.liveOdds.toFixed(2)}</span>
                              {hasEV && (
                                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold text-[11px]">
                                  +{m.liveEdgeEV.toFixed(1)}% EV
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Details & Real-Time Action Panel */}
                <div className="lg:col-span-7">
                  {selectedLiveMatch ? (
                    <div id="live-details-panel" className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 space-y-5">
                      {/* Top banner */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{selectedLiveMatch.sportEmoji}</span>
                            <h3 className="text-lg font-bold text-white">{selectedLiveMatch.eventTitle}</h3>
                          </div>
                          <p className="text-xs text-slate-400">{selectedLiveMatch.league} · {selectedLiveMatch.period}</p>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-black text-amber-400 font-mono">
                            {selectedLiveMatch.currentScore}
                          </div>
                          <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            {selectedLiveMatch.sport === 'BASEBALL' ? selectedLiveMatch.period : (selectedLiveMatch.sport === 'BASKETBALL' ? selectedLiveMatch.period : `Minuto ${selectedLiveMatch.currentMinute}'`)}
                          </span>
                        </div>
                      </div>

                      {/* Pressure & In-Play Telemetry */}
                      <div className="p-4 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-orange-400" />
                            Índice de Presión Ofensiva en Vivo
                          </span>
                          <span className="font-mono font-black text-orange-400 text-sm">
                            {selectedLiveMatch.pressureIndex} / 100
                          </span>
                        </div>

                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${selectedLiveMatch.pressureIndex}%` }}
                          ></div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                          <div className="p-2 bg-slate-800/60 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">
                              {selectedLiveMatch.sport === 'BASEBALL' ? 'Carreras Proyectadas' : (selectedLiveMatch.sport === 'BASKETBALL' ? 'Puntos xG' : 'xG Total')}
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              {(selectedLiveMatch.stats.xGHome + selectedLiveMatch.stats.xGAway).toFixed(1)}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-800/60 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">
                              {selectedLiveMatch.sport === 'BASEBALL' ? 'Hits Conectados' : (selectedLiveMatch.sport === 'BASKETBALL' ? 'Tiros al Aro' : 'Tiros al Arco')}
                            </span>
                            <span className="font-mono font-bold text-white">
                              {selectedLiveMatch.stats.homeShotsOnTarget + selectedLiveMatch.stats.awayShotsOnTarget}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-800/60 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">
                              {selectedLiveMatch.sport === 'BASEBALL' ? 'Turnos de Bateo' : (selectedLiveMatch.sport === 'BASKETBALL' ? 'Posesiones Ofensivas' : 'Ataques Peligrosos')}
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              {selectedLiveMatch.stats.dangerousAttacksHome + selectedLiveMatch.stats.dangerousAttacksAway}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-800/60 rounded-lg">
                            <span className="text-slate-400 block text-[10px]">
                              {selectedLiveMatch.sport === 'BASEBALL' ? 'Control de Pitcheo' : (selectedLiveMatch.sport === 'BASKETBALL' ? 'Efectividad de Tiro' : 'Posesión')}
                            </span>
                            <span className="font-mono font-bold text-slate-300">
                              {selectedLiveMatch.stats.possessionHome}% - {selectedLiveMatch.stats.possessionAway}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Value Mismatch Card */}
                      <div className="p-4 bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            DESAJUSTE DETECTADO (+EV LIVE &gt; 12%)
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                            Urgencia: {selectedLiveMatch.urgencyLevel}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 bg-slate-900/70 rounded-lg border border-slate-700/40">
                            <span className="text-slate-400 block text-[10px]">Cuota Pre-Partido</span>
                            <span className="font-mono text-slate-400">@{selectedLiveMatch.preMatchOdds.toFixed(2)}</span>
                          </div>
                          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/40">
                            <span className="text-amber-300 block text-[10px]">Cuota Live Actual</span>
                            <span className="font-mono font-bold text-amber-400 text-sm">@{selectedLiveMatch.liveOdds.toFixed(2)}</span>
                          </div>
                          <div className="p-2 bg-slate-900/70 rounded-lg border border-slate-700/40">
                            <span className="text-slate-400 block text-[10px]">Cuota Justa IA</span>
                            <span className="font-mono text-emerald-400">@{selectedLiveMatch.fairOdds.toFixed(2)}</span>
                          </div>
                          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/40">
                            <span className="text-emerald-300 block text-[10px]">Ventaja (+EV)</span>
                            <span className="font-mono font-bold text-emerald-400 text-sm">+{selectedLiveMatch.liveEdgeEV.toFixed(1)}%</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                          "{selectedLiveMatch.reasonWhyLiveValue}"
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          id="btn-broadcast-live-telegram"
                          onClick={() => handleBroadcastLive(selectedLiveMatch)}
                          disabled={loading}
                          className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30 transition-all"
                        >
                          <Send className="w-4 h-4" />
                          <span>⚡ Emitir Alerta Telegram (@FijasIAOficial)</span>
                        </button>

                        <button
                          id="btn-settle-live-won"
                          onClick={() => handleSettleLiveGoal(selectedLiveMatch)}
                          disabled={loading}
                          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✅ ¡GOL! Liquidar y Celebrar (+{selectedLiveMatch.netUnitsGained || '1.32'}u)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-800">
                      Selecciona un partido del listado para ver la telemetría en vivo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANÁLISIS CONTINUO PARA EL DÍA SIGUIENTE */}
          {activeTab === 'NEXT_DAY_PREMATCH' && (
            <div id="tab-content-next-day-prematch" className="space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Activity className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Pipeline Continuo de Ingesta & Bajas Confirmadas
                    </h3>
                    <p className="text-xs text-indigo-200">
                      Analiza durante todo el día las estadísticas y cuotas de apertura para alimentar la Cartelera de las 00:30 AM.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-scan-next-day-now"
                  onClick={handleScanNextDay}
                  disabled={loading}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-900/30 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar Bajas & Cuotas</span>
                </button>
              </div>

              {/* Next Day Matches Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nextDayStatus?.scannedMatches.map((m) => {
                  return (
                    <div
                      key={m.id}
                      id={`next-day-card-${m.id}`}
                      className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-xl space-y-3.5 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <span>{m.sportEmoji}</span>
                          <span>{m.league}</span>
                        </span>
                        <span className="px-2 py-0.5 text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded">
                          {m.kickoffDate}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white">{m.eventTitle}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">Selección sugerida:</span>
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {m.bestSelection} (@{m.currentBookieOdds.toFixed(2)})
                          </span>
                        </div>
                      </div>

                      {/* Injuries Section */}
                      {m.confirmedInjuries.length > 0 && (
                        <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800 space-y-1.5">
                          <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Bajas & Novedades Confirmadas:
                          </span>
                          <div className="space-y-1 text-xs">
                            {m.confirmedInjuries.map((inj, i) => (
                              <div key={i} className="flex items-center justify-between text-slate-300">
                                <span>• <b>{inj.team}:</b> {inj.player} ({inj.position})</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                  inj.status === 'CONFIRMED_OUT' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                                }`}>
                                  {inj.status === 'CONFIRMED_OUT' ? 'BAJA CONFIRMADA' : 'DUDA'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Math Breakdown */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-slate-900/60 rounded">
                          <span className="text-slate-400 block text-[10px]">Cuota Bookie</span>
                          <span className="font-mono font-bold text-white">@{m.currentBookieOdds.toFixed(2)}</span>
                        </div>
                        <div className="p-2 bg-slate-900/60 rounded">
                          <span className="text-slate-400 block text-[10px]">Cuota Justa IA</span>
                          <span className="font-mono font-bold text-emerald-400">@{m.fairModelOdds.toFixed(2)}</span>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                          <span className="text-emerald-300 block text-[10px]">Ventaja (+EV)</span>
                          <span className="font-mono font-bold text-emerald-400">+{m.edgeEV.toFixed(1)}%</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 italic">
                        "{m.tacticalNotes}"
                      </p>

                      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {m.isVIPCandidate ? '⭐ Candidato VIP' : '📌 Candidato Abierto'}
                        </span>
                        <button
                          id={`btn-promote-${m.id}`}
                          onClick={() => handlePromoteToCartelera(m)}
                          disabled={loading || m.isReadyForMidnightCartelera}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                            m.isReadyForMidnightCartelera
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {m.isReadyForMidnightCartelera ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Listo en Cartelera 00:30</span>
                            </>
                          ) : (
                            <>
                              <Layers className="w-3.5 h-3.5" />
                              <span>Promover a Cartelera</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: COMBINADA DE ORO VIP */}
          {activeTab === 'GOLDEN_PARLAY_VIP' && goldenParlay && (
            <div id="tab-content-golden-parlay-vip" className="space-y-6">
              {/* VIP Golden Card */}
              <div className="p-6 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 font-black">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-amber-300 uppercase tracking-wide">
                          Combinada de Oro — Fijas IA
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                          EXCLUSIVO VIP
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Multiplicador de alta certeza combinando selecciones de probabilidad individual &gt; 80%.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Cuota Combinada Total</span>
                    <span className="text-3xl font-black text-amber-400 font-mono">
                      @{goldenParlay.combinedOdds.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Mathematical Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-center">
                    <span className="text-slate-400 text-xs block">Probabilidad Conjunta</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">{goldenParlay.jointWinProb}%</span>
                  </div>
                  <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-center">
                    <span className="text-slate-400 text-xs block">Stake Kelly Sugerido</span>
                    <span className="text-lg font-bold text-white font-mono">{goldenParlay.recommendedStakeUnits}u</span>
                  </div>
                  <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-center">
                    <span className="text-slate-400 text-xs block">Inversión (S/.)</span>
                    <span className="text-lg font-bold text-amber-300 font-mono">S/. {goldenParlay.stakeSoles.toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                    <span className="text-emerald-300 text-xs block">Retorno Proyectado</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">S/. {goldenParlay.potentialReturnSoles.toFixed(2)}</span>
                  </div>
                </div>

                {/* Legs List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Selecciones de Alta Probabilidad ({goldenParlay.legs.length} Partidos)
                  </h4>

                  <div className="space-y-2.5">
                    {goldenParlay.legs.map((leg, idx) => (
                      <div
                        key={leg.id}
                        className="p-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-400 text-sm font-mono">#{idx + 1}</span>
                            <span className="text-sm font-bold text-white">{leg.sportEmoji} {leg.eventTitle}</span>
                            <span className="text-xs text-slate-400">({leg.league} · {leg.kickoffTime})</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Jugada:</span>
                            <span className="font-bold text-emerald-400">{leg.selection}</span>
                            <span className="text-slate-400 italic">({leg.market})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-sm font-mono font-bold text-amber-400 block">@{leg.odds.toFixed(2)}</span>
                            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              {leg.individualWinProb}% Certeza
                            </span>
                          </div>
                          {leg.status === 'WON' && (
                            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg">
                              <Check className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VIP Actions */}
                <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row gap-3">
                  <button
                    id="btn-broadcast-golden-vip"
                    onClick={handleBroadcastVIP}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>👑 Publicar en Canal VIP (@SoporteFijasIA_bot)</span>
                  </button>

                  <button
                    id="btn-settle-golden-parlay-won"
                    onClick={handleSettleGoldenParlayWon}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    <span>🎉 Liquidar Pleno VIP (Celebrar a Cuota @{goldenParlay.combinedOdds})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
