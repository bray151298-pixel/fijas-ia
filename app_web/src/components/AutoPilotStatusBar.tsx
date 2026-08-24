import React, { useState } from 'react';
import { 
  Bot, 
  Clock, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  ChevronRight, 
  RefreshCw, 
  Send,
  Sliders,
  BellRing
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
      className={`w-full transition-all duration-300 border-b backdrop-blur-xl ${
        autoPilot.isEnabled 
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-[#0A0F1D] border-emerald-500/30' 
          : 'bg-slate-900/80 border-slate-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left: Master Toggle & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            id="master-autopilot-toggle-btn"
            onClick={onToggleAutoPilot}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 ${
              autoPilot.isEnabled
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
            }`}
            title={autoPilot.isEnabled ? 'Pausar Piloto Automático' : 'Activar Piloto Automático 24/7'}
          >
            <Bot className={`w-4 h-4 ${autoPilot.isEnabled ? 'text-black animate-pulse' : 'text-slate-500'}`} />
            <span>
              {autoPilot.isEnabled ? '🟢 PILOTO 24/7 ACTIVO' : '⚪ PILOTO PAUSADO'}
            </span>
          </button>

          {autoPilot.isEnabled && (
            <div className="hidden sm:flex items-center gap-2 text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] text-slate-400 font-medium">
                Telegram: <strong className="text-emerald-400">@FijasIAOficial_bot</strong>
              </span>
            </div>
          )}
        </div>

        {/* Center: Next Scheduled Trigger info */}
        <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-slate-300 text-xs w-full md:w-auto justify-center">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400 font-medium">Próxima Emisión:</span>
          <span className="font-extrabold text-amber-300">
            {autoPilot.isEnabled ? autoPilot.nextScheduledRun : 'Pausado'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">(Hora Lima)</span>
        </div>

        {/* Right: Quick Trigger Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative">
            <button
              id="autopilot-quick-actions-btn"
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Emitir a Telegram</span>
              <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${showQuickActions ? 'rotate-90' : ''}`} />
            </button>

            {/* Quick Trigger Menu */}
            {showQuickActions && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in"
                onClick={() => setShowQuickActions(false)}
              >
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-800/80 mb-1">
                  Disparadores Inmediatos
                </div>
                
                <button
                  onClick={() => onTriggerManualRun('daily_picks')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enviar Cartelera del Día</span>
                </button>

                <button
                  onClick={() => onTriggerManualRun('in_play_alert')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200"
                >
                  <Radio className="w-3.5 h-3.5 text-red-400" />
                  <span>Enviar Alerta In-Play</span>
                </button>

                <button
                  onClick={() => onTriggerManualRun('nightly_audit')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Enviar Cierre Auditado (23:00)</span>
                </button>
              </div>
            )}
          </div>

          <button
            id="open-scheduler-btn"
            onClick={onOpenSchedulerModal}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Configurar Horarios del Cron Scheduler"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
