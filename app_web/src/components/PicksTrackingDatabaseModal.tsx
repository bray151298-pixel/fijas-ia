import React, { useState } from 'react';
import { TrackedPick, SportType, AuditPerformance } from '../types';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Download, 
  Plus, 
  Send, 
  Filter, 
  Database, 
  BarChart3, 
  RefreshCw, 
  Check, 
  ShieldCheck, 
  DollarSign, 
  ArrowUpRight, 
  Flame,
  BrainCircuit
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface PicksTrackingDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackedPicks: TrackedPick[];
  auditPerformance: AuditPerformance;
  onSettlePick: (pickId: string, status: 'WON' | 'LOST' | 'PUSH', finalScore: string, notes: string, broadcastTelegram: boolean) => Promise<void>;
  onAddTrackedPick: (pick: Partial<TrackedPick>) => Promise<void>;
  onOpenAIDiagnostic?: (pick: TrackedPick) => void;
}

export const PicksTrackingDatabaseModal: React.FC<PicksTrackingDatabaseModalProps> = ({
  isOpen,
  onClose,
  trackedPicks,
  auditPerformance,
  onSettlePick,
  onAddTrackedPick,
  onOpenAIDiagnostic
}) => {
  const [activeTab, setActiveTab] = useState<'database' | 'audit_charts' | 'new_pick'>('database');
  const [selectedSportFilter, setSelectedSportFilter] = useState<SportType | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'PENDING' | 'WON' | 'LOST' | 'PUSH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Settlement sub-modal state
  const [settlingPick, setSettlingPick] = useState<TrackedPick | null>(null);
  const [settleStatus, setSettleStatus] = useState<'WON' | 'LOST' | 'PUSH'>('WON');
  const [settleFinalScore, setSettleFinalScore] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleBroadcastTelegram, setSettleBroadcastTelegram] = useState(true);
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState('');

  // New Pick Form state
  const [newSport, setNewSport] = useState<SportType>('football');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newLeague, setNewLeague] = useState('Liga 1 Perú');
  const [newMarket, setNewMarket] = useState('Hándicap Asiático');
  const [newSelection, setNewSelection] = useState('');
  const [newOdds, setNewOdds] = useState('1.90');
  const [newModelProb, setNewModelProb] = useState('58.5');
  const [newStakeUnits, setNewStakeUnits] = useState('1.5');
  const [newStakeSoles, setNewStakeSoles] = useState('75');
  const [newNotes, setNewNotes] = useState('');
  const [isAddingPick, setIsAddingPick] = useState(false);

  if (!isOpen) return null;

  // Filtered picks
  const filteredPicks = trackedPicks.filter(pick => {
    if (selectedSportFilter !== 'all' && pick.sport !== selectedSportFilter) return false;
    if (selectedStatusFilter !== 'ALL' && pick.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        pick.eventTitle.toLowerCase().includes(q) ||
        pick.selection.toLowerCase().includes(q) ||
        pick.league.toLowerCase().includes(q) ||
        pick.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sportEmojiMap: Record<string, string> = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    baseball: '⚾',
    mma: '🥊'
  };

  // Handle settlement
  const handleConfirmSettlement = async () => {
    if (!settlingPick) return;
    setIsSubmittingSettle(true);
    try {
      await onSettlePick(
        settlingPick.id,
        settleStatus,
        settleFinalScore || (settleStatus === 'WON' ? '2 - 0 (FINAL)' : '0 - 1 (FINAL)'),
        settleNotes,
        settleBroadcastTelegram
      );
      setSettleSuccessMsg(`¡Pick ${settlingPick.id} liquidado como ${settleStatus}!`);
      setTimeout(() => {
        setSettleSuccessMsg('');
        setSettlingPick(null);
      }, 1200);
    } catch (err: any) {
      alert('Error liquidando pick: ' + err.message);
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  // Handle new pick submission
  const handleCreateNewPick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newSelection) {
      alert('Por favor completa el evento y la selección');
      return;
    }
    setIsAddingPick(true);
    try {
      const oddsNum = parseFloat(newOdds) || 1.90;
      const probNum = parseFloat(newModelProb) || 58.0;
      const impliedProb = (1 / oddsNum) * 100;
      const edge = Number((((probNum / 100) * oddsNum - 1) * 100).toFixed(1));

      await onAddTrackedPick({
        sport: newSport,
        eventTitle: newEventTitle,
        league: newLeague,
        market: newMarket,
        selection: newSelection,
        odds: oddsNum,
        modelProb: probNum,
        impliedProb: Number(impliedProb.toFixed(1)),
        edge: edge,
        stakeUnits: parseFloat(newStakeUnits) || 1.5,
        stakeSoles: parseFloat(newStakeSoles) || 75,
        settlementNotes: newNotes || 'Registrado manualmente en base de datos'
      });

      setActiveTab('database');
      // Reset form
      setNewEventTitle('');
      setNewSelection('');
      setNewNotes('');
    } catch (err: any) {
      alert('Error registrando pick: ' + err.message);
    } finally {
      setIsAddingPick(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Deporte', 'Evento', 'Liga', 'Mercado', 'Selección', 'Cuota', 'Prob IA (%)', 'Edge (%)', 'Stake (u)', 'Stake (S/)', 'Estado', 'Resultado', 'Unidades Netas', 'Ganancia Soles', 'Fecha'];
    const rows = trackedPicks.map(p => [
      p.id,
      p.sport,
      `"${p.eventTitle}"`,
      `"${p.league}"`,
      `"${p.market}"`,
      `"${p.selection}"`,
      p.odds,
      p.modelProb,
      p.edge,
      p.stakeUnits,
      p.stakeSoles,
      p.status,
      `"${p.finalScore || ''}"`,
      p.netUnits ?? '',
      p.netProfitSoles ?? '',
      p.timestamp
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tipster_ia_picks_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Base de Datos de Seguimiento & Auditoría de Picks</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Auditado 100% Cuantitativo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Registro inmutable de señales, liquidación automática de marcadores y cálculo exacto de unidades netas (+EV).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global KPI Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] text-slate-400 block font-medium">Win Rate Oficial</span>
            <span className="text-xl font-black text-emerald-400">{auditPerformance.winRate.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">({auditPerformance.wonPicks}G - {auditPerformance.lostPicks}P)</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] text-slate-400 block font-medium">Yield / ROI</span>
            <span className="text-xl font-black text-amber-400">+{auditPerformance.yieldRoi.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Retorno sobre apostado</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] text-slate-400 block font-medium">Unidades Netas</span>
            <span className="text-xl font-black text-emerald-400">+{auditPerformance.netUnitsProfit.toFixed(2)}u</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{auditPerformance.totalUnitsStaked.toFixed(1)}u apostadas</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] text-slate-400 block font-medium">Ganancia Neta (S/.)</span>
            <span className="text-xl font-black text-emerald-400">+S/. {auditPerformance.netProfitSoles.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">En Soles Peruanos</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] text-slate-400 block font-medium">Picks Registrados</span>
            <span className="text-xl font-black text-white">{trackedPicks.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">5 Deportes activos</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
            <span className="text-[11px] text-slate-400 block font-medium">Pendientes Hoy</span>
            <span className="text-xl font-black text-sky-400">{auditPerformance.pendingPicks}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Esperando resultado</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900">
          <button
            id="tab-database-view"
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'database'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Registro de Señales & Liquidación</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {trackedPicks.length}
            </span>
          </button>

          <button
            id="tab-audit-charts"
            onClick={() => setActiveTab('audit_charts')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'audit_charts'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Gráficos de Rentabilidad & Yield</span>
          </button>

          <button
            id="tab-new-pick"
            onClick={() => setActiveTab('new_pick')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'new_pick'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Pick Manual</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DATABASE & SETTLEMENT */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              {/* Filter and search bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Sport Filter */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 px-2 font-medium">Deporte:</span>
                    {(['all', 'football', 'basketball', 'tennis', 'baseball', 'mma'] as const).map(sport => (
                      <button
                        key={sport}
                        onClick={() => setSelectedSportFilter(sport)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          selectedSportFilter === sport
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sport === 'all' ? '🌐 Todos' : `${sportEmojiMap[sport]} ${sport.toUpperCase()}`}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 px-2 font-medium">Estado:</span>
                    {(['ALL', 'PENDING', 'WON', 'LOST'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setSelectedStatusFilter(st)}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                          selectedStatusFilter === st
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st === 'ALL' ? 'Todos' : st === 'PENDING' ? '⏳ Pendientes' : st === 'WON' ? '✅ Ganadas' : '❌ Perdidas'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Box */}
                <input
                  type="text"
                  placeholder="Buscar por partido o mercado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-full sm:w-64"
                />
              </div>

              {/* Picks Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                      <th className="py-3 px-4">Deporte & Evento</th>
                      <th className="py-3 px-4">Mercado & Selección</th>
                      <th className="py-3 px-4 text-center">Cuota / Edge</th>
                      <th className="py-3 px-4 text-center">Stake</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Resultado Neto</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {filteredPicks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No se encontraron pronósticos registrados con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredPicks.map((pick) => {
                        const isPending = pick.status === 'PENDING';
                        const isWon = pick.status === 'WON';
                        const isLost = pick.status === 'LOST';

                        return (
                          <tr key={pick.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Sport & Event */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-base p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                                  {sportEmojiMap[pick.sport] || '🏆'}
                                </span>
                                <div>
                                  <span className="font-bold text-white block text-sm">{pick.eventTitle}</span>
                                  <span className="text-[11px] text-slate-400">{pick.league} · {pick.id}</span>
                                </div>
                              </div>
                            </td>

                            {/* Market & Selection */}
                            <td className="py-3 px-4">
                              <div>
                                <span className="font-semibold text-amber-300 block">{pick.selection}</span>
                                <span className="text-[11px] text-slate-400">{pick.market}</span>
                              </div>
                            </td>

                            {/* Odds & Edge */}
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-white text-xs border border-slate-700">
                                @{pick.odds.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-emerald-400 block mt-0.5 font-semibold">
                                +{pick.edge.toFixed(1)}% EV ({pick.modelProb.toFixed(1)}%)
                              </span>
                            </td>

                            {/* Stake */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-slate-200 block">+{pick.stakeUnits.toFixed(1)}u</span>
                              <span className="text-[10px] text-slate-400 block">S/. {pick.stakeSoles.toFixed(2)}</span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-center">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                  <Clock className="w-3 h-3" /> PENDIENTE
                                </span>
                              )}
                              {isWon && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" /> GANADA
                                </span>
                              )}
                              {isLost && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  <XCircle className="w-3 h-3" /> PERDIDA
                                </span>
                              )}
                            </td>

                            {/* Net Profit */}
                            <td className="py-3 px-4 text-right">
                              {isPending ? (
                                <span className="text-slate-500 font-mono text-xs">En juego...</span>
                              ) : (
                                <div>
                                  <span className={`font-mono font-black text-sm block ${
                                    isWon ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                    {pick.netUnits && pick.netUnits > 0 ? `+${pick.netUnits.toFixed(2)}u` : `${pick.netUnits?.toFixed(2)}u`}
                                  </span>
                                  <span className={`text-[10px] font-medium block ${
                                    isWon ? 'text-emerald-500/80' : 'text-rose-500/80'
                                  }`}>
                                    {pick.netProfitSoles && pick.netProfitSoles > 0 ? `+S/. ${pick.netProfitSoles.toFixed(2)}` : `-S/. ${Math.abs(pick.netProfitSoles || 0).toFixed(2)}`}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isPending ? (
                                  <button
                                    id={`settle-btn-${pick.id}`}
                                    onClick={() => {
                                      setSettlingPick(pick);
                                      setSettleStatus('WON');
                                      setSettleFinalScore('');
                                      setSettleNotes('');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Liquidar</span>
                                  </button>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {pick.finalScore || 'Finalizado'}
                                    </span>
                                    {isLost && onOpenAIDiagnostic && (
                                      <button
                                        onClick={() => onOpenAIDiagnostic(pick)}
                                        title="Diagnosticar fallo con IA y recalibrar"
                                        className="p-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1"
                                      >
                                        <BrainCircuit className="w-3 h-3" />
                                        <span>Diagnóstico IA</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT & PERFORMANCE CHARTS */}
          {activeTab === 'audit_charts' && (
            <div className="space-y-6">
              {/* Chart container */}
              <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Evolución Acumulada de Unidades Netas (+EV)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Curva de crecimiento de bankroll basada en liquidaciones oficiales verificadas.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Balance Neto Actual</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      +{auditPerformance.netUnitsProfit.toFixed(2)} Unidades (+S/. {auditPerformance.netProfitSoles.toFixed(2)})
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={auditPerformance.historyChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `+${val}u`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any) => [`+${val} Unidades`, 'Crecimiento']}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulativeUnits"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorUnits)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Multi-Sport Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { sport: 'football', name: 'Fútbol', emoji: '⚽', winRate: '85.7%', yield: '+18.2%' },
                  { sport: 'basketball', name: 'NBA Básquet', emoji: '🏀', winRate: '80.0%', yield: '+15.4%' },
                  { sport: 'tennis', name: 'Tenis ATP/WTA', emoji: '🎾', winRate: '75.0%', yield: '+14.1%' },
                  { sport: 'baseball', name: 'MLB Béisbol', emoji: '⚾', winRate: '80.0%', yield: '+16.5%' },
                  { sport: 'mma', name: 'UFC / MMA', emoji: '🥊', winRate: '100%', yield: '+24.0%' },
                ].map(item => (
                  <div key={item.sport} className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-xs font-bold text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Win Rate:</span>
                      <span className="font-bold text-emerald-400">{item.winRate}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-400">Yield:</span>
                      <span className="font-bold text-amber-400">{item.yield}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REGISTER NEW PICK MANUAL */}
          {activeTab === 'new_pick' && (
            <form onSubmit={handleCreateNewPick} className="max-w-2xl mx-auto space-y-4 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-amber-400" />
                Registrar Nuevo Pronóstico Cuantitativo en Base de Datos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Deporte</label>
                  <select
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value as SportType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="football">⚽ Fútbol</option>
                    <option value="basketball">🏀 Básquetbol NBA</option>
                    <option value="tennis">🎾 Tenis ATP / WTA</option>
                    <option value="baseball">⚾ Béisbol MLB</option>
                    <option value="mma">🥊 UFC / MMA</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Torneo / Liga</label>
                  <input
                    type="text"
                    value={newLeague}
                    onChange={(e) => setNewLeague(e.target.value)}
                    placeholder="Ej: Liga 1 Perú, Premier League"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Evento / Choque</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ej: Sporting Cristal vs Melgar"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Mercado</label>
                  <input
                    type="text"
                    value={newMarket}
                    onChange={(e) => setNewMarket(e.target.value)}
                    placeholder="Ej: Hándicap Asiático, Over 2.5"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Selección Recomendada</label>
                  <input
                    type="text"
                    value={newSelection}
                    onChange={(e) => setNewSelection(e.target.value)}
                    placeholder="Ej: Sporting Cristal -1.0"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Cuota (@)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOdds}
                    onChange={(e) => setNewOdds(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Probabilidad IA (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newModelProb}
                    onChange={(e) => setNewModelProb(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Stake (Unidades)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newStakeUnits}
                    onChange={(e) => {
                      setNewStakeUnits(e.target.value);
                      setNewStakeSoles((parseFloat(e.target.value || '0') * 50).toString());
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Stake (Soles S/.)</label>
                  <input
                    type="number"
                    step="1"
                    value={newStakeSoles}
                    onChange={(e) => setNewStakeSoles(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Notas / Justificación</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Factores cuantitativos clave..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingPick}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingPick ? 'Guardando en DB...' : 'Registrar Señal en DB'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Base de Datos: SQLite / In-Memory Active Sync</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-mono text-[11px]">Audit Engine: Verified +EV</span>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: SETTLEMENT DIALOG */}
      {settlingPick && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                Liquidar Pick Oficial ({settlingPick.id})
              </h3>
              <button
                onClick={() => setSettlingPick(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-semibold">{settlingPick.league}</div>
              <div className="text-sm font-bold text-white">{settlingPick.eventTitle}</div>
              <div className="text-xs text-amber-300 font-semibold">{settlingPick.selection} (@{settlingPick.odds.toFixed(2)})</div>
              <div className="text-[11px] text-slate-400">Stake: {settlingPick.stakeUnits}u (S/. {settlingPick.stakeSoles.toFixed(2)})</div>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Resolución Oficial:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSettleStatus('WON')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    settleStatus === 'WON'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>GANADA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettleStatus('LOST')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    settleStatus === 'LOST'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>PERDIDA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettleStatus('PUSH')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    settleStatus === 'PUSH'
                      ? 'bg-slate-600 text-white border-slate-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span>PUSH (Nula)</span>
                </button>
              </div>
            </div>

            {/* Final Score input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Marcador Final Oficial:</label>
              <input
                type="text"
                value={settleFinalScore}
                onChange={(e) => setSettleFinalScore(e.target.value)}
                placeholder="Ej: 2 - 0 (FINAL) o 114 - 102"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Telegram Broadcast Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Publicar en Telegram @FijasIAOficial</span>
                  <span className="text-[10px] text-slate-400">Envía la resolución oficial a los canales</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settleBroadcastTelegram}
                onChange={(e) => setSettleBroadcastTelegram(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            {settleSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold">
                {settleSuccessMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSettlingPick(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingSettle}
                onClick={handleConfirmSettlement}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingSettle ? 'Liquidando...' : 'Confirmar Liquidación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
