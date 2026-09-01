import React, { useState } from 'react';
import { AIAutoLearningState, AIErrorDiagnostic, TrackedPick } from '../types';
import { 
  X, 
  BrainCircuit, 
  Zap, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Cpu, 
  Flame, 
  Activity, 
  ShieldAlert,
  Layers,
  History
} from 'lucide-react';

interface AIAutoLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoLearningState: AIAutoLearningState;
  onTriggerCalibration: () => Promise<void>;
  onDiagnosePick?: (pick: TrackedPick, context?: string) => Promise<AIErrorDiagnostic>;
}

export const AIAutoLearningModal: React.FC<AIAutoLearningModalProps> = ({
  isOpen,
  onClose,
  autoLearningState,
  onTriggerCalibration,
  onDiagnosePick
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<AIErrorDiagnostic | null>(null);

  if (!isOpen) return null;

  const handleRunCalibration = async () => {
    setIsCalibrating(true);
    try {
      await onTriggerCalibration();
      setCalibrationSuccess(true);
      setTimeout(() => setCalibrationSuccess(false), 3000);
    } catch (err: any) {
      alert('Error ejecutando ciclo de auto-aprendizaje: ' + err.message);
    } finally {
      setIsCalibrating(false);
    }
  };

  const getRootCauseBadge = (cause: string) => {
    switch (cause) {
      case 'bajas_no_reportadas':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Bajas de Última Hora</span>;
      case 'tiempo_extra_fatiga':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Fatiga / Ritmo Colapsado</span>;
      case 'colapso_bullpen':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">Colapso de Relevistas</span>;
      case 'alta_varianza':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Varianza Estadística Anómala</span>;
      case 'tarjeta_roja_expulsion':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Expulsión Decisiva</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">Factor Dinámico</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Motor de Auto-Aprendizaje & Feedback Cuantitativo</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Ciclo Continuo Activo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría post-evento con el Motor Neural de Inteligencia Deportiva: Diagnóstico de causa raíz y rebalanceo dinámico de factores de inferencia.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunCalibration}
              disabled={isCalibrating}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
              <span>{isCalibrating ? 'Recalibrando Pesos...' : 'Ejecutar Re-Calibración IA'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6 bg-slate-950/40 border-b border-slate-800/80">
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Eventos Procesados en Feedback</span>
              <span className="text-2xl font-black text-white font-mono mt-1">{autoLearningState.totalAnalysesProcessed}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">5 Deportes monitoreados</span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Optimización de Precisión Acumulada</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1">+{autoLearningState.accuracyOptimizedPercent.toFixed(1)}%</span>
              <span className="text-[10px] text-emerald-400/80 block mt-0.5">Reducción progresiva de errores</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Última Recalibración</span>
              <span className="text-sm font-bold text-amber-400 mt-1 block">{autoLearningState.lastCalibrationDate}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Automático tras cierre de jornada</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <History className="w-6 h-6" />
            </div>
          </div>
        </div>

        {calibrationSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Pesos del modelo reajustados con éxito! Se integraron los nuevos factores de corrección en los 5 deportes.</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Active Factor Weights (Sliders / Visuals) */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Pesos y Coeficientes Activos del Algoritmo Multi-Deporte
                </h3>
                <p className="text-xs text-slate-400">
                  Valores adaptativos calibrados por el feedback de resultados anteriores.
                </p>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/40">
                Modelo: Algoritmo Cuantitativo Propietario FIJAS IA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Home Advantage */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Ventaja de Localía & Altura</span>
                  <span className="font-mono font-black text-amber-400">{autoLearningState.activeWeights.homeAdvantageFactor.toFixed(2)}x</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${(autoLearningState.activeWeights.homeAdvantageFactor / 1.5) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Ajustado por altitud (Liga 1) y localía NBA/MLB</span>
              </div>

              {/* Recent Form xG */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Peso xG / Eficiencia Reciente</span>
                  <span className="font-mono font-black text-emerald-400">{(autoLearningState.activeWeights.recentFormXGWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${autoLearningState.activeWeights.recentFormXGWeight * 100 * 2}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Ponderación de últimos 5 partidos vs históricos</span>
              </div>

              {/* Key Injuries */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Impacto Bajas Clave</span>
                  <span className="font-mono font-black text-rose-400">{(autoLearningState.activeWeights.keyInjuriesImpactWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-400 h-full rounded-full transition-all"
                    style={{ width: `${autoLearningState.activeWeights.keyInjuriesImpactWeight * 100 * 2}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Penalización por ausencia de titulares y abridores</span>
              </div>

              {/* Market Inefficiency */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Sensibilidad al Edge (+EV)</span>
                  <span className="font-mono font-black text-sky-400">{(autoLearningState.activeWeights.marketInefficiencyEdge * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-sky-400 h-full rounded-full transition-all"
                    style={{ width: `${autoLearningState.activeWeights.marketInefficiencyEdge * 100 * 2}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Filtro mínimo de descalibración (&gt; +8.0%)</span>
              </div>

              {/* Weather & Fatigue */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Factor Fatiga & Clima</span>
                  <span className="font-mono font-black text-indigo-400">{(autoLearningState.activeWeights.weatherFatigueAdjustment * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-400 h-full rounded-full transition-all"
                    style={{ width: `${autoLearningState.activeWeights.weatherFatigueAdjustment * 100 * 2}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Viento en béisbol, back-to-back NBA, lluvia fútbol</span>
              </div>

              {/* Auto Calibration Mode */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 font-semibold block">Modo de Aprendizaje</span>
                  <span className="text-[11px] text-emerald-400 font-medium">Re-entrenamiento Nocturno</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Motor Neural de Inteligencia Deportiva</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Section 2: Error Diagnostics & Root Cause Post-Mortems */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Diagnósticos Post-Mortem de Fallos & Acciones de Recalibración
              </h3>
              <span className="text-xs text-slate-400">
                {autoLearningState.recentErrorDiagnostics.length} diagnósticos registrados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {autoLearningState.recentErrorDiagnostics.map((err) => (
                <div 
                  key={err.id}
                  onClick={() => setSelectedDiagnostic(err)}
                  className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">{err.date}</span>
                    {getRootCauseBadge(err.rootCause)}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{err.eventTitle}</h4>
                    <span className="text-[11px] text-rose-400 font-semibold block mt-0.5">{err.pickSelection}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    {err.aiExplanation}
                  </p>

                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-purple-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {err.weightAdjusted}
                    </span>
                    <span className="text-slate-400">Ver detalle &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Recalibration Logs */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              Historial de Calibraciones del Modelo
            </h3>

            <div className="space-y-2">
              {autoLearningState.calibrationLogs.map((log) => (
                <div key={log.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300">
                      {log.timestamp}
                    </span>
                    <span className="font-semibold text-white">{log.trigger}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-emerald-400 font-bold font-mono">{log.optimizationDelta}</span>
                    <span className="text-[11px] text-slate-400 max-w-xs truncate">{log.notes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Inferencia Cuantitativa: Motor Neural de Inteligencia Deportiva • Tecnología Predictiva Exclusiva</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-slate-300 font-mono text-[11px]">Auto-Tuning Active</span>
          </div>
        </div>
      </div>

      {/* Detail Modal for Single Diagnostic */}
      {selectedDiagnostic && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-400" />
                Diagnóstico de Causa Raíz IA
              </h3>
              <button
                onClick={() => setSelectedDiagnostic(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">{selectedDiagnostic.date}</span>
                {getRootCauseBadge(selectedDiagnostic.rootCause)}
              </div>
              <h4 className="text-sm font-bold text-white">{selectedDiagnostic.eventTitle}</h4>
              <p className="text-xs text-rose-400 font-semibold">{selectedDiagnostic.pickSelection}</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Explicación Técnica del Desvío:</span>
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedDiagnostic.aiExplanation}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 block">Acción de Recalibración Aplicada:</span>
              <p className="text-xs text-slate-200 leading-relaxed bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/40">
                {selectedDiagnostic.recalibrationAction}
              </p>
              <div className="text-[11px] font-mono text-amber-300 font-bold pt-1">
                {selectedDiagnostic.weightAdjusted}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDiagnostic(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
