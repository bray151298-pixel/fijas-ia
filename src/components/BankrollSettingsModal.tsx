import React, { useState } from 'react';
import { 
  X, 
  Coins, 
  ShieldCheck, 
  Check, 
  TrendingUp, 
  ExternalLink,
  Wallet,
  Sparkles,
  Info
} from 'lucide-react';
import { BankrollSettings } from '../types';

interface BankrollSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BankrollSettings;
  onSaveSettings: (settings: BankrollSettings) => void;
}

export const BankrollSettingsModal: React.FC<BankrollSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [bankroll, setBankroll] = useState<number>(settings.totalBankrollSoles);
  const [unitPercent, setUnitPercent] = useState<number>(
    Math.round((settings.unitValueSoles / settings.totalBankrollSoles) * 100) || 2
  );
  const [customUnit, setCustomUnit] = useState<number>(settings.unitValueSoles);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const calculatedUnitValue = Math.round((bankroll * unitPercent) / 100);

  const handlePresetBankroll = (amount: number) => {
    setBankroll(amount);
    setCustomUnit(Math.round((amount * unitPercent) / 100));
  };

  const handleSave = () => {
    onSaveSettings({
      totalBankrollSoles: bankroll,
      unitValueSoles: calculatedUnitValue || customUnit || 20,
      currency: 'PEN'
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="bankroll-settings-modal"
        className="w-full max-w-lg bg-[#0B101D] border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Header with Apuesta Total Theme */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#140A10] via-[#1A0B14] to-[#0A101D] border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Bankroll en Soles (S/.)
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500 text-white tracking-wider">
                  APUESTA TOTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calibración de unidades (u) y gestión de capital para Apuesta Total Perú
              </p>
            </div>
          </div>

          <button
            id="close-bankroll-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Apuesta Total Banner */}
          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0 animate-pulse" />
              <div>
                <h4 className="text-xs font-black text-rose-300 uppercase tracking-wide">
                  Casa de Apuestas Activa: Apuesta Total Perú
                </h4>
                <p className="text-[11px] text-slate-300/90 mt-0.5 leading-relaxed">
                  Todas las señales, cuotas y stakes se calculan directamente en moneda nacional (PEN S/.) para su colocación rápida en la web o ventanilla de Apuesta Total.
                </p>
              </div>
            </div>
            <a 
              href="https://www.apuestatotal.com/apuestas-deportivas/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-sm"
            >
              <span>Abrir Web</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Bankroll Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Capital Total Disponible (Bankroll)</span>
              <span className="text-rose-400 font-extrabold text-sm">
                S/. {bankroll.toLocaleString('es-PE')}
              </span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                S/.
              </div>
              <input
                type="number"
                min="50"
                step="50"
                value={bankroll}
                onChange={(e) => setBankroll(Math.max(10, Number(e.target.value)))}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black text-lg focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[200, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetBankroll(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bankroll === amt 
                      ? 'bg-rose-500 text-white shadow-md' 
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  S/. {amt.toLocaleString('es-PE')}
                </button>
              ))}
            </div>
          </div>

          {/* Unit % & Value */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">
                  Porcentaje de Gestión por Unidad (1u)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Criterio cuantitativo conservador recomendado: 1.5% - 2.5%
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                {unitPercent}% del Bank
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={unitPercent}
              onChange={(e) => setUnitPercent(Number(e.target.value))}
              className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            {/* Live Stake Conversions Preview */}
            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold block">1.0u (Base)</span>
                <span className="text-xs font-black text-white">S/. {(calculatedUnitValue * 1.0).toFixed(0)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold block">1.5u (+EV)</span>
                <span className="text-xs font-black text-emerald-400">S/. {(calculatedUnitValue * 1.5).toFixed(0)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold block">2.0u (Alta)</span>
                <span className="text-xs font-black text-rose-400">S/. {(calculatedUnitValue * 2.0).toFixed(0)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold block">2.5u (Máx)</span>
                <span className="text-xs font-black text-amber-400">S/. {(calculatedUnitValue * 2.5).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Los stakes en las señales se actualizarán automáticamente</span>
          </div>

          <button
            id="save-bankroll-btn"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>Guardar Configuración</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
