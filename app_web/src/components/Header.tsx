import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Layers, 
  Coins, 
  Bot, 
  Crown, 
  Database, 
  BrainCircuit, 
  RefreshCw, 
  Radio, 
  SlidersHorizontal,
  ChevronDown,
  LogOut,
  Cpu,
  Lock
} from 'lucide-react';
import { EngineConfig, BankrollSettings } from '../types';

interface HeaderProps {
  engineConfig: EngineConfig;
  bankrollSettings: BankrollSettings;
  isAutoPilotActive?: boolean;
  onLogout?: () => void;
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
  onLogout,
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
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0B101D]/95 backdrop-blur-xl border-b border-slate-800/90 px-4 lg:px-8 py-3 shadow-xl shadow-black/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 via-emerald-600/10 to-transparent border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B101D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
                FIJAS <span className="text-emerald-400">IA</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ADMIN</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              Panel Maestro de Pronósticos & Emisión Cuantitativa
            </p>
          </div>
        </div>

        {/* Universal Search Bar */}
        <div className="flex-1 max-w-sm hidden md:block">
          <button
            id="universal-search-trigger"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs group shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              <span>Buscar partidos, ligas, cuotas...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Bankroll Soles Display */}
          <button
            id="bankroll-manager-btn"
            onClick={onOpenBankrollModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-200 transition-all shadow-sm group"
            title="Gestión de Bankroll y Valor de Unidad en Soles"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">Bankroll (S/.):</div>
              <div className="font-extrabold text-white text-[11px] flex items-center gap-1">
                <span>S/. {bankrollSettings.totalBankrollSoles.toLocaleString('es-PE')}</span>
                <span className="text-[10px] text-emerald-400 font-bold">(1u = S/{bankrollSettings.unitValueSoles})</span>
              </div>
            </div>
          </button>

          {/* Bot Ventas VIP Direct Trigger */}
          {onOpenSalesAgentModal && (
            <button
              id="header-sales-agent-btn"
              onClick={onOpenSalesAgentModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
              title="Agente de Ventas y Pagos Yape/Plin"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Bot Ventas VIP</span>
            </button>
          )}

          {/* Escáner Live Direct Trigger */}
          {onOpenLiveScannerModal && (
            <button
              id="header-live-scanner-btn"
              onClick={onOpenLiveScannerModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm"
              title="Escáner en Vivo (+EV Live > 12%)"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Live Scanner</span>
              <span className="px-1 py-0.2 text-[9px] bg-red-500/30 text-red-300 font-mono font-bold rounded">LIVE</span>
            </button>
          )}

          {/* Combinada / Parlay Ticket Button */}
          <button
            id="open-parlay-calculator-btn"
            onClick={onOpenParlayCalculator}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              parlayLegsCount > 0
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ticket ({parlayLegsCount})</span>
          </button>

          {/* Dropdown Módulos Admin */}
          <div className="relative">
            <button
              id="header-tools-dropdown-btn"
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Módulos Admin</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Popover */}
            {isToolsDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setIsToolsDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
                  Módulos de Control & Auditoría
                </div>

                {onOpenAutoPilotModal && (
                  <button
                    onClick={onOpenAutoPilotModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 text-xs font-medium text-left transition-all"
                  >
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-white">AutoPilot 24/7</div>
                      <div className="text-[10px] text-slate-400">Disparadores Automáticos y Cron</div>
                    </div>
                  </button>
                )}

                {onOpenVIPModal && (
                  <button
                    onClick={onOpenVIPModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 text-xs font-medium text-left transition-all"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold text-white">CRM Clientes & VIP</div>
                      <div className="text-[10px] text-slate-400">Validación de Vouchers Yape/Plin</div>
                    </div>
                  </button>
                )}

                {onOpenMasterCycleModal && (
                  <button
                    onClick={onOpenMasterCycleModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 text-xs font-medium text-left transition-all"
                  >
                    <RefreshCw className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-bold text-white">Ciclo Maestro (4 Etapas)</div>
                      <div className="text-[10px] text-slate-400">00:30 AM · In-Play · Cierre 23:00 PM</div>
                    </div>
                  </button>
                )}

                {onOpenPicksDatabaseModal && (
                  <button
                    onClick={onOpenPicksDatabaseModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 text-xs font-medium text-left transition-all"
                  >
                    <Database className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-white">Base de Datos de Picks</div>
                      <div className="text-[10px] text-slate-400">Auditoría Oficial +EV y Registro</div>
                    </div>
                  </button>
                )}

                {onOpenAutoLearningModal && (
                  <button
                    onClick={onOpenAutoLearningModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 text-xs font-medium text-left transition-all"
                  >
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-bold text-white">Auto-Aprendizaje IA</div>
                      <div className="text-[10px] text-slate-400">Diagnóstico Cuantitativo del Motor</div>
                    </div>
                  </button>
                )}

                {onOpenEngineConfig && (
                  <button
                    onClick={onOpenEngineConfig}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 text-xs font-medium text-left transition-all"
                  >
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold text-white">Parámetros del Algoritmo</div>
                      <div className="text-[10px] text-slate-400">Umbrales +EV, xG y Criterio Kelly</div>
                    </div>
                  </button>
                )}

                {onLogout && (
                  <div className="border-t border-slate-800 pt-1 mt-1">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 text-xs font-bold text-left transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión Admin</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
