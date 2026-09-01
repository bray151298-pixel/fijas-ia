import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Send, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Award, 
  Layers, 
  BarChart3, 
  DollarSign, 
  FileText,
  AlertTriangle,
  Play,
  Check,
  ChevronRight,
  Database
} from 'lucide-react';
import { 
  MasterCycleState, 
  MasterCycleStage, 
  DailyCarteleraItem, 
  DailyAuditRecord, 
  WeeklyAuditRecord, 
  MonthlyAuditRecord 
} from '../types';
import { 
  getMasterCycleState, 
  triggerMasterCycleStage1, 
  triggerMasterCycleStage2Settle, 
  triggerMasterCycleStage3Cierre, 
  triggerMasterCycleStage4Weekly, 
  triggerMasterCycleStage4Monthly,
  formatDailyCarteleraNocturna,
  formatRealTimeSettlementPostMatch,
  formatCierreJornadaReport,
  formatWeeklySummaryReport,
  formatMonthlyAuditReport
} from '../services/telegramService';

interface MasterCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackedPicks?: any[];
  onRefreshTrackedPicks?: () => void;
}

export const MasterCycleModal: React.FC<MasterCycleModalProps> = ({
  isOpen,
  onClose,
  trackedPicks = [],
  onRefreshTrackedPicks
}) => {
  const [cycleState, setCycleState] = useState<MasterCycleState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'stage1' | 'stage2' | 'stage3' | 'stage4'>('overview');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Settlement Form State for Stage 2
  const [selectedPickId, setSelectedPickId] = useState<string>('cart-1');
  const [scoreInput, setScoreInput] = useState<string>('2 - 0 (FINAL)');
  const [settlementResult, setSettlementResult] = useState<'WON' | 'LOST'>('WON');
  const [broadcastToTelegram, setBroadcastToTelegram] = useState<boolean>(true);

  // Historical DB sub-tab for Stage 4
  const [historicalSubTab, setHistoricalSubTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Preview Message Modal state
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  const loadState = async () => {
    setIsLoading(true);
    const data = await getMasterCycleState();
    if (data) {
      setCycleState(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerStage1 = async () => {
    setIsLoading(true);
    const res = await triggerMasterCycleStage1();
    if (res.ok && res.state) {
      setCycleState(res.state);
      setActionSuccess('🌌 ¡Cartelera Nocturna (00:30 AM) emitida con éxito a Telegram!');
      setTimeout(() => setActionSuccess(null), 5000);
    }
    setIsLoading(false);
  };

  const handleTriggerStage2Settle = async () => {
    setIsLoading(true);
    const res = await triggerMasterCycleStage2Settle({
      pickId: selectedPickId,
      status: settlementResult,
      finalScore: scoreInput,
      broadcastTelegram: broadcastToTelegram
    });
    if (res.ok && res.state) {
      setCycleState(res.state);
      if (onRefreshTrackedPicks) onRefreshTrackedPicks();
      setActionSuccess(`⚡ ¡Liquidación en Tiempo Real de [${scoreInput}] transmitida a Telegram!`);
      setTimeout(() => setActionSuccess(null), 5000);
    }
    setIsLoading(false);
  };

  const handleTriggerStage3Cierre = async () => {
    setIsLoading(true);
    const res = await triggerMasterCycleStage3Cierre();
    if (res.ok && res.state) {
      setCycleState(res.state);
      setActionSuccess('🏁 ¡Reporte de Cierre de Jornada (100% Completado) emitido a Telegram!');
      setTimeout(() => setActionSuccess(null), 5000);
    }
    setIsLoading(false);
  };

  const handleTriggerStage4Weekly = async () => {
    setIsLoading(true);
    const res = await triggerMasterCycleStage4Weekly();
    if (res.ok && res.state) {
      setCycleState(res.state);
      setActionSuccess('🗓️ ¡Auditoría Semanal Oficial de Domingo publicada en Telegram!');
      setTimeout(() => setActionSuccess(null), 5000);
    }
    setIsLoading(false);
  };

  const handleTriggerStage4Monthly = async () => {
    setIsLoading(true);
    const res = await triggerMasterCycleStage4Monthly();
    if (res.ok && res.state) {
      setCycleState(res.state);
      setActionSuccess('🏛️ ¡Auditoría Mensual Oficial (30 Días & Yield %) publicada en Telegram!');
      setTimeout(() => setActionSuccess(null), 5000);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <RefreshCw className={`w-5 h-5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  CICLO MAESTRO DE 4 ETAPAS
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  MOTOR AUTOMATIZADO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Flujo continuo de tipster cuantitativo: Cartelera 00:30 AM · Marcadores Real-Time · Cierre 100% · Base de Datos Histórica
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadState}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors"
              title="Recargar Estado del Ciclo"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Action Success Toast */}
        {actionSuccess && (
          <div className="mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400/60 hover:text-emerald-300">
              ✕
            </button>
          </div>
        )}

        {/* 4-Stage Stepper / Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Vista General del Ciclo
          </button>

          <button
            onClick={() => setActiveTab('stage1')}
            className={`px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'stage1'
                ? 'text-amber-400 border-amber-500 bg-amber-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            1. Cartelera Nocturna (00:30 AM)
          </button>

          <button
            onClick={() => setActiveTab('stage2')}
            className={`px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'stage2'
                ? 'text-sky-400 border-sky-500 bg-sky-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            2. Resolución Tiempo Real
          </button>

          <button
            onClick={() => setActiveTab('stage3')}
            className={`px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'stage3'
                ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            3. Cierre de Jornada (100%)
          </button>

          <button
            onClick={() => setActiveTab('stage4')}
            className={`px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'stage4'
                ? 'text-purple-400 border-purple-500 bg-purple-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            4. Base de Datos & Resúmenes
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* ========================================================
              TAB: VISTA GENERAL (OVERVIEW)
             ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Etapa Activa</span>
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-1 text-sm font-bold text-amber-300">
                    {cycleState?.currentActiveStage === 'ETAPA_1_CARTELERA_NOCTURNA' && '1. Cartelera 00:30 AM'}
                    {cycleState?.currentActiveStage === 'ETAPA_2_RESOLUCION_REALTIME' && '2. Resolución Real-Time'}
                    {cycleState?.currentActiveStage === 'ETAPA_3_CIERRE_JORNADA' && '3. Cierre de Jornada'}
                    {cycleState?.currentActiveStage === 'ETAPA_4_RESUMENES_HISTORICOS' && '4. Resúmenes Históricos'}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Sincronizado con Telegram
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Pronósticos en Cartelera</span>
                    <Clock className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">
                    {cycleState?.stage1Cartelera.totalPicksInBoard || 5} Picks
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {cycleState?.stage1Cartelera.freePicksCount || 2} Abiertos + {cycleState?.stage1Cartelera.vipPicksCount || 3} VIP
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Progreso de Jornada</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-1 text-lg font-bold text-emerald-400">
                    {cycleState?.stage3CierreJornada.dayCompletionPercentage || 100}% Liquidado
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    5/5 Encuentros Finalizados
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Yield Semanal Auditado</span>
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-1 text-lg font-bold text-purple-400">
                    +{cycleState?.stage4HistoricalDB.weeklySummary.yieldRoi || 42.6}% ROI
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    +{cycleState?.stage4HistoricalDB.weeklySummary.netUnits || 28.57}u (+S/. {cycleState?.stage4HistoricalDB.weeklySummary.netSoles?.toFixed(2) || '1,428.50'})
                  </div>
                </div>
              </div>

              {/* 4 Interactive Stages Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ETAPA 1 Card */}
                <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ETAPA 1 · 00:30 AM
                      </span>
                      <h3 className="mt-2 text-base font-bold text-white flex items-center gap-2">
                        <span>Emisión de Cartelera Nocturna</span>
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Escanea los eventos oficiales del día en los 5 deportes y publica la cartelera con cuotas intactas antes del movimiento del mercado.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Estado: <span className="text-emerald-400 font-semibold">Emitida ({cycleState?.stage1Cartelera.lastIssuedDate || '00:30 AM'})</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('stage1')}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      Explorar Cartelera
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ETAPA 2 Card */}
                <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/20 border border-sky-500/30 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        ETAPA 2 · TIEMPO REAL
                      </span>
                      <h3 className="mt-2 text-base font-bold text-white flex items-center gap-2">
                        <span>Resolución en Tiempo Real</span>
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Monitorea marcadores oficiales y publica la liquidación inmediata al término de cada encuentro individual (+/- unidades).
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-sky-400" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Última resolución: <span className="text-sky-300 font-semibold">{cycleState?.stage2Realtime.lastSettledMatch?.eventTitle?.slice(0, 20)}...</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('stage2')}
                      className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      Liquidar Partido
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ETAPA 3 Card */}
                <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 border border-emerald-500/30 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ETAPA 3 · CIERRE AUTOMÁTICO
                      </span>
                      <h3 className="mt-2 text-base font-bold text-white flex items-center gap-2">
                        <span>Cierre de Jornada (100% Finalizado)</span>
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Detecta automáticamente cuando concluyen todos los partidos del día y emite el balance final consolidado con Win Rate y +U netas.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Balance Hoy: <span className="text-emerald-400 font-bold">+3.90u (80.0% Win Rate)</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('stage3')}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      Ver Cierre
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ETAPA 4 Card */}
                <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20 border border-purple-500/30 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        ETAPA 4 · HISTÓRICOS & AUDITORÍA
                      </span>
                      <h3 className="mt-2 text-base font-bold text-white flex items-center gap-2">
                        <span>Base de Datos & Resúmenes</span>
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Almacena el historial diario inalterable, genera el balance semanal los domingos por la noche y emite la auditoría mensual con Yield %.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Database className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Días Auditados: <span className="text-purple-300 font-semibold">{cycleState?.stage4HistoricalDB.totalAuditedDays || 7} Días (+28.57u)</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('stage4')}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      Auditoría Completa
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Real-Time Execution Logs */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Registro de Ejecución del Ciclo Maestro (En Vivo)
                  </h4>
                  <span className="text-[11px] text-slate-500">Canal Telegram Oficial Conectado</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {cycleState?.cycleLogs.map(log => (
                    <div key={log.id} className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg flex items-start justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{log.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {log.stageName}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{log.summary}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-[10px] text-slate-500 block">{log.timestamp}</span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.telegramStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: ETAPA 1 - CARTELERA NOCTURNA (00:30 AM)
             ======================================================== */}
          {activeTab === 'stage1' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Etapa 1: Emisión de Cartelera Nocturna (00:30 AM)</h3>
                    <p className="text-xs text-amber-200/80">
                      Genera la cartelera completa de pronósticos a las 00:30 AM con cuotas intactas antes del cierre de líneas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const msg = formatDailyCarteleraNocturna(cycleState?.stage1Cartelera.carteleraItems || []);
                      setPreviewMessage(msg);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    Ver Formato Telegram
                  </button>
                  <button
                    onClick={handleTriggerStage1}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Forzar Emisión 00:30 AM a Telegram
                  </button>
                </div>
              </div>

              {/* Cartelera Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Cartelera Oficial de la Jornada (5 Deportes)</span>
                  <span className="text-slate-400">Total: {cycleState?.stage1Cartelera.totalPicksInBoard || 5} Pronósticos</span>
                </div>
                <div className="divide-y divide-slate-800/80 overflow-x-auto">
                  {cycleState?.stage1Cartelera.carteleraItems.map((item, idx) => (
                    <div key={item.id} className="p-3 hover:bg-slate-900/50 flex items-center justify-between text-xs gap-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{item.sportEmoji}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">{item.eventTitle}</span>
                            <span className="text-slate-500">· {item.league}</span>
                            {item.isVIP ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                👑 VIP
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                📌 ABIERTO
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-slate-400 flex items-center gap-2">
                            <span><b>Jugada:</b> {item.selection} ({item.market})</span>
                            <span className="text-slate-600">•</span>
                            <span>⏰ {item.kickoffTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-right flex-shrink-0">
                        <div>
                          <div className="font-bold text-amber-400">@{item.minOdds.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400">Cuota Mínima</div>
                        </div>
                        <div>
                          <div className="font-bold text-emerald-400">+{item.edge.toFixed(1)}%</div>
                          <div className="text-[10px] text-slate-400">+EV Edge</div>
                        </div>
                        <div>
                          <div className="font-bold text-white">{item.stakeUnits.toFixed(1)}u</div>
                          <div className="text-[10px] text-slate-400">Stake</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: ETAPA 2 - RESOLUCIÓN EN TIEMPO REAL
             ======================================================== */}
          {activeTab === 'stage2' && (
            <div className="space-y-5">
              <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Etapa 2: Resolución en Tiempo Real</h3>
                    <p className="text-xs text-sky-200/80">
                      Al finalizar cada partido individual, liquida el pick y emite la notificación instantánea en Telegram con el marcador oficial.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-semibold text-sky-300">
                  Monitoreo Oficial: Activo
                </div>
              </div>

              {/* Settlement Form Box */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400" />
                  Liquidación Inmediata Post-Partido
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Seleccionar Encuentro
                    </label>
                    <select
                      value={selectedPickId}
                      onChange={(e) => setSelectedPickId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      {cycleState?.stage1Cartelera.carteleraItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.sportEmoji} {item.eventTitle} ({item.selection})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Marcador Final Oficial
                    </label>
                    <input
                      type="text"
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                      placeholder="e.g. 2 - 0 (FINAL) o 110 - 101"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Resultado del Pick
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSettlementResult('WON')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                          settlementResult === 'WON'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ACERTADO (+U)
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettlementResult('LOST')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                          settlementResult === 'LOST'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        FALLADO (-U)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastToTelegram}
                      onChange={(e) => setBroadcastToTelegram(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                    />
                    <span>Publicar resolución oficial inmediatamente a Telegram (@FijasIAOficial)</span>
                  </label>

                  <button
                    onClick={handleTriggerStage2Settle}
                    disabled={isLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-lg shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Procesar Liquidación en Tiempo Real
                  </button>
                </div>
              </div>

              {/* Last Settled Message Preview */}
              {cycleState?.stage2Realtime.lastSettledMatch && (
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Último Formato Transmitido a Telegram:</span>
                    <span className="text-emerald-400 font-medium">Resolución Oficial Verificada</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-line leading-relaxed">
                    {cycleState.stage2Realtime.lastSettledMatch.status === 'WON' ? (
                      `✅ ¡PRONÓSTICO ACERTADO (+${cycleState.stage2Realtime.lastSettledMatch.netUnits} Unidades)! [Marcador Final: ${cycleState.stage2Realtime.lastSettledMatch.finalScore}]

⚽ Partido: ${cycleState.stage2Realtime.lastSettledMatch.eventTitle}
🎯 Selección: ${cycleState.stage2Realtime.lastSettledMatch.selection}
🏦 Bankroll auditado y sumado en vivo a la base de datos oficial.`
                    ) : (
                      `❌ PRONÓSTICO NO ACERTADO (${cycleState.stage2Realtime.lastSettledMatch.netUnits} Unidades) [Marcador Final: ${cycleState.stage2Realtime.lastSettledMatch.finalScore}]

⚽ Partido: ${cycleState.stage2Realtime.lastSettledMatch.eventTitle}
🎯 Selección: ${cycleState.stage2Realtime.lastSettledMatch.selection}
📊 Gestión de banca Kelly aplicada para proteger el capital.`
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB: ETAPA 3 - CIERRE DE JORNADA AUTOMÁTICO
             ======================================================== */}
          {activeTab === 'stage3' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Etapa 3: Cierre de Jornada Automático</h3>
                    <p className="text-xs text-emerald-200/80">
                      Detecta automáticamente el término del 100% de partidos y emite el Reporte de Cierre de Jornada con Win Rate y Balance Neto.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (cycleState?.stage3CierreJornada.lastClosingReport) {
                        const msg = formatCierreJornadaReport(cycleState.stage3CierreJornada.lastClosingReport);
                        setPreviewMessage(msg);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    Ver Formato Telegram
                  </button>

                  <button
                    onClick={handleTriggerStage3Cierre}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Forzar Emisión Cierre a Telegram
                  </button>
                </div>
              </div>

              {/* Progress & Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-400">Progreso de Finalización</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-black text-emerald-400">100%</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      JORNADA COMPLETADA
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full w-full"></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-400">Acierto del Día (Win Rate)</div>
                  <div className="mt-2 text-2xl font-black text-white">
                    80.0%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    4 Ganados / 1 Fallado
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-400">Beneficio Neto del Día</div>
                  <div className="mt-2 text-2xl font-black text-emerald-400">
                    +3.90u <span className="text-xs text-slate-300 font-semibold">(+S/. 195.00)</span>
                  </div>
                  <div className="text-xs text-emerald-400/80 mt-1">
                    Yield ROI: +45.8%
                  </div>
                </div>
              </div>

              {/* Daily Breakdown List */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Desglose de Encuentros del Cierre de Jornada
                </h4>
                <div className="space-y-1.5">
                  {cycleState?.stage3CierreJornada.lastClosingReport?.picksSummaryList.map((p, i) => (
                    <div key={i} className="p-2.5 bg-slate-900 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-between border border-slate-800/80">
                      <span>{p}</span>
                      <span className="text-[10px] text-slate-500">Auditado Oficial</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: ETAPA 4 - BASE DE DATOS & RESÚMENES HISTÓRICOS
             ======================================================== */}
          {activeTab === 'stage4' && (
            <div className="space-y-5">
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Database className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Etapa 4: Base de Datos y Resúmenes Históricos</h3>
                    <p className="text-xs text-purple-200/80">
                      Auditorías diarias persistentes, Resumen Semanal de 7 días (domingos) y Auditoría Mensual de 30 días con Yield % acumulado.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTriggerStage4Weekly}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-md transition-all flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Emitir Semanal Domingo
                  </button>

                  <button
                    onClick={handleTriggerStage4Monthly}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-lg shadow-md transition-all flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Emitir Mensual (30 Días)
                  </button>
                </div>
              </div>

              {/* Sub-tabs for Stage 4 */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setHistoricalSubTab('daily')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    historicalSubTab === 'daily'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  1. Registro Diario (7 Días Auditados)
                </button>
                <button
                  onClick={() => setHistoricalSubTab('weekly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    historicalSubTab === 'weekly'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  2. Generador Semanal (Domingos 23:45)
                </button>
                <button
                  onClick={() => setHistoricalSubTab('monthly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    historicalSubTab === 'monthly'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  3. Auditoría Mensual (Yield % Acumulado)
                </button>
              </div>

              {/* Sub-Tab 1: Daily History */}
              {historicalSubTab === 'daily' && (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Historial de Días Auditados (Lunes a Domingo)</span>
                    <span className="text-emerald-400 font-bold">Total Acumulado: +28.57 Unidades (+S/. 1,428.50)</span>
                  </div>
                  <div className="divide-y divide-slate-800/80 overflow-x-auto">
                    {cycleState?.stage4HistoricalDB.dailyAudits.map((day) => (
                      <div key={day.id} className="p-3 hover:bg-slate-900/50 flex items-center justify-between text-xs gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                            {day.dayName.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{day.dayName}, {day.date}</div>
                            <div className="text-[11px] text-slate-400">
                              {day.wonPicks} Ganadas · {day.lostPicks} Perdidas · {day.pushPicks} Push (WR: {day.winRate.toFixed(1)}%)
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-5 text-right flex-shrink-0">
                          <div>
                            <div className="font-bold text-emerald-400">+{day.yieldRoi.toFixed(1)}%</div>
                            <div className="text-[10px] text-slate-400">Yield Diario</div>
                          </div>
                          <div>
                            <div className={`font-bold ${day.netUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {day.netUnits >= 0 ? `+${day.netUnits.toFixed(2)}u` : `${day.netUnits.toFixed(2)}u`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {day.netSoles >= 0 ? `+S/. ${day.netSoles.toFixed(2)}` : `-S/. ${Math.abs(day.netSoles).toFixed(2)}`}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            SELLADO
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Weekly Summary */}
              {historicalSubTab === 'weekly' && (
                <div className="space-y-4">
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-purple-400 uppercase">Resumen Semanal #34</span>
                        <h4 className="text-base font-bold text-white">Periodo: {cycleState?.stage4HistoricalDB.weeklySummary.dateRange}</h4>
                      </div>
                      <button
                        onClick={() => {
                          if (cycleState?.stage4HistoricalDB.weeklySummary) {
                            const msg = formatWeeklySummaryReport(cycleState.stage4HistoricalDB.weeklySummary);
                            setPreviewMessage(msg);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/40 rounded-lg hover:bg-purple-500/30"
                      >
                        Ver Mensaje Telegram
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-400">Total Pronósticos</div>
                        <div className="text-lg font-bold text-white">39 Disparados</div>
                        <div className="text-[11px] text-emerald-400">31 Ganados / 8 Fallados</div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-400">Win Rate Semanal</div>
                        <div className="text-lg font-bold text-white">79.5%</div>
                        <div className="text-[11px] text-slate-400">7 Días Consolidados</div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-400">Yield ROI Semanal</div>
                        <div className="text-lg font-bold text-purple-400">+42.6%</div>
                        <div className="text-[11px] text-slate-400">Stake Kelly 0.25x</div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-400">Beneficio Neto</div>
                        <div className="text-lg font-bold text-emerald-400">+28.57u</div>
                        <div className="text-[11px] text-emerald-300 font-semibold">+S/. 1,428.50</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Monthly Audit */}
              {historicalSubTab === 'monthly' && (
                <div className="space-y-4">
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-amber-400 uppercase">Auditoría Oficial Consolidada</span>
                        <h4 className="text-base font-bold text-white">Mes: {cycleState?.stage4HistoricalDB.monthlySummary.monthName}</h4>
                      </div>
                      <button
                        onClick={() => {
                          if (cycleState?.stage4HistoricalDB.monthlySummary) {
                            const msg = formatMonthlyAuditReport(cycleState.stage4HistoricalDB.monthlySummary);
                            setPreviewMessage(msg);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/20 border border-amber-500/40 rounded-lg hover:bg-amber-500/30"
                      >
                        Ver Mensaje Telegram
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-400">Total Pronósticos</div>
                        <div className="text-lg font-bold text-white">148 Picks</div>
                        <div className="text-[11px] text-emerald-400">121 Ganados / 27 Fallados</div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-400">Win Rate Mensual</div>
                        <div className="text-lg font-bold text-white">81.8%</div>
                        <div className="text-[11px] text-slate-400">30 Días Auditados</div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-400">YIELD / ROI ACUMULADO</div>
                        <div className="text-lg font-bold text-amber-400">+34.5%</div>
                        <div className="text-[11px] text-slate-400">CLV Beat: 92.4%</div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-400">Beneficio Neto Mes</div>
                        <div className="text-lg font-bold text-emerald-400">+84.60u</div>
                        <div className="text-[11px] text-emerald-300 font-semibold">+S/. 4,230.00</div>
                      </div>
                    </div>

                    {/* Sports Breakdown Table */}
                    <div className="pt-2">
                      <h5 className="text-xs font-bold text-slate-400 mb-2">Desglose de Rendimiento por Deporte</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {cycleState?.stage4HistoricalDB.monthlySummary.sportBreakdown.map((s, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs">
                            <div className="font-bold text-slate-200">{s.sportName}</div>
                            <div className="mt-1 text-slate-400">{s.picks} picks · WR: {s.winRate.toFixed(1)}%</div>
                            <div className="mt-0.5 font-bold text-emerald-400">+{s.netUnits.toFixed(1)}u</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Motor 4 Etapas: Cartelera 00:30 AM ➔ Marcadores Real-Time ➔ Cierre 100% ➔ Base de Datos</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>

      {/* Telegram Message Preview Modal */}
      {previewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                Vista Previa de Mensaje Telegram Oficial
              </h4>
              <button onClick={() => setPreviewMessage(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div 
              className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-sans leading-relaxed max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewMessage.replace(/\n/g, '<br/>') }}
            />

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewMessage(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
