import React from 'react';
import { 
  Activity, 
  Cpu, 
  Search, 
  Layers, 
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Flame,
  HelpCircle,
  Coins,
  ExternalLink,
  Bot,
  Crown,
  Database,
  BrainCircuit,
  RefreshCw,
  Radio,
  Zap
} from 'lucide-react';
import { EngineConfig, BankrollSettings } from '../types';

interface HeaderProps {
  engineConfig: EngineConfig;
  bankrollSettings: BankrollSettings;
  isAutoPilotActive?: boolean;
  onOpenAutoPilotModal?: () => void;
  onOpenSalesAgentModal?: () => void;
  onOpenVIPModal?: () => void;
  onOpenPicksDatabaseModal?: () => void;
  onOpenAutoLearningModal?: () => void;
  onOpenMasterCycleModal?: () => void;
  onOpenLiveScannerModal?: () => void;
  onOpenEngineConfig: () => void;
  onOpenBankrollModal: () => void;
  onOpenSearch: () => void;
  onOpenParlayCalculator: () => void;
  onOpenKellySimulator: () => void;
  parlayLegsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  engineConfig,
  bankrollSettings,
  isAutoPilotActive = true,
  onOpenAutoPilotModal,
  onOpenSalesAgentModal,
  onOpenVIPModal,
  onOpenPicksDatabaseModal,
  onOpenAutoLearningModal,
  onOpenMasterCycleModal,
  onOpenLiveScannerModal,
  onOpenEngineConfig,
  onOpenBankrollModal,
  onOpenSearch,
  onOpenParlayCalculator,
  onOpenKellySimulator,
  parlayLegsCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo - 100% Neutral & Professional */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#090D16]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                FIJAS <span className="text-emerald-400 font-black">IA</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 transition-colors shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>+EV TIPSTER</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              Pronósticos Profesionales • Cuotas Disponibles en Todas las Casas
            </p>
          </div>
        </div>

        {/* Universal Search Bar Trigger (Ctrl + K) */}
        <div className="flex-1 max-w-sm hidden md:block">
          <button
            id="universal-search-trigger"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              <span>Buscar partidos, ligas, cuotas...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded shadow-sm">
                Ctrl K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Navigation & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Mobile Search Button */}
          <button
            id="mobile-search-btn"
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Agente de Ventas & Soporte VIP Bot Trigger */}
          {onOpenSalesAgentModal && (
            <button
              id="header-sales-agent-btn"
              onClick={onOpenSalesAgentModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-transparent border border-emerald-500/40 hover:border-emerald-300 text-emerald-300 hover:text-emerald-200 text-xs font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] group"
              title="Agente Automático de Ventas & Soporte VIP (@FijasIAOficial_bot)"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="hidden sm:inline">Bot Ventas VIP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </button>
          )}

          {/* Escáner Live & Motor Dual Trigger */}
          {onOpenLiveScannerModal && (
            <button
              id="header-live-scanner-btn"
              onClick={onOpenLiveScannerModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-red-500/20 to-amber-600/20 border border-amber-500/50 hover:border-amber-300 text-amber-300 hover:text-white text-xs font-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] group"
              title="Escáner en Vivo (+EV Live > 12%), Análisis Continuo Día Siguiente y Combinada de Oro VIP"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="hidden sm:inline">Escáner Live & VIP</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-red-500/30 border border-red-500/50 text-red-300 rounded font-mono font-black animate-pulse">LIVE</span>
            </button>
          )}

          {/* VIP Subscription & Plans Button */}
          {onOpenVIPModal && (
            <button
              id="header-vip-modal-btn"
              onClick={onOpenVIPModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-black transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] group"
              title="VIP Subscription CRM & AI Voucher Verifier (@SoporteFijasIA_bot)"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">CRM & VIP IA</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded font-mono font-bold">CRM</span>
            </button>
          )}

          {/* Multi-Sport Database & Pick Tracking Trigger */}
          {onOpenPicksDatabaseModal && (
            <button
              id="header-picks-database-btn"
              onClick={onOpenPicksDatabaseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 text-xs font-bold transition-all shadow-sm group"
              title="Base de Datos de Picks & Auditoría Oficial (+EV)"
            >
              <Database className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline">Auditoría Picks</span>
            </button>
          )}

          {/* Ciclo Maestro de 4 Etapas Trigger */}
          {onOpenMasterCycleModal && (
            <button
              id="header-master-cycle-btn"
              onClick={onOpenMasterCycleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-amber-500/20 border border-indigo-500/40 hover:border-indigo-300 text-indigo-300 hover:text-white text-xs font-black transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)] group"
              title="Ciclo Maestro de 4 Etapas (Cartelera 00:30 AM · Real-Time · Cierre 100% · Base de Datos)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden md:inline">Ciclo 4 Etapas</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 rounded font-mono font-bold">4E</span>
            </button>
          )}

          {/* AI Auto-Learning & Feedback Loop Trigger */}
          {onOpenAutoLearningModal && (
            <button
              id="header-auto-learning-btn"
              onClick={onOpenAutoLearningModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 hover:border-purple-500/60 text-purple-300 hover:text-purple-200 text-xs font-bold transition-all shadow-sm group"
              title="Motor de Auto-Aprendizaje Cuantitativo & Diagnóstico IA"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="hidden xl:inline">Auto-Aprendizaje IA</span>
            </button>
          )}

          {/* Bankroll in Soles (S/.) Trigger */}
          <button
            id="bankroll-manager-btn"
            onClick={onOpenBankrollModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all shadow-sm group"
            title="Ajustar Bankroll y Valor de Unidad en Soles"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-slate-400 font-medium leading-none">Bankroll (S/.):</div>
              <div className="font-extrabold text-white text-[11px] flex items-center gap-1">
                <span>S/. {bankrollSettings.totalBankrollSoles.toLocaleString('es-PE')}</span>
                <span className="text-[10px] text-emerald-400 font-bold">(1u = S/{bankrollSettings.unitValueSoles})</span>
              </div>
            </div>
          </button>

          {/* Parlay Calculator Launcher Button */}
          <button
            id="open-parlay-calculator-btn"
            onClick={onOpenParlayCalculator}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              parlayLegsCount > 0
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Combinada</span>
            {parlayLegsCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-emerald-500 text-black text-[11px] font-black animate-bounce">
                {parlayLegsCount}
              </span>
            )}
          </button>

          {/* AutoPilot 24/7 Trigger in Header */}
          {onOpenAutoPilotModal && (
            <button
              id="header-autopilot-btn"
              onClick={onOpenAutoPilotModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                isAutoPilotActive
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Panel del Modo Piloto Automático 24/7 (Disparadores a Telegram)"
            >
              <Bot className={`w-4 h-4 ${isAutoPilotActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline font-extrabold text-[11px]">
                {isAutoPilotActive ? 'Piloto 24/7' : 'Piloto Off'}
              </span>
              {isAutoPilotActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          )}

          {/* Kelly Criterion Simulator Trigger */}
          <button
            id="open-kelly-btn"
            onClick={onOpenKellySimulator}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
            title="Simulador de Gestión Kelly Fraccional"
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kelly</span>
          </button>

          {/* AI Engine Selector Pill */}
          <button
            id="engine-config-btn"
            onClick={onOpenEngineConfig}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all shadow-sm group"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-slate-400 font-medium leading-none">Motor IA:</div>
              <div className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1">
                {engineConfig.mode === 'gemini' ? 'Motor Neural' : 'Gateway Cuant.'}
              </div>
            </div>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};


