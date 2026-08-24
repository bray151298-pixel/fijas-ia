import React from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  CalendarCheck, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { AlgorithmKPIs, EngineConfig } from '../types';

interface KPIHeaderProps {
  kpis: AlgorithmKPIs;
  engineConfig: EngineConfig;
  onSelectSignalFilter?: () => void;
}

export const KPIHeader: React.FC<KPIHeaderProps> = ({ kpis, engineConfig, onSelectSignalFilter }) => {
  return (
    <section className="w-full bg-[#0B101D] border-b border-slate-800/80 px-4 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* KPI 1: Tasa de Acierto */}
          <div 
            id="kpi-winrate"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tasa de Acierto
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {kpis.winRate}%
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                Win Rate
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              Últimas 300 señales verificadas
            </p>
          </div>

          {/* KPI 2: Yield del Modelo */}
          <div 
            id="kpi-yield"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Yield del Modelo
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                +{kpis.roiYield}%
              </span>
              <span className="text-[11px] font-semibold text-slate-300">
                ROI Neto
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              Flat stake 1u auditado
            </p>
          </div>

          {/* KPI 3: Partidos Analizados Hoy */}
          <div 
            id="kpi-matches-today"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Partidos Hoy
              </span>
              <CalendarCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {kpis.matchesAnalyzedToday}
              </span>
              <span className="text-[11px] font-semibold text-cyan-400">
                Partidos
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              5 Ligas calibradas en vivo
            </p>
          </div>

          {/* KPI 4: Señales +EV Detectadas */}
          <div 
            id="kpi-ev-signals"
            onClick={onSelectSignalFilter}
            className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/30 to-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer group shadow-[0_0_15px_rgba(16,185,129,0.05)]"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                Señales +EV
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 tracking-tight">
                {kpis.evSignalsDetected}
              </span>
              <span className="text-[11px] font-semibold text-emerald-400">
                Picks de Valor
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/80 mt-1 truncate font-medium">
              Edge promedio &gt; +7.5%
            </p>
          </div>

          {/* KPI 5: Estado del Motor */}
          <div 
            id="kpi-engine-status"
            className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-purple-500/30 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Estado del Motor
              </span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-slate-200 truncate">
                Activo
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              {engineConfig.mode === 'gemini' ? 'Motor Neural Cuantitativo' : 'Gateway Cuantitativo'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
