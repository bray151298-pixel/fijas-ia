import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Clock, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  X, 
  Play, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  Check, 
  Flame, 
  ExternalLink,
  Copy,
  Layers,
  ArrowRight,
  AlertCircle,
  KeyRound,
  MessageSquare,
  RefreshCw,
  Info,
  Crown,
  Zap,
  Gift
} from 'lucide-react';
import { AutoPilotState, AutoPilotTriggerType, AutoPilotLog } from '../types';
import { sendTelegramMessage, TELEGRAM_CONFIG, formatSingleSignalMessage, formatGoldenParlayMessage, formatSettlementMessage, formatNightlyAuditMessage } from '../services/telegramService';

interface AutoPilotSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoPilot: AutoPilotState;
  onToggleAutoPilot: () => void;
  onTriggerManualRun: (type: AutoPilotTriggerType) => Promise<void> | void;
  onUpdateChannelName: (chatId: string) => void;
  onUpdateChatId: (chatId: string) => void;
  onOpenVIPModal?: () => void;
}

export const AutoPilotSchedulerModal: React.FC<AutoPilotSchedulerModalProps> = ({
  isOpen,
  onClose,
  autoPilot,
  onToggleAutoPilot,
  onTriggerManualRun,
  onUpdateChannelName,
  onUpdateChatId,
  onOpenVIPModal
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'triggers' | 'volume' | 'telegram' | 'logs' | 'preview'>('triggers');
  
  // Telegram Test State
  const [channelInput, setChannelInput] = useState(autoPilot.telegramChatId || autoPilot.telegramChannelName || '@FijasIA');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });
  const [isRunningTrigger, setIsRunningTrigger] = useState<string | null>(null);
  const [sportBroadcastStatus, setSportBroadcastStatus] = useState<string | null>(null);
  const [targetAudience, setTargetAudience] = useState<'vip' | 'public' | 'both'>('vip');
  const [publicChannelName, setPublicChannelName] = useState('@FijasIAOficial');
  const [vipChannelName, setVipChannelName] = useState(autoPilot.telegramChatId || '-1004358917232');

  if (!isOpen) return null;

  const handleBroadcastSport = async (sport: string, mode: 'vip' | 'public' = targetAudience === 'both' ? 'vip' : targetAudience) => {
    setIsRunningTrigger(`sport_${sport}_${mode}`);
    setSportBroadcastStatus(null);
    try {
      const res = await fetch('/api/telegram/broadcast-by-sport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sport, 
          channelType: mode,
          targetChat: mode === 'public' ? publicChannelName.trim() : (vipChannelName.trim() || undefined)
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSportBroadcastStatus(`✅ Paquete de ${sport.toUpperCase()} enviado con éxito al ${mode === 'public' ? 'Canal Público' : 'Canal VIP'}.`);
      } else {
        setSportBroadcastStatus(`❌ Error al emitir paquete: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      setSportBroadcastStatus(`❌ Error de conexión: ${err.message}`);
    } finally {
      setIsRunningTrigger(null);
    }
  };

  const handleBroadcastPublicFree = async () => {
    setIsRunningTrigger('public_free');
    setSportBroadcastStatus(null);
    try {
      const res = await fetch('/api/telegram/broadcast-public-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetChat: publicChannelName.trim() })
      });
      const data = await res.json();
      if (data.ok) {
        setSportBroadcastStatus('✅ Picks Gratuitos publicados con éxito en el Canal Público.');
      } else {
        setSportBroadcastStatus(`❌ Error: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      setSportBroadcastStatus(`❌ Error de conexión: ${err.message}`);
    } finally {
      setIsRunningTrigger(null);
    }
  };

  const handleBroadcastVipTeaser = async () => {
    setIsRunningTrigger('vip_teaser');
    setSportBroadcastStatus(null);
    try {
      const res = await fetch('/api/telegram/broadcast-vip-teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetChat: publicChannelName.trim() })
      });
      const data = await res.json();
      if (data.ok) {
        setSportBroadcastStatus('✅ Teaser de Señales VIP & Combinada de Oro emitido al Canal Público.');
      } else {
        setSportBroadcastStatus(`❌ Error: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      setSportBroadcastStatus(`❌ Error de conexión: ${err.message}`);
    } finally {
      setIsRunningTrigger(null);
    }
  };

  const handleBroadcastGoldenParlayVIP = async () => {
    setIsRunningTrigger('golden_parlay_vip');
    setSportBroadcastStatus(null);
    try {
      const res = await fetch('/api/golden-parlay/broadcast-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetVipChat: vipChannelName.trim() || undefined,
          broadcastTeaserToPublic: true 
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSportBroadcastStatus('👑 Combinada de Oro VIP enviada al Canal VIP y Teaser promocional al Canal Público.');
      } else {
        setSportBroadcastStatus(`❌ Error: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      setSportBroadcastStatus(`❌ Error de conexión: ${err.message}`);
    } finally {
      setIsRunningTrigger(null);
    }
  };

  const handleCopyMessage = (logId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(logId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveChannel = () => {
    const trimmed = channelInput.trim();
    if (!trimmed) return;
    onUpdateChatId(trimmed);
    onUpdateChannelName(trimmed);
    setTestResult({
      status: 'idle',
      message: 'Canal guardado en la configuración local.'
    });
  };

  const handleSendTestMessage = async () => {
    const targetChat = channelInput.trim() || autoPilot.telegramChatId || '@FijasIA';
    setIsSendingTest(true);
    setTestResult({ status: 'idle', message: '' });

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const testMessageText = `🎯 <b>PRONÓSTICO OFICIAL (+EV) — FIJAS IA</b>

🏆 <b>Torneo:</b> Liga 1 Perú (Clausura) · ⚔️ <b>Partido:</b> Universitario vs Los Chankas · ⏰ <b>Hora:</b> Hoy, ${timeFormatted}

👉 <b>¿A qué apostar?:</b> Universitario -1.5 AH (Gana por 2 o más goles)
📈 <b>Cuota Recomendada:</b> @1.92 o más (Disponible en todas las casas)
💰 <b>Stake Sugerido:</b> 2.0 Unidades (Confianza: ALTA ⭐⭐⭐)

🧠 <b>Análisis Táctico IA:</b>
• Universitario registra 2.45 xG promedio en condición de local y 14 victorias consecutivas.
• Los Chankas presentan bajas defensivas críticas y conceden 1.8 goles por partido de visita.

👑 <i>Para ingresar al Canal VIP o enviar tu comprobante: <a href="https://t.me/SoporteFijasIA_bot">@SoporteFijasIA_bot</a></i>`;

    const res = await sendTelegramMessage(testMessageText, targetChat, 'HTML');
    setIsSendingTest(false);

    if (res.success) {
      setTestResult({
        status: 'success',
        message: `¡Mensaje de prueba enviado con éxito a ${targetChat}!`
      });
      onUpdateChatId(targetChat);
      onUpdateChannelName(targetChat);
    } else {
      setTestResult({
        status: 'error',
        message: `Error al enviar a Telegram: ${res.error}. Recuerda que el bot ${TELEGRAM_CONFIG.botUsername} debe ser ADMINISTRADOR en el canal.`
      });
    }
  };

  const handleRunTriggerWithFeedback = async (type: AutoPilotTriggerType) => {
    setIsRunningTrigger(type);
    try {
      await onTriggerManualRun(type);
    } finally {
      setIsRunningTrigger(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="autopilot-scheduler-modal"
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#090D16] border-2 border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#0A0F1D] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Piloto Automático 24/7 & Publicador Telegram
                </h2>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                  autoPilot.isEnabled 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {autoPilot.isEnabled ? 'ACTIVO 24/7' : 'PAUSADO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Picks Gratuitos, Señales VIP (+EV), Combinadas de Oro y Liquidación en Vivo • Bot: <strong className="text-emerald-400">{TELEGRAM_CONFIG.botUsername}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('triggers')}
            className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'triggers'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Disparadores & Envíos</span>
          </button>

          <button
            onClick={() => setActiveTab('volume')}
            className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'volume'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Volumen & Parlays VIP</span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'telegram'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4 text-rose-400" />
            <span>📡 Conexión Bot & Canal</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historial ({autoPilot.recentLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Plantillas Neutras</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: DISPARADORES DIARIOS */}
          {activeTab === 'triggers' && (
            <div className="space-y-5">
              
              {/* Master Status & Telegram Channel Banner */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className={`p-2.5 rounded-xl ${autoPilot.isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400">Canal / Chat de Telegram Conectado:</div>
                    <div className="text-sm font-black text-white flex items-center gap-2">
                      <span>{autoPilot.telegramChatId || autoPilot.telegramChannelName || '@FijasIA'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        BOT CONECTADO
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {onOpenVIPModal && (
                    <button
                      onClick={onOpenVIPModal}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Módulo VIP / Pagos</span>
                    </button>
                  )}

                  <button
                    onClick={onToggleAutoPilot}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md ${
                      autoPilot.isEnabled
                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                        : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {autoPilot.isEnabled ? 'Pausar Piloto Automático' : 'Activar Piloto Automático'}
                  </button>
                </div>
              </div>

              {/* Grid of the 4 Main Daily Operations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Pick Gratuito Destacado (Público) */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0A0F1D] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 relative group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase border border-emerald-500/30 flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        <span>1. Pick Gratuito (Público)</span>
                      </span>
                      <span className="text-xs font-black text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        09:00 AM
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                      1 Pronóstico Destacado del Día (+EV)
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Envía al canal público el mejor pick matemático del día con formato neutro, cuota recomendada disponible en todas las casas y llamado de acción al VIP.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Volumen: 1 Pick/Día</span>
                    <button
                      disabled={isRunningTrigger === 'morning_scan'}
                      onClick={() => handleRunTriggerWithFeedback('morning_scan')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-black text-emerald-400 text-[11px] font-bold border border-slate-700 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isRunningTrigger === 'morning_scan' ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Enviar Pick Gratuito</span>
                    </button>
                  </div>
                </div>

                {/* 2. Combinada de Oro (Parlay VIP) */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0A0F1D] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 relative group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase border border-amber-500/30 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>2. Combinada de Oro (VIP)</span>
                      </span>
                      <span className="text-xs font-black text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        10:00 AM
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                      Parlay Inteligente (2 a 3 Piernas @2.30 - @3.20)
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Agrupa selecciones de alta probabilidad matemática correlacionada con cuota total combinada superior a @2.30 y cálculo de valor positivo (+EV).
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Volumen: 1 Parlay/Día</span>
                    <button
                      disabled={isRunningTrigger === 'golden_parlay_vip'}
                      onClick={() => handleRunTriggerWithFeedback('golden_parlay_vip')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-black text-amber-400 text-[11px] font-bold border border-slate-700 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isRunningTrigger === 'golden_parlay_vip' ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Enviar Combinada</span>
                    </button>
                  </div>
                </div>

                {/* 3. Liquidación en Vivo (Post-Match) */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0A0F1D] border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between gap-3 relative group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-black text-[10px] uppercase border border-sky-500/30">
                        3. Liquidación En Vivo
                      </span>
                      <span className="text-xs font-black text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                        Post-Partido
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors">
                      Reporte de Resultado: Ganada ✅ / No Acertada ❌
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Emite al canal el reporte de cierre del partido con marcador final, unidades netas sumadas (+U) y auditoría en tiempo real.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Estado: En Vivo</span>
                    <button
                      disabled={isRunningTrigger === 'live_settlement'}
                      onClick={() => handleRunTriggerWithFeedback('live_settlement')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-black text-sky-400 text-[11px] font-bold border border-slate-700 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isRunningTrigger === 'live_settlement' ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Liquidar Pick Ganado</span>
                    </button>
                  </div>
                </div>

                {/* 4. Cierre Diario Auditado (23:00 PM) */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0A0F1D] border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3 relative group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-black text-[10px] uppercase border border-purple-500/30">
                        4. Cierre Diario Auditado
                      </span>
                      <span className="text-xs font-black text-purple-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        23:00 PM
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                      Resumen Oficial de Rendimiento (ROI & Unidades)
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Cuadre de caja diario con picks enviados, porcentaje de acierto (Win Rate), Yield diario y ganancia neta en Unidades (+U) y Soles (S/.).
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Horario: 23:00 PM</span>
                    <button
                      disabled={isRunningTrigger === 'nightly_audit'}
                      onClick={() => handleRunTriggerWithFeedback('nightly_audit')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-500 hover:text-black text-purple-400 text-[11px] font-bold border border-slate-700 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isRunningTrigger === 'nightly_audit' ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Enviar Cierre 23:00</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* SPECIAL SECTION: BROADCAST BY SPORT (SEPARATED SIGNALS 23/08/2026) */}
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-[#0c1220] to-[#0A0F1D] border-2 border-emerald-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Separación y Emisión de Señales (Público vs VIP)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Separa con precisión el contenido: envía picks gratuitos y teasers al <b>Canal Público</b>, y las señales completas + Combinadas de Oro al <b>Canal VIP</b>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      disabled={isRunningTrigger === 'public_free'}
                      onClick={handleBroadcastPublicFree}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-black border border-blue-500/40 text-xs font-bold transition-all disabled:opacity-50"
                      title="Envía únicamente el pick gratuito de Universitario vs Los Chankas y Real Madrid al canal público"
                    >
                      {isRunningTrigger === 'public_free' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>🎁</span>}
                      <span>Pick Gratuito (Público)</span>
                    </button>

                    <button
                      disabled={isRunningTrigger === 'vip_teaser'}
                      onClick={handleBroadcastVipTeaser}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold transition-all disabled:opacity-50"
                      title="Envía cartel promocional anunciando las señales VIP al canal público"
                    >
                      {isRunningTrigger === 'vip_teaser' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>⚡</span>}
                      <span>Teaser VIP (Público)</span>
                    </button>

                    <button
                      disabled={isRunningTrigger === 'golden_parlay_vip'}
                      onClick={handleBroadcastGoldenParlayVIP}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs shadow-lg shadow-amber-950/50 transition-all disabled:opacity-50"
                      title="Envía la Combinada de Oro @2.48 completa al Canal VIP"
                    >
                      {isRunningTrigger === 'golden_parlay_vip' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>👑</span>}
                      <span>Combinada de Oro VIP</span>
                    </button>
                  </div>
                </div>

                {/* Canal Selector Switch */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Destino de Emisión por Deporte:</span>
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setTargetAudience('vip')}
                        className={`px-2.5 py-1 rounded font-bold transition-all ${
                          targetAudience === 'vip' 
                            ? 'bg-amber-500 text-black shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        👑 Canal VIP
                      </button>
                      <button
                        onClick={() => setTargetAudience('public')}
                        className={`px-2.5 py-1 rounded font-bold transition-all ${
                          targetAudience === 'public' 
                            ? 'bg-blue-500 text-black shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        📢 Canal Público
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isRunningTrigger === 'sport_all_vip' || isRunningTrigger === 'sport_all_public'}
                      onClick={() => handleBroadcastSport('all', targetAudience === 'both' ? 'vip' : targetAudience)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-md disabled:opacity-50 ml-auto"
                    >
                      {isRunningTrigger?.startsWith('sport_all') ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Emitir Todos al {targetAudience === 'public' ? 'Canal Público' : 'Canal VIP'}</span>
                    </button>
                  </div>
                </div>

                {sportBroadcastStatus && (
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-xs font-mono text-emerald-300 animate-in fade-in flex items-center justify-between">
                    <span>{sportBroadcastStatus}</span>
                    <button 
                      onClick={() => setSportBroadcastStatus(null)} 
                      className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  
                  {/* 1. Fútbol */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                          <span>⚽</span> Fútbol de Élite
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          5 Partidos
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                        Premier League, La Liga EA Sports y Liga Argentina (Chelsea, Osasuna, Tigre).
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isRunningTrigger === 'sport_football_vip'}
                        onClick={() => handleBroadcastSport('football', 'vip')}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        {isRunningTrigger === 'sport_football_vip' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>👑</span>}
                        <span>A Canal VIP</span>
                      </button>
                      <button
                        disabled={isRunningTrigger === 'sport_football_public'}
                        onClick={() => handleBroadcastSport('football', 'public')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-black border border-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        title="Enviar al canal público"
                      >
                        {isRunningTrigger === 'sport_football_public' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>📢</span>}
                      </button>
                    </div>
                  </div>

                  {/* 2. Básquetbol NBA */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <span>🏀</span> Básquetbol NBA
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          3 Partidos
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                        WNBA y Torneos Internacionales (Minnesota Lynx vs Golden State Valkyries).
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isRunningTrigger === 'sport_basketball_vip'}
                        onClick={() => handleBroadcastSport('basketball', 'vip')}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        {isRunningTrigger === 'sport_basketball_vip' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>👑</span>}
                        <span>A Canal VIP</span>
                      </button>
                      <button
                        disabled={isRunningTrigger === 'sport_basketball_public'}
                        onClick={() => handleBroadcastSport('basketball', 'public')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-black border border-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        title="Enviar al canal público"
                      >
                        {isRunningTrigger === 'sport_basketball_public' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>📢</span>}
                      </button>
                    </div>
                  </div>

                  {/* 3. Tenis ATP */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                          <span>🎾</span> Tenis ATP Masters
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          2 Partidos
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                        Grand Slam y Circuito ATP/WTA Masters 1000 en curso.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isRunningTrigger === 'sport_tennis_vip'}
                        onClick={() => handleBroadcastSport('tennis', 'vip')}
                        className="flex-1 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500 text-sky-400 hover:text-black border border-sky-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        {isRunningTrigger === 'sport_tennis_vip' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>👑</span>}
                        <span>A Canal VIP</span>
                      </button>
                      <button
                        disabled={isRunningTrigger === 'sport_tennis_public'}
                        onClick={() => handleBroadcastSport('tennis', 'public')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-black border border-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        title="Enviar al canal público"
                      >
                        {isRunningTrigger === 'sport_tennis_public' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>📢</span>}
                      </button>
                    </div>
                  </div>

                  {/* 4. Béisbol MLB */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                          <span>⚾</span> Béisbol MLB
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          2 Partidos
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                        NY Yankees vs Red Sox (Over 8.5) y LA Dodgers vs Padres (Moneyline).
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isRunningTrigger === 'sport_baseball_vip'}
                        onClick={() => handleBroadcastSport('baseball', 'vip')}
                        className="flex-1 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-black border border-rose-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        {isRunningTrigger === 'sport_baseball_vip' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>👑</span>}
                        <span>A Canal VIP</span>
                      </button>
                      <button
                        disabled={isRunningTrigger === 'sport_baseball_public'}
                        onClick={() => handleBroadcastSport('baseball', 'public')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-black border border-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        title="Enviar al canal público"
                      >
                        {isRunningTrigger === 'sport_baseball_public' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>📢</span>}
                      </button>
                    </div>
                  </div>

                  {/* 5. UFC / MMA */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                          <span>🥊</span> UFC / MMA
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          1 Combate
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                        Islam Makhachev vs Arman Tsarukyan (Más de 2.5 Asaltos @1.78).
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isRunningTrigger === 'sport_mma_vip'}
                        onClick={() => handleBroadcastSport('mma', 'vip')}
                        className="flex-1 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500 text-purple-400 hover:text-black border border-purple-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        {isRunningTrigger === 'sport_mma_vip' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>👑</span>}
                        <span>A Canal VIP</span>
                      </button>
                      <button
                        disabled={isRunningTrigger === 'sport_mma_public'}
                        onClick={() => handleBroadcastSport('mma', 'public')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-black border border-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        title="Enviar al canal público"
                      >
                        {isRunningTrigger === 'sport_mma_public' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>📢</span>}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOLUME CONFIGURATION & GOLDEN PARLAY */}
          {activeTab === 'volume' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Configuración de Volumen Diario de Señales & Parlays</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El motor algorítmico distribuye los pronósticos según el nivel de acceso (Canal Público vs. Suscriptores VIP):
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  
                  {/* Public Pick */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">Canal Público</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">1 Pick / Día</span>
                    </div>
                    <div className="text-lg font-black text-white">1 Pick Gratuito</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      El pronóstico simple de mayor solidez matemática del día (+EV) para generar atracción y confianza.
                    </p>
                  </div>

                  {/* VIP High Value Signals */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">Canal VIP Privado</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">3 a 6 Picks</span>
                    </div>
                    <div className="text-lg font-black text-white">3 a 6 Señales +EV</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Oportunidades con ventaja matemática (+EV {'>'} +8%) en mercados de Hándicaps, Goles y Ambos Anotan.
                    </p>
                  </div>

                  {/* Golden Parlay */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400">Exclusivo VIP</span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">1 Parlay / Día</span>
                    </div>
                    <div className="text-lg font-black text-white">Combinada de Oro</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Combinada de 2 a 3 piernas de alta probabilidad conjunta con cuotas totales entre @2.30 y @3.20.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEGRAM CONNECTION & LIVE TEST */}
          {activeTab === 'telegram' && (
            <div className="space-y-6">
              
              {/* Official Bot Config Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <KeyRound className="w-4 h-4" />
                  <span>Credenciales Oficiales de Telegram Bot Conectadas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Token Oficial del Bot:</span>
                    <span className="font-mono text-emerald-400 font-bold text-xs break-all">
                      {TELEGRAM_CONFIG.botToken}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Username del Bot:</span>
                    <span className="font-bold text-white text-sm flex items-center gap-1">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      {TELEGRAM_CONFIG.botUsername}
                    </span>
                  </div>
                </div>
              </div>

              {/* Destination Channel / Chat ID Setup Form */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-4 shadow-xl">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Configurar Canal de Telegram de Destino</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ingresa el nombre público de tu canal (ejemplo: <code>@FijasIA</code>) o el Chat ID numérico donde el Bot tiene permisos de publicar.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      id="telegram-channel-input"
                      type="text"
                      value={channelInput}
                      onChange={(e) => setChannelInput(e.target.value)}
                      placeholder="@FijasIA o ID numérico"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-white font-mono text-xs placeholder:text-slate-500 outline-none"
                    />
                  </div>

                  <button
                    id="save-telegram-channel-btn"
                    onClick={handleSaveChannel}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all shrink-0"
                  >
                    Guardar Destino
                  </button>

                  <button
                    id="send-telegram-live-test-btn"
                    disabled={isSendingTest}
                    onClick={handleSendTestMessage}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 shrink-0"
                  >
                    {isSendingTest ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>📡 Enviar Mensaje de Prueba a Telegram</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Feedback */}
                {testResult.message && (
                  <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                    testResult.status === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                      : testResult.status === 'error'
                      ? 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-300'
                  }`}>
                    {testResult.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : testResult.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed whitespace-pre-line">{testResult.message}</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: LIVE AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Historial de ejecuciones automáticas con Token oficial {TELEGRAM_CONFIG.botUsername}</span>
                <span className="font-semibold text-emerald-400">Destino: {autoPilot.telegramChatId || autoPilot.telegramChannelName}</span>
              </div>

              <div className="space-y-2.5">
                {autoPilot.recentLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.type === 'morning_scan' || log.type === 'morning_free_pick'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : log.type === 'golden_parlay_vip'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : log.type === 'live_settlement'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {log.type === 'morning_scan' ? 'Pick Gratuito 09:00' : log.type === 'golden_parlay_vip' ? 'Combinada VIP' : log.type === 'live_settlement' ? 'Liquidación' : 'Cierre 23:00'}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{log.timestamp}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          TELEGRAM ENVIADO
                        </span>
                      </div>
                      
                      <div className="font-bold text-white text-sm">
                        {log.title}
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                        {log.message}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyMessage(log.id, log.message)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition-all shrink-0 self-end sm:self-start"
                      title="Copiar texto enviado a Telegram"
                    >
                      {copiedId === log.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TELEGRAM PREVIEW TEMPLATES */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className="text-xs text-slate-400">
                Plantillas 100% neutras y profesionales listas para emitirse a través de <strong>{TELEGRAM_CONFIG.botUsername}</strong>:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Preview Pick Individual */}
                <div className="p-4 rounded-2xl bg-[#17212B] border border-[#232E3C] shadow-2xl text-slate-100 font-sans text-xs space-y-3">
                  <div className="font-black text-emerald-400 text-sm">
                    🎯 PRONÓSTICO OFICIAL (+EV) — FIJAS IA
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    🏆 <b>Torneo:</b> Liga 1 Perú · ⚔️ <b>Partido:</b> Universitario vs Los Chankas · ⏰ <b>Hora:</b> Hoy, 20:00
                  </div>
                  <div className="text-emerald-300 font-bold">
                    👉 <b>¿A qué apostar?:</b> Universitario -1.5 AH (Gana por 2 o más goles)
                  </div>
                  <div className="text-slate-200">
                    📈 <b>Cuota Recomendada:</b> @1.92 o más (Disponible en todas las casas)
                  </div>
                  <div className="text-slate-200">
                    💰 <b>Stake Sugerido:</b> 2.0 Unidades (Confianza: ALTA ⭐⭐⭐)
                  </div>
                  <div className="p-2 rounded bg-black/40 text-[11px] text-slate-300">
                    🧠 <b>Análisis Táctico IA:</b><br/>
                    • Universitario registra 2.45 xG promedio de local y 14 triunfos al hilo.<br/>
                    • Los Chankas tienen suspendido a su central titular.
                  </div>
                  <div className="text-amber-300 font-medium text-[11px]">
                    👑 <i>Canal VIP: Suscríbete por Yape/Plin para recibir todos los picks diarios.</i>
                  </div>
                </div>

                {/* 2. Preview Combinada de Oro */}
                <div className="p-4 rounded-2xl bg-[#17212B] border border-[#232E3C] shadow-2xl text-slate-100 font-sans text-xs space-y-3">
                  <div className="font-black text-amber-400 text-sm">
                    🔥 COMBINADA DE ORO DEL DÍA — FIJAS IA (PARLAY VIP)
                  </div>
                  <div className="space-y-1.5 text-slate-200 text-[11px]">
                    <div>1️⃣ <b>Fulham vs Chelsea:</b> Chelsea Ganador & Más de 1.5 Goles @1.85 (Hoy 15:00 Lima)</div>
                    <div>2️⃣ <b>Elche vs Barcelona:</b> Barcelona Ganador Directo @1.38 (Hoy 14:30 Lima)</div>
                    <div>3️⃣ <b>LA Dodgers vs Pirates:</b> Dodgers Ganador ML @1.42 (Hoy 15:10 Lima)</div>
                  </div>
                  <div className="text-amber-300 font-extrabold text-xs">
                    📊 CUOTA TOTAL COMBINADA: @2.62
                  </div>
                  <div className="text-slate-200">
                    💰 <b>Stake Recomendado:</b> 2.5 Unidades (S/. 125.00)
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    🧠 <b>Probabilidad Conjunta IA:</b> 71.0% (+EV Alta Certeza)
                  </div>
                  <div className="text-amber-300 font-medium text-[11px] pt-1">
                    👑 <i>Canal VIP: Suscríbete por Yape/Plin para recibir todos los picks diarios.</i>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#070A12] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Bot: {TELEGRAM_CONFIG.botUsername} • Envíos directos a Telegram</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};

