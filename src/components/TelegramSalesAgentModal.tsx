import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Crown, 
  CreditCard, 
  BarChart3, 
  HelpCircle, 
  MessageSquare, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Radio,
  ArrowRight,
  User,
  Check
} from 'lucide-react';
import { 
  TELEGRAM_CONFIG, 
  DEFAULT_VIP_PLANS, 
  DEFAULT_PAYMENT_SETTINGS, 
  InlineKeyboardMarkup,
  askSalesSupportAgent,
  sendTelegramMessage,
  getStartWelcomeMessage,
  getStartInlineKeyboard,
  getPlansDetailMessage,
  getPlansInlineKeyboard,
  getPaymentDetailsMessage,
  getPaymentInlineKeyboard,
  getStatsMessage,
  getStatsInlineKeyboard,
  getHowItWorksMessage,
  getHowItWorksInlineKeyboard
} from '../services/telegramService';
import { VIPPlan, PaymentSettings } from '../types';

interface TelegramSalesAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vipPlans?: VIPPlan[];
  paymentSettings?: PaymentSettings;
  onOpenPaymentModal?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  replyMarkup?: InlineKeyboardMarkup;
  source?: string;
}

export const TelegramSalesAgentModal: React.FC<TelegramSalesAgentModalProps> = ({
  isOpen,
  onClose,
  vipPlans = DEFAULT_VIP_PLANS,
  paymentSettings = DEFAULT_PAYMENT_SETTINGS,
  onOpenPaymentModal
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-start',
      sender: 'bot',
      text: getStartWelcomeMessage('Inversionista Deportivo'),
      timestamp: 'Ahora',
      replyMarkup: getStartInlineKeyboard(),
      source: 'Menú Inicial /start'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [targetChatId, setTargetChatId] = useState(TELEGRAM_CONFIG.defaultChatId);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Fetch live bot polling status
    if (isOpen) {
      fetch('/api/telegram/bot-status')
        .then(r => r.json())
        .then(data => {
          if (data && typeof data.isPollingActive === 'boolean') {
            setIsPollingActive(data.isPollingActive);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askSalesSupportAgent(textToSend, { name: 'Inversionista' });
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.answerText,
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: response.replyMarkup,
        source: response.source
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: getStartWelcomeMessage(),
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: getStartInlineKeyboard(),
        source: 'Motor de Contingencia'
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = (action: string) => {
    if (action === 'menu_plans') {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: getPlansDetailMessage(vipPlans),
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: getPlansInlineKeyboard(),
        source: 'Módulo de Planes VIP'
      };
      setMessages(prev => [...prev, botMsg]);
    } else if (action === 'menu_payment') {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: getPaymentDetailsMessage(paymentSettings),
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: getPaymentInlineKeyboard(),
        source: 'Módulo de Pagos'
      };
      setMessages(prev => [...prev, botMsg]);
    } else if (action === 'menu_stats') {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: getStatsMessage(),
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: getStatsInlineKeyboard(),
        source: 'Auditoría Cuantitativa'
      };
      setMessages(prev => [...prev, botMsg]);
    } else if (action === 'menu_help') {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: getHowItWorksMessage(),
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: getHowItWorksInlineKeyboard(),
        source: 'Guía de Funcionamiento'
      };
      setMessages(prev => [...prev, botMsg]);
    } else if (action === 'menu_start') {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: getStartWelcomeMessage('Inversionista Deportivo'),
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        replyMarkup: getStartInlineKeyboard(),
        source: 'Menú Principal'
      };
      setMessages(prev => [...prev, botMsg]);
    }
  };

  const handleDispatchLiveStart = async () => {
    setIsDispatching(true);
    setDispatchStatus(null);

    try {
      const welcomeText = getStartWelcomeMessage('Comunidad FIJAS IA');
      const keyboard = getStartInlineKeyboard();
      const res = await sendTelegramMessage(welcomeText, targetChatId, 'HTML', keyboard);

      if (res.success) {
        setDispatchStatus('✅ Menú interactivo con botones transmitido con éxito a Telegram.');
      } else {
        setDispatchStatus(`⚠️ Nota: ${res.error || 'Verifica permisos del bot en el canal.'}`);
      }
    } catch (e: any) {
      setDispatchStatus(`❌ Error de conexión: ${e.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const quickPrompts = [
    { label: '⚽ Casas compatibles', query: '¿En qué casas de apuestas puedo apostar estas señales?' },
    { label: '🏦 Gestión Kelly', query: '¿Cómo calculan el stake y protegen el bankroll con Kelly?' },
    { label: '🎯 Tasa de Acierto', query: '¿Cuál es la tasa de acierto y rentabilidad mensual auditada?' },
    { label: '💳 Pagar por Yape', query: 'Quiero pagar el Plan Mensual por Yape, ¿cómo procedo?' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[820px] bg-[#0A0E1A] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0A0E1A] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Agente Automático de Ventas & Soporte VIP
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  Motor Neural
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Bot Oficial:</span>
                <a 
                  href={`https://t.me/${TELEGRAM_CONFIG.botUsername.replace('@', '')}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                >
                  {TELEGRAM_CONFIG.botUsername}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Respondiendo 24/7
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://t.me/${TELEGRAM_CONFIG.botUsername.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Abrir en Telegram</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns (Simulator on Left, Controls & Quick Payments on Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Interactive Telegram Bot Phone Simulator */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#070B14] overflow-hidden">
            
            {/* Phone Simulator Top Bar */}
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-black">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-white flex items-center gap-1.5 text-xs leading-none">
                    FIJAS IA • Asistente Oficial
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">bot • responde de inmediato</div>
                </div>
              </div>

              <button
                onClick={() => setMessages([{
                  id: 'msg-reset',
                  sender: 'bot',
                  text: getStartWelcomeMessage(),
                  timestamp: 'Ahora',
                  replyMarkup: getStartInlineKeyboard(),
                  source: 'Reinicio /start'
                }])}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                title="Reiniciar chat de prueba"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reiniciar /start</span>
              </button>
            </div>

            {/* Chat Messages Log */}
            <div 
              ref={chatScrollRef}
              className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs custom-scrollbar bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-[#070B14]"
            >
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-[92%] sm:max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto'}`}
                  >
                    {/* Bubble Content */}
                    <div 
                      className={`p-3.5 rounded-2xl shadow-md ${
                        isBot 
                          ? 'bg-[#151D2F] border border-slate-700/80 text-slate-100 rounded-tl-sm' 
                          : 'bg-emerald-600 text-white rounded-tr-sm'
                      }`}
                    >
                      <div 
                        className="leading-relaxed whitespace-pre-wrap font-sans text-xs break-words"
                        dangerouslySetInnerHTML={{ __html: msg.text }}
                      />

                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-700/40 text-[10px] text-slate-400">
                        {isBot && msg.source && (
                          <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {msg.source}
                          </span>
                        )}
                        <span className="ml-auto font-mono text-[9px] text-slate-400">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Inline Buttons for Bot Message */}
                    {isBot && msg.replyMarkup && msg.replyMarkup.inline_keyboard && (
                      <div className="mt-2 w-full flex flex-col gap-1.5 animate-in fade-in duration-150">
                        {msg.replyMarkup.inline_keyboard.map((row, rIdx) => (
                          <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {row.map((btn, bIdx) => {
                              if (btn.url) {
                                return (
                                  <a
                                    key={bIdx}
                                    href={btn.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all shadow-sm group text-center"
                                  >
                                    <span>{btn.text}</span>
                                    <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                  </a>
                                );
                              }
                              return (
                                <button
                                  key={bIdx}
                                  onClick={() => btn.callback_data && handleButtonClick(btn.callback_data)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95 text-center"
                                >
                                  <span>{btn.text}</span>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#151D2F] border border-slate-700/80 text-slate-400 max-w-[200px] text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>El Motor Neural está respondiendo...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-900/70 overflow-x-auto flex gap-1.5 custom-scrollbar">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.query)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Message Input Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Escribe una pregunta (ej: ¿Cómo funciona Kelly? o ¿Planes VIP?)..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-slate-700 focus:border-emerald-500 focus:outline-none text-xs text-white placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Bot Controls, Plans, Payments & Live Dispatch */}
          <div className="lg:col-span-5 p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar bg-[#0A0E1A]">
            
            {/* Live Broadcast / Dispatch Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Transmisión en Vivo a Telegram
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-black">
                  Activo
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Envía el <b>Menú Principal Interactivo (/start)</b> con todos los botones a tu canal o a un usuario específico:
              </p>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-semibold">Canal o ID Destinatario:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={targetChatId}
                    onChange={(e) => setTargetChatId(e.target.value)}
                    placeholder="@FijasIA o ID numérico"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    onClick={handleDispatchLiveStart}
                    disabled={isDispatching}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isDispatching ? 'Enviando...' : 'Transmitir'}</span>
                  </button>
                </div>
              </div>

              {dispatchStatus && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  {dispatchStatus}
                </div>
              )}
            </div>

            {/* Official Payment Accounts (Yape, Plin, Binance) */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs text-white">Cuentas de Pago Oficiales</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Perú & Cripto</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Yape */}
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-black text-purple-300">
                    <span>🇵🇪 Yape</span>
                    <button 
                      onClick={() => handleCopy(paymentSettings.yapeNumber, 'yape')}
                      className="text-purple-400 hover:text-purple-200"
                      title="Copiar número"
                    >
                      {copiedKey === 'yape' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-bold text-white">{paymentSettings.yapeNumber}</div>
                  <div className="text-[10px] text-purple-400/80">{paymentSettings.yapeHolder}</div>
                </div>

                {/* Plin */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-black text-cyan-300">
                    <span>🇵🇪 Plin</span>
                    <button 
                      onClick={() => handleCopy(paymentSettings.plinNumber, 'plin')}
                      className="text-cyan-400 hover:text-cyan-200"
                      title="Copiar número"
                    >
                      {copiedKey === 'plin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-bold text-white">{paymentSettings.plinNumber}</div>
                  <div className="text-[10px] text-cyan-400/80">{paymentSettings.plinHolder}</div>
                </div>

                {/* Binance Pay */}
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
                    <span>🌐 Binance Pay ID</span>
                    <button 
                      onClick={() => handleCopy(paymentSettings.binancePayId, 'binance')}
                      className="text-amber-400 hover:text-amber-200"
                      title="Copiar Binance ID"
                    >
                      {copiedKey === 'binance' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-bold text-white">{paymentSettings.binancePayId}</div>
                  <div className="text-[10px] text-amber-400/80">USDT / BNB Chain</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  El usuario envía la captura a <b>{paymentSettings.telegramSupportUser}</b> y recibe su enlace VIP de inmediato.
                </span>
              </div>
            </div>

            {/* VIP Plans Summary Table */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-white">Planes & Tarifas VIP</span>
                </div>
                {onOpenPaymentModal && (
                  <button
                    onClick={onOpenPaymentModal}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                  >
                    Ver detalles
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {vipPlans.map((plan) => (
                  <div 
                    key={plan.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {plan.name}
                        {plan.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{plan.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-400">S/ {plan.priceSoles.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">${plan.priceUsdt} USDT</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
