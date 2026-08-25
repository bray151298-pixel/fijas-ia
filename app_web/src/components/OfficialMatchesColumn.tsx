import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Plus,
  Flame,
  BarChart2,
  ExternalLink
} from 'lucide-react';
import { Match, LeagueId, ParlayLeg, SportType } from '../types';
import { LEAGUES_LIST } from '../data/matches';

interface OfficialMatchesColumnProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onAddCustomLegToParlay: (leg: ParlayLeg) => void;
  selectedLeague: LeagueId;
  onSelectLeague: (league: LeagueId) => void;
  activeMatchId?: string;
  selectedSport?: SportType | 'all';
}

export const OfficialMatchesColumn: React.FC<OfficialMatchesColumnProps> = ({
  matches,
  onSelectMatch,
  onAddCustomLegToParlay,
  selectedLeague,
  onSelectLeague,
  activeMatchId,
  selectedSport = 'all'
}) => {
  const filteredMatches = matches.filter(m => {
    if (selectedSport !== 'all' && m.sport !== selectedSport) return false;
    if (selectedLeague === 'all') return true;
    return m.leagueId === selectedLeague;
  });

  const sportEmojiMap: Record<string, string> = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    baseball: '⚾',
    mma: '🥊'
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Column Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Partidos Oficiales
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
                {filteredMatches.length} EN APUESTA TOTAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cuotas oficiales contrastadas con el Algoritmo Cuantitativo Propietario FIJAS IA
            </p>
          </div>
        </div>

        <a 
          href="https://www.apuestatotal.com/apuestas-deportivas/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>Catálogo Apuesta Total</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* League Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {LEAGUES_LIST.map((lg) => {
          const isSelected = selectedLeague === lg.id;
          const matchCount = lg.id === 'all' 
            ? matches.length 
            : matches.filter(m => m.leagueId === lg.id).length;

          return (
            <button
              key={lg.id}
              id={`league-tab-${lg.id}`}
              onClick={() => onSelectLeague(lg.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {lg.flag && <span>{lg.flag}</span>}
              <span>{lg.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {matchCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Matches List */}
      <div className="space-y-3 overflow-y-auto pr-0.5">
        {filteredMatches.map((match) => {
          const isSelected = match.id === activeMatchId;

          return (
            <div
              key={match.id}
              id={`match-card-${match.id}`}
              className={`p-4 rounded-2xl transition-all border flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-slate-900 border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
                  : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* League header & stadium */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{match.leagueFlag}</span>
                  <span className="font-bold text-slate-300 text-[11px] tracking-wide">
                    {match.league}
                  </span>
                  {match.leagueId === 'liga1-peru' && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Perú
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span className="font-semibold text-slate-200">{match.date} • {match.time} UTC-5</span>
                </div>
              </div>

              {/* Match Teams & Probability Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {/* Home Team */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base text-white truncate">
                      {match.homeTeam}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {match.probabilities?.home ?? 50}%
                    </span>
                  </div>

                  <span className="text-xs font-black text-slate-400 px-2">
                    VS
                  </span>

                  {/* Away Team */}
                  <div className="flex-1 flex items-center justify-end gap-2 text-right">
                    <span className="text-[10px] font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {match.probabilities?.away ?? 50}%
                    </span>
                    <span className="font-extrabold text-sm sm:text-base text-white truncate">
                      {match.awayTeam}
                    </span>
                  </div>
                </div>

                {/* Micro Probability Visual Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 flex overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all" 
                    style={{ width: `${match.probabilities?.home ?? 50}%` }} 
                    title={`Victoria ${match.homeTeam}: ${match.probabilities?.home ?? 50}%`}
                  />
                  <div 
                    className="bg-slate-500 h-full transition-all" 
                    style={{ width: `${match.probabilities?.draw ?? 25}%` }} 
                    title={`Empate: ${match.probabilities?.draw ?? 25}%`}
                  />
                  <div 
                    className="bg-cyan-500 h-full transition-all" 
                    style={{ width: `${match.probabilities?.away ?? 50}%` }} 
                    title={`Victoria ${match.awayTeam}: ${match.probabilities?.away ?? 50}%`}
                  />
                </div>

                {/* Stadium & Location */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{match.stadium} ({match.city})</span>
                </div>
              </div>

              {/* Odds Quick Click Matrix with Clear Spanish Market Labels */}
              <div className="space-y-2">
                {/* Highlighted Top EV Pick if available */}
                {match.evSignal && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase tracking-wider border border-emerald-500/30">
                        ¿A qué apostar?
                      </span>
                      <span className="text-xs font-black text-white">
                        👉 <span className="text-emerald-300">{match.evSignal.selection}</span>
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      @{match.evSignal.odds}
                    </span>
                  </div>
                )}

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center justify-between">
                    <span>Cuotas Ganador del Partido (1X2):</span>
                    <span className="text-rose-400 font-bold">Clic para añadir a tu ticket</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1 (Gana Local) */}
                    <button
                      id={`quick-bet-home-${match.id}`}
                      onClick={() => onAddCustomLegToParlay({
                        id: `${match.id}-home`,
                        matchId: match.id,
                        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                        league: match.league,
                        market: 'Ganador del Partido',
                        selection: `Gana ${match.homeTeam} (Local)`,
                        odds: match.odds?.home ?? 2.0,
                        modelProb: match.probabilities?.home ?? 50,
                        edge: Number(((((match.odds?.home ?? 2.0) / (100 / (match.probabilities?.home ?? 50))) - 1) * 100).toFixed(1)),
                        date: match.date,
                        time: match.time
                      })}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-xs transition-all group text-center"
                      title={`Añadir Gana ${match.homeTeam} al Ticket`}
                    >
                      <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">
                        Gana {match.homeTeam.split(' ')[0]}
                      </span>
                      <span className="font-black text-white group-hover:text-rose-300 text-sm">
                        @{match.odds?.home ?? 2.0}
                      </span>
                    </button>

                    {/* X (Empate) */}
                    <button
                      id={`quick-bet-draw-${match.id}`}
                      onClick={() => onAddCustomLegToParlay({
                        id: `${match.id}-draw`,
                        matchId: match.id,
                        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                        league: match.league,
                        market: 'Resultado del Partido',
                        selection: 'Empate',
                        odds: match.odds?.draw ?? 3.0,
                        modelProb: match.probabilities?.draw ?? 25,
                        edge: Number(((((match.odds?.draw ?? 3.0) / (100 / (match.probabilities?.draw ?? 25))) - 1) * 100).toFixed(1)),
                        date: match.date,
                        time: match.time
                      })}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-xs transition-all group text-center"
                      title="Añadir Empate al Ticket"
                    >
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Empate
                      </span>
                      <span className="font-black text-white group-hover:text-rose-300 text-sm">
                        @{match.odds?.draw ?? 3.0}
                      </span>
                    </button>

                    {/* 2 (Gana Visitante) */}
                    <button
                      id={`quick-bet-away-${match.id}`}
                      onClick={() => onAddCustomLegToParlay({
                        id: `${match.id}-away`,
                        matchId: match.id,
                        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                        league: match.league,
                        market: 'Ganador del Partido',
                        selection: `Gana ${match.awayTeam} (Visitante)`,
                        odds: match.odds?.away ?? 2.0,
                        modelProb: match.probabilities?.away ?? 50,
                        edge: Number(((((match.odds?.away ?? 2.0) / (100 / (match.probabilities?.away ?? 50))) - 1) * 100).toFixed(1)),
                        date: match.date,
                        time: match.time
                      })}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-xs transition-all group text-center"
                      title={`Añadir Gana ${match.awayTeam} al Ticket`}
                    >
                      <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">
                        Gana {match.awayTeam.split(' ')[0]}
                      </span>
                      <span className="font-black text-white group-hover:text-rose-300 text-sm">
                        @{match.odds?.away ?? 2.0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Match Action Button: "Analizar" */}
              <div className="pt-1 flex items-center justify-between gap-2">
                {match.evSignal ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    +{match.evSignal.edge}% Valor Detectado
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Probabilidades Cuantitativas
                  </span>
                )}

                <button
                  id={`analyze-match-btn-${match.id}`}
                  onClick={() => onSelectMatch(match)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-xs font-black transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ver Análisis Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

