import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  ArrowRight, 
  Zap, 
  Trophy, 
  Flame, 
  Calendar, 
  CornerDownLeft,
  ChevronRight
} from 'lucide-react';
import { Match, EVSignal } from '../types';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  evSignals: EVSignal[];
  onSelectMatch: (match: Match) => void;
  onSelectEVSignal: (signal: EVSignal) => void;
  onAddToParlay: (signal: EVSignal) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  matches,
  evSignals,
  onSelectMatch,
  onSelectEVSignal,
  onAddToParlay
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle Ctrl+K and ESC shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // If closed, open handler handled by parent, but prevent browser default
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Filter EV signals
  const filteredSignals = evSignals.filter(s => 
    s.matchTitle.toLowerCase().includes(normalizedQuery) ||
    s.selection.toLowerCase().includes(normalizedQuery) ||
    s.market.toLowerCase().includes(normalizedQuery) ||
    s.league.toLowerCase().includes(normalizedQuery)
  );

  // Filter Matches
  const filteredMatches = matches.filter(m => 
    m.homeTeam.toLowerCase().includes(normalizedQuery) ||
    m.awayTeam.toLowerCase().includes(normalizedQuery) ||
    m.league.toLowerCase().includes(normalizedQuery) ||
    m.stadium.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        id="universal-search-modal"
        className="w-full max-w-2xl bg-[#0C1220] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            id="universal-search-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar por equipo (Universitario, Real Madrid...), liga o mercado +EV..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-2 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 font-medium"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-3 space-y-4 divide-y divide-slate-800/60">
          {/* Section 1: +EV Value Signals */}
          {filteredSignals.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>Señales +EV Coincidentes ({filteredSignals.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredSignals.map((sig) => (
                  <div
                    key={sig.id}
                    id={`search-signal-${sig.id}`}
                    onClick={() => {
                      onSelectEVSignal(sig);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-emerald-950/20 border border-slate-800 hover:border-emerald-500/40 cursor-pointer group transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 font-bold text-xs">
                        +{sig.edge}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-emerald-300">
                            {sig.matchTitle}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {sig.league}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="font-semibold text-emerald-400">{sig.selection}</span>
                          <span>•</span>
                          <span>Cuota: <strong className="text-white">{sig.odds}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">{sig.stake}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToParlay(sig);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30"
                      >
                        + Parlay
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Official Matches */}
          {filteredMatches.length > 0 && (
            <div className="space-y-2 pt-3">
              <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Partidos Oficiales ({filteredMatches.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredMatches.map((m) => (
                  <div
                    key={m.id}
                    id={`search-match-${m.id}`}
                    onClick={() => {
                      onSelectMatch(m);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                        <span>{m.leagueFlag}</span>
                        <span className="font-bold text-white group-hover:text-emerald-300">
                          {m.homeTeam} vs {m.awayTeam}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {m.stadium}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-300">
                          {m.time} UTC-5
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {m.date}
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded bg-slate-800 group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-300 text-xs font-semibold border border-slate-700 group-hover:border-emerald-500/30 flex items-center gap-1">
                        <span>Analizar</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredSignals.length === 0 && filteredMatches.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
              <p className="text-sm font-medium text-slate-300">
                No se encontraron coincidencias para &quot;{query}&quot;
              </p>
              <p className="text-xs text-slate-400">
                Prueba buscando por &quot;Universitario&quot;, &quot;Man City&quot;, &quot;Real Madrid&quot; o &quot;Liga 1&quot;.
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Usa <kbd className="px-1 bg-slate-800 rounded text-slate-300">↑</kbd> <kbd className="px-1 bg-slate-800 rounded text-slate-300">↓</kbd> para navegar</span>
            <span><kbd className="px-1 bg-slate-800 rounded text-slate-300">Enter</kbd> para seleccionar</span>
          </div>
          <span className="text-emerald-400 font-semibold">Tipster IA Engine v3.7</span>
        </div>
      </div>
    </div>
  );
};
