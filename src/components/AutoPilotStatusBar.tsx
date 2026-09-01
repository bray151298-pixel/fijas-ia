import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Clock, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  ChevronRight, 
  RefreshCw, 
  ShieldCheck, 
  BellRing, 
  TrendingUp, 
  AlertCircle,
  Play,
  Calendar,
  X,
  Sliders
} from 'lucide-react';
import { AutoPilotState, AutoPilotTriggerType } from '../types';

interface AutoPilotStatusBarProps {
  autoPilot: AutoPilotState;
  onToggleAutoPilot: () => void;
  onOpenSchedulerModal: () => void;
  onTriggerManualRun: (type: AutoPilotTriggerType) => void;
  onOpenMasterCycleModal?: () => void;
  onOpenLiveScannerModal?: () => void;
}

export const AutoPilotStatusBar: React.FC<AutoPilotStatusBarProps> = ({
  autoPilot,
  onToggleAutoPilot,
  onOpenSchedulerModal,
  onTriggerManualRun,
  onOpenMasterCycleModal,
  onOpenLiveScannerModal
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <div 
      id="autopilot-status-bar"
      className={`w-full transition-all duration-300 border-b backdrop-blur-lg ${
        autoPilot.isEnabled 
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-[#0A0F1D] border-emerald-500/30' 
          : 'bg-slate-900/60 border-slate-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Section: Master Switch + Status Indicator */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <button
              id="master-autopilot-toggle-btn"
              onClick={onToggleAutoPilot}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 ${
                autoPilot.isEnabled
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
              title={autoPilot.isEnabled ? 'Pausar Piloto Automático' : 'Activar Piloto Automático 24/7'}
            >
              <div className="relative flex items-center justify-center">
                <Bot className={`w-4 h-4 ${autoPilot.isEnabled ? 'text-black animate-pulse' : 'text-slate-500'}`} />
                {autoPilot.isEnabled && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-black animate-ping" />
                )}
              </div>
              <span className="tracking-wide">
                {autoPilot.isEnabled ? '🟢 PILOTO AUTOMÁTICO ACTIVO' : '⚪ PILOTO AUTOMÁTICO PAUSADO'}
              </span>
            </button>

            {onOpenMasterCycleModal && (
              <button
                onClick={onOpenMasterCycleModal}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition-all"
                title="Abrir Ciclo Maestro de 4 Etapas"
              >
                <RefreshCw className="w-3 h-3 text-amber-400" />
                <span>Ciclo Maestro (4 Etapas)</span>
              </button>
            )}

            {onOpenLiveScannerModal && (
              <button
                onClick={onOpenLiveScannerModal}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all"
                title="Abrir Escáner en Vivo (+EV Live > 12%), Análisis Continuo y Combinada de Oro VIP"
              >
                <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                <span>Escáner Live (+EV &gt; 12%) & VIP</span>
              </button>
            )}

            {autoPilot.isEnabled && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>24/7 Telegram Sync</span>
              </span>
            )}
          </div>

          <button
            onClick={onOpenSchedulerModal}
            className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] border border-slate-700"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ajustes</span>
          </button>
        </div>

        {/* Center Section: Real-time Metric Indicators */}
        <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-4 text-slate-300 text-[11px] font-medium w-full md:w-auto">
          {/* 1. Next Scan Countdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800/80">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Próximo escaneo automático en:</span>
            <strong className="text-amber-300 font-extrabold">{autoPilot.nextScanMinutes} min</strong>
          </div>

          {/* 2. Last Telegram Pick Sent */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800/80">
            <Send className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Último pronóstico enviado a Telegram:</span>
            <strong className="text-rose-300 font-extrabold">{autoPilot.lastTelegramSentTime}</strong>
          </div>

          {/* 3. Active Matches Tracking */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800/80">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Partidos en seguimiento activo:</span>
            <strong className="text-emerald-400 font-extrabold">{autoPilot.activeTrackingMatchesCount}</strong>
          </div>
        </div>

        {/* Right Section: Configuration & Quick Manual Trigger */}
        <div className="hidden md:flex items-center gap-2">
          <button
            id="open-autopilot-scheduler-modal-btn"
            onClick={onOpenSchedulerModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all hover:border-emerald-500/40"
            title="Ver los 3 disparadores automáticos (09:00 AM, Post-Partido, 23:00 PM)"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver Disparadores (3)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
