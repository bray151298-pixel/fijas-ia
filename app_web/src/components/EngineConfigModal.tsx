import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Sparkles, 
  Server, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Terminal,
  Zap,
  Lock
} from 'lucide-react';
import { EngineConfig } from '../types';
import { testEngineConnection } from '../services/aiService';

interface EngineConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EngineConfig;
  onUpdateConfig: (newConfig: EngineConfig) => void;
}

export const EngineConfigModal: React.FC<EngineConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  const [activeMode, setActiveMode] = useState<'gemini' | 'omniroute'>(config.mode);
  const [omnirouteUrl, setOmnirouteUrl] = useState<string>(config.omnirouteUrl || 'http://localhost:20128/v1');
  const [omnirouteKey, setOmnirouteKey] = useState<string>(config.omnirouteKey || 'sk-210e90fe192fb23f-b8f3d7-0e527d1c');
  const [omnirouteModel, setOmnirouteModel] = useState<string>(config.omnirouteModel || 'auto/best-free');
  
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleTestEngine = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testEngineConnection({
        ...config,
        mode: activeMode,
        omnirouteUrl,
        omnirouteKey,
        omnirouteModel
      });
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        error: e.message || 'Error al conectar'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      mode: activeMode,
      omnirouteUrl,
      omnirouteKey,
      omnirouteModel,
      status: testResult?.success ? 'connected' : 'fallback'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="engine-config-modal"
        className="w-full max-w-2xl bg-[#0B101D] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                Configuración Dual del Motor IA
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ACTIVO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona la infraestructura de inferencia para el análisis cuantitativo
              </p>
            </div>
          </div>

          <button
            id="close-engine-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Engine Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Engine A: Motor Neural de Inteligencia Deportiva */}
            <div
              id="engine-option-gemini"
              onClick={() => {
                setActiveMode('gemini');
                setTestResult(null);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                activeMode === 'gemini'
                  ? 'bg-emerald-950/25 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Motor Neural FIJAS IA</h3>
                    <span className="text-[10px] text-emerald-400 font-bold">NUBE INSTITUCIONAL</span>
                  </div>
                </div>
                {activeMode === 'gemini' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inferencia de alta velocidad mediante el <strong>Motor Neural de Inteligencia Deportiva</strong> ejecutado en el backend con razonamiento cuantitativo y calibración deportiva.
              </p>
              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Latencia: ~120ms • Inyección Server-Side</span>
              </div>
            </div>

            {/* Engine B: Gateway Cuantitativo Privado */}
            <div
              id="engine-option-omniroute"
              onClick={() => {
                setActiveMode('omniroute');
                setTestResult(null);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                activeMode === 'omniroute'
                  ? 'bg-purple-950/25 border-purple-500/60 ring-1 ring-purple-500/30 shadow-lg shadow-purple-950/20'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Gateway Cuantitativo</h3>
                    <span className="text-[10px] text-purple-400 font-bold">GATEWAY PRIVADO</span>
                  </div>
                </div>
                {activeMode === 'omniroute' && (
                  <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conexión a tu gateway privado dedicado para inferencia soberana de máxima privacidad y calibración institucional exclusiva.
              </p>
              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                <span>Endpoint: localhost:20128 • Auto Inferencia</span>
              </div>
            </div>
          </div>

          {/* Proprietary Gateway Parameters (when selected) */}
          {activeMode === 'omniroute' && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Parámetros de Red Gateway Privado</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Gateway URL */}
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Gateway URL:
                  </label>
                  <input
                    type="text"
                    value={omnirouteUrl}
                    onChange={(e) => setOmnirouteUrl(e.target.value)}
                    placeholder="http://localhost:20128/v1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Perfil de Inferencia:
                  </label>
                  <input
                    type="text"
                    value={omnirouteModel}
                    onChange={(e) => setOmnirouteModel(e.target.value)}
                    placeholder="auto/best-free"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* API Key */}
                <div className="sm:col-span-2">
                  <label className="text-slate-400 font-semibold block mb-1">
                    Token de Seguridad Privado:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={omnirouteKey}
                      onChange={(e) => setOmnirouteKey(e.target.value)}
                      placeholder="sk-210e90fe192fb23f-b8f3d7-0e527d1c"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostics Test Output */}
          {testResult && (
            <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed animate-in fade-in ${
              testResult.success 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>
                  {testResult.provider}: {testResult.status || (testResult.success ? 'Conexión Exitosa' : 'Diagnóstico de Red')}
                </span>
                {testResult.measuredLatencyMs && (
                  <span className="ml-auto font-mono text-[11px] text-slate-400">
                    {testResult.measuredLatencyMs}ms
                  </span>
                )}
              </div>
              {testResult.error && (
                <p className="text-slate-300 mt-1">
                  {testResult.error}
                </p>
              )}
              {testResult.fallbackNote && (
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {testResult.fallbackNote}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            id="test-engine-btn"
            onClick={handleTestEngine}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Probando Inferencia...' : 'Probar Conexión'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              id="save-engine-config-btn"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-colors shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              Guardar Motor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
