import React from 'react';
import { SportType } from '../types';
import { SPORTS_LIST } from '../data/matches';
import { Trophy, Flame, Activity, Sparkles, Zap, Layers, RefreshCw } from 'lucide-react';

interface MultiSportFilterBarProps {
  selectedSport: SportType | 'all';
  onSelectSport: (sport: SportType | 'all') => void;
  countsBySport: Record<string, number>;
  onRefreshLiveMatches?: () => void;
  isLiveSyncing?: boolean;
  lastSyncTime?: string;
}

export const MultiSportFilterBar: React.FC<MultiSportFilterBarProps> = ({
  selectedSport,
  onSelectSport,
  countsBySport,
  onRefreshLiveMatches,
  isLiveSyncing,
  lastSyncTime
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'Activity':
        return <Activity className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const totalAllCount = (Object.values(countsBySport) as number[]).reduce((acc: number, c: number) => acc + (c || 0), 0);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sticky top-16 z-20 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Disciplinas:
          </span>

          {/* All Sports button */}
          <button
            id="filter-sport-all"
            onClick={() => onSelectSport('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              selectedSport === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50'
            }`}
          >
            <span>🌐</span>
            <span>Todos los Deportes</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedSport === 'all' ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
            }`}>
              {totalAllCount}
            </span>
          </button>

          {/* Individual sports */}
          {SPORTS_LIST.map((sport) => {
            const count = countsBySport[sport.id] || 0;
            const isSelected = selectedSport === sport.id;

            return (
              <button
                key={sport.id}
                id={`filter-sport-${sport.id}`}
                onClick={() => onSelectSport(sport.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50'
                }`}
              >
                <span>{sport.emoji}</span>
                <span>{sport.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-700 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Sync Controls and Timestamps */}
        <div className="flex items-center gap-3 min-w-max border-l border-slate-800 pl-4">
          {onRefreshLiveMatches && (
            <button
              id="btn-sync-live-matches"
              onClick={onRefreshLiveMatches}
              disabled={isLiveSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold border border-emerald-500/40 transition-all active:scale-95 disabled:opacity-50"
              title="Consultar fixtures oficiales de ESPN y marcadores en vivo de hoy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
              <span>{isLiveSyncing ? 'Sincronizando...' : 'Escanear Hoy'}</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Partidos Hoy (Hora Lima):</span>
            <span className="text-emerald-400 font-mono text-[11px] font-bold">
              {lastSyncTime || 'En Vivo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
