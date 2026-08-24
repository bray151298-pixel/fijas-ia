import React from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  CalendarCheck, 
  Zap, 
  Cpu, 
  ShieldCheck, 
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* KPI 1: Tasa de Acierto */}
          <div 
            id="kpi-winrate"
            className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-emerald-500/30 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Tasa de Acierto
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {kpis.winRate}%
              </span>
              <span className="text-[11px] font-bold text-emerald-400">
                Win Rate
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Últimas 300 señales verificadas
            </p>
          </div>

          {/* KPI 2: Yield del Modelo */}
          <div 
            id="kpi-yield"
            className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-emerald-500/30 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Yield Cuantitativo
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                +{kpis.roiYield}%
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                ROI Neto
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Flat stake 1u auditado
            </p>
          </div>

          {/* KPI 3: Partidos Analizados Hoy */}
          <div 
            id="kpi-matches-today"
            className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-cyan-500/30 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Partidos Hoy
              </span>
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <CalendarCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {kpis.matchesAnalyzedToday}
              </span>
              <span className="text-[11px] font-bold text-cyan-400">
                Partidos
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Fixtures ESPN en vivo
            </p>
          </div>

          {/* KPI 4: Señales +EV Detectadas */}
          <div 
            id="kpi-ev-signals"
            onClick={onSelectSignalFilter}
            className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-emerald-500/50 transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Señales +EV
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {kpis.evSignalsDetected}
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                Detectadas
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/90 mt-1 font-medium flex items-center gap-0.5 truncate">
              <span>Edge &gt; {engineConfig.minEdgeEV}%</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </p>
          </div>

          {/* KPI 5: Estado del Motor Cuantitativo */}
          <div 
            id="kpi-engine-status"
            className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-indigo-500/30 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Motor Cuantitativo
              </span>
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
              <span className="text-xs font-black text-white truncate">
                {kpis.engineStatus}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              xG + Poisson + Kelly
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
