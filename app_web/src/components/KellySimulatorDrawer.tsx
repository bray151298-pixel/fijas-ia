import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle, 
  BarChart2, 
  Sparkles,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

interface KellySimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KellySimulatorDrawer: React.FC<KellySimulatorDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [initialBankroll, setInitialBankroll] = useState<number>(1000);
  const [kellyFraction, setKellyFraction] = useState<number>(0.25); // Fractional Kelly 0.25x
  const [winRate, setWinRate] = useState<number>(68.4);
  const [avgOdds, setAvgOdds] = useState<number>(1.85);

  if (!isOpen) return null;

  // Generate simulated compounding curve over 50 simulated bets
  const data = [];
  let currentBank = initialBankroll;
  const p = winRate / 100;
  const b = avgOdds - 1;
  // Full Kelly formula: f* = (b*p - (1-p)) / b
  const fullKelly = Math.max(0, (b * p - (1 - p)) / b);
  const fractionUsed = fullKelly * kellyFraction;

  for (let i = 0; i <= 30; i++) {
    if (i === 0) {
      data.push({ bet: 0, bankroll: initialBankroll });
    } else {
      // Expected theoretical growth
      const expectedFactor = 1 + fractionUsed * (p * b - (1 - p));
      currentBank = Math.round(currentBank * expectedFactor);
      data.push({ bet: i, bankroll: currentBank });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="kelly-simulator-modal"
        className="w-full max-w-3xl bg-[#0B101D] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                Simulador del Criterio de Kelly Fraccional
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  GEOMETRIC GROWTH
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Modelo matemático para calcular el tamaño óptimo de apuesta y maximizar el rendimiento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Kelly Parameter Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Fracción Kelly</span>
                <span className="text-cyan-400 font-bold">{kellyFraction}x (Prudente)</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={kellyFraction}
                onChange={(e) => setKellyFraction(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Recomendado: 0.25x para minimizar varianza
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Win Rate Histórico</span>
                <span className="text-emerald-400 font-bold">{winRate}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                step="0.5"
                value={winRate}
                onChange={(e) => setWinRate(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tasa del algoritmo Tipster IA
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Cuota Promedio</span>
                <span className="text-white font-bold">@{avgOdds}</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="2.5"
                step="0.05"
                value={avgOdds}
                onChange={(e) => setAvgOdds(parseFloat(e.target.value))}
                className="w-full accent-white cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Cuota ponderada del mercado
              </span>
            </div>
          </div>

          {/* Staking Recommendation Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Stake Óptimo Calculado (Fraccional 0.25x)
              </span>
              <div className="text-2xl font-black text-white mt-0.5">
                {(fractionUsed * 100).toFixed(2)}% de Banca{' '}
                <span className="text-sm font-extrabold text-cyan-400">(≈ +{(fractionUsed * 50).toFixed(1)}u)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Proyección 30 Apuestas
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                +{((currentBank / initialBankroll - 1) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Recharts Compounding Curve */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              Curva de Crecimiento Compuesto Teórico
            </span>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="kellyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="bet" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any) => [`${value} unidades`, 'Banca Proyectada']}
                    labelFormatter={(label) => `Apuesta #${label}`}
                  />
                  <Area type="monotone" dataKey="bankroll" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#kellyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
