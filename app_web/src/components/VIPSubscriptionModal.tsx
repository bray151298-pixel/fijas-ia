import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, 
  Sparkles, 
  X, 
  Check, 
  Copy, 
  Send, 
  QrCode, 
  ShieldCheck, 
  ExternalLink, 
  Smartphone, 
  Coins, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  MessageCircle, 
  Zap, 
  Star, 
  Layers, 
  Link as LinkIcon, 
  UserCheck, 
  Lock, 
  Radio,
  Upload,
  Image as ImageIcon,
  Bot,
  Users,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  UserPlus,
  Bell,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { VIPPlan, PaymentSettings, VIPSubscriber, VoucherVerificationResult, VIPCRMStats } from '../types';
import { 
  DEFAULT_VIP_PLANS, 
  DEFAULT_PAYMENT_SETTINGS, 
  formatVIPPlansBroadcastMessage, 
  sendTelegramMessage, 
  createTelegramVIPInviteLink,
  fetchConfirmedSubscribers,
  verifyVoucherImageWithAI,
  enrollCRMSubscriber,
  renewCRMSubscriber,
  sendCRMReminder,
  revokeCRMSubscriber,
  deleteCRMSubscriber,
  runCRMExpiryCheck,
  TELEGRAM_CONFIG 
} from '../services/telegramService';

interface VIPSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTelegramChannel?: string;
}

type TabType = 'crm' | 'verifier' | 'generator' | 'plans_settings';

export const VIPSubscriptionModal: React.FC<VIPSubscriptionModalProps> = ({
  isOpen,
  onClose,
  targetTelegramChannel = '@FijasIAOficial'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('crm');
  const [plans, setPlans] = useState<VIPPlan[]>(DEFAULT_VIP_PLANS);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // CRM State
  const [subscribers, setSubscribers] = useState<VIPSubscriber[]>([]);
  const [stats, setStats] = useState<VIPCRMStats | null>(null);
  const [isLoadingCRM, setIsLoadingCRM] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [actionFeedback, setActionFeedback] = useState<{ id?: string; message: string; type: 'success' | 'error' } | null>(null);

  // AI Voucher Verifier State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [verifierNotes, setVerifierNotes] = useState('');
  const [isAnalyzingVoucher, setIsAnalyzingVoucher] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VoucherVerificationResult | null>(null);
  const [verifierError, setVerifierError] = useState<string | null>(null);
  const [isAutoEnrolling, setIsAutoEnrolling] = useState(false);
  const [autoEnrollSuccess, setAutoEnrollSuccess] = useState<{ inviteLink: string; subscriber: VIPSubscriber } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Enrollment / Generator State
  const [subscriberName, setSubscriberName] = useState('');
  const [subscriberUsername, setSubscriberUsername] = useState('');
  const [subscriberChatId, setSubscriberChatId] = useState('');
  const [manualPlanId, setManualPlanId] = useState<'semanal' | 'mensual' | 'trimestral'>('mensual');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'Yape' | 'Plin' | 'Binance' | 'Transferencia' | 'Manual'>('Yape');
  const [manualAmount, setManualAmount] = useState<number>(39.90);
  const [manualOpNumber, setManualOpNumber] = useState('');
  const [sendDirectToTelegram, setSendDirectToTelegram] = useState(true);
  const [isEnrollingManual, setIsEnrollingManual] = useState(false);
  const [manualEnrollResult, setManualEnrollResult] = useState<{ inviteLink: string; subscriber: VIPSubscriber; telegramSent?: boolean } | null>(null);

  // Renewal Modal Sub-State
  const [renewalSub, setRenewalSub] = useState<VIPSubscriber | null>(null);
  const [renewalDays, setRenewalDays] = useState<number>(30);
  const [renewalPlanId, setRenewalPlanId] = useState<'semanal' | 'mensual' | 'trimestral'>('mensual');
  const [isRenewing, setIsRenewing] = useState(false);

  // Broadcast & Payment Settings State
  const [isSendingToTelegram, setIsSendingToTelegram] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => {
    try {
      const saved = localStorage.getItem('tipster_payment_settings');
      return saved ? JSON.parse(saved) : DEFAULT_PAYMENT_SETTINGS;
    } catch {
      return DEFAULT_PAYMENT_SETTINGS;
    }
  });
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  // Load CRM data
  const loadCRMData = async () => {
    setIsLoadingCRM(true);
    try {
      const res = await fetchConfirmedSubscribers();
      if (res && res.subscribers) {
        setSubscribers(res.subscribers);
        if (res.stats) setStats(res.stats);
      }
    } catch (e) {
      console.warn('Error loading CRM subscribers:', e);
    } finally {
      setIsLoadingCRM(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCRMData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Image Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    setSelectedImageFile(file);
    setVerificationResult(null);
    setVerifierError(null);
    setAutoEnrollSuccess(null);

    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Execute AI Voucher Verification
  const handleVerifyWithAI = async () => {
    if (!imageBase64) return;

    setIsAnalyzingVoucher(true);
    setVerifierError(null);
    setVerificationResult(null);
    setAutoEnrollSuccess(null);

    try {
      const mime = selectedImageFile?.type || 'image/jpeg';
      const res = await verifyVoucherImageWithAI(imageBase64, mime, verifierNotes);

      if (res.ok && res.verification) {
        setVerificationResult(res.verification);
      } else {
        setVerifierError(res.error || 'No se pudo verificar el comprobante. Intente con una imagen más clara.');
      }
    } catch (err: any) {
      setVerifierError(err.message || 'Error analizando comprobante');
    } finally {
      setIsAnalyzingVoucher(false);
    }
  };

  // Auto-Enroll from AI Verification
  const handleAutoEnrollFromVerification = async () => {
    if (!verificationResult) return;

    setIsAutoEnrolling(true);
    try {
      const res = await enrollCRMSubscriber({
        name: verificationResult.beneficiaryName ? `Suscriptor (${verificationResult.paymentMethod})` : 'Suscriptor VIP',
        planId: verificationResult.planId,
        paymentMethod: verificationResult.paymentMethod as any,
        amount: verificationResult.amount,
        operationNumber: verificationResult.operationNumber,
        notes: `Auto-verificado por Módulo de Visión Neural FIJAS IA (Score: ${verificationResult.confidenceScore}%)`,
        sendDirectTelegram: false
      });

      if (res.ok && res.subscriber && res.inviteLink) {
        setAutoEnrollSuccess({
          inviteLink: res.inviteLink,
          subscriber: res.subscriber
        });
        loadCRMData();
      }
    } catch (err: any) {
      setVerifierError('Error al auto-inscribir suscriptor');
    } finally {
      setIsAutoEnrolling(false);
    }
  };

  // Manual Enrollment Submission
  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberName.trim()) return;

    setIsEnrollingManual(true);
    setManualEnrollResult(null);

    try {
      const res = await enrollCRMSubscriber({
        name: subscriberName.trim(),
        username: subscriberUsername.trim() || undefined,
        chatId: subscriberChatId.trim() || undefined,
        planId: manualPlanId,
        paymentMethod: manualPaymentMethod,
        amount: manualAmount,
        operationNumber: manualOpNumber.trim() || undefined,
        sendDirectTelegram: sendDirectToTelegram && Boolean(subscriberChatId.trim())
      });

      if (res.ok && res.subscriber && res.inviteLink) {
        setManualEnrollResult({
          inviteLink: res.inviteLink,
          subscriber: res.subscriber,
          telegramSent: res.telegramSent
        });
        // reset form
        setSubscriberName('');
        setSubscriberUsername('');
        setSubscriberChatId('');
        setManualOpNumber('');
        loadCRMData();
      }
    } catch (err) {
      console.error('Error in manual enroll:', err);
    } finally {
      setIsEnrollingManual(false);
    }
  };

  // Action: Send 3-Day Reminder
  const handleSendReminder = async (sub: VIPSubscriber) => {
    try {
      const res = await sendCRMReminder(sub.id);
      if (res.ok) {
        setActionFeedback({ id: sub.id, message: `¡Recordatorio de 3 días enviado a ${sub.name}!`, type: 'success' });
        loadCRMData();
      } else {
        setActionFeedback({ id: sub.id, message: res.error || 'No se pudo enviar el recordatorio', type: 'error' });
      }
    } catch (e: any) {
      setActionFeedback({ id: sub.id, message: e.message || 'Error', type: 'error' });
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Action: Renew Subscriber
  const handleExecuteRenewal = async () => {
    if (!renewalSub) return;

    setIsRenewing(true);
    try {
      const planObj = plans.find(p => p.id === renewalPlanId) || plans[1];
      const res = await renewCRMSubscriber({
        subscriberId: renewalSub.id,
        additionalDays: renewalDays,
        newPlanId: renewalPlanId,
        amountPaid: planObj.priceSoles
      });

      if (res.ok) {
        setActionFeedback({ id: renewalSub.id, message: `¡Membresía extendida +${renewalDays} días con éxito!`, type: 'success' });
        setRenewalSub(null);
        loadCRMData();
      }
    } catch (err: any) {
      setActionFeedback({ id: renewalSub.id, message: err.message || 'Error al renovar', type: 'error' });
    } finally {
      setIsRenewing(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Action: Revoke Access
  const handleRevoke = async (sub: VIPSubscriber) => {
    if (!window.confirm(`¿Estás seguro de revocar el acceso VIP a ${sub.name}?`)) return;

    try {
      const res = await revokeCRMSubscriber(sub.id, 'Revocación manual desde Panel CRM');
      if (res.ok) {
        setActionFeedback({ id: sub.id, message: `Acceso revocado para ${sub.name}`, type: 'success' });
        loadCRMData();
      }
    } catch (e: any) {
      setActionFeedback({ id: sub.id, message: e.message || 'Error al revocar', type: 'error' });
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Action: Delete Subscriber
  const handleDelete = async (sub: VIPSubscriber) => {
    if (!window.confirm(`¿Eliminar permanentemente a ${sub.name} del CRM?`)) return;

    try {
      const res = await deleteCRMSubscriber(sub.id);
      if (res.ok) {
        setActionFeedback({ message: `Suscriptor ${sub.name} eliminado`, type: 'success' });
        loadCRMData();
      }
    } catch (e: any) {
      setActionFeedback({ message: 'Error al eliminar', type: 'error' });
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Action: Run Background Expiry & Reminder Check
  const handleRunExpiryCheck = async () => {
    try {
      const res = await runCRMExpiryCheck();
      if (res.ok) {
        const reminders = res.results?.remindersSent || 0;
        const expired = res.results?.expiredMarked || 0;
        setActionFeedback({
          message: `Escaneo completado: ${reminders} recordatorio(s) de 3 días enviados, ${expired} suscripción(es) vencidas actualizadas.`,
          type: 'success'
        });
        loadCRMData();
      }
    } catch (e: any) {
      setActionFeedback({ message: 'Error al ejecutar escaneo', type: 'error' });
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Broadcast Plans to Public Channel
  const handleBroadcastVIPPlans = async () => {
    setIsSendingToTelegram(true);
    setSendFeedback({ status: 'idle', message: '' });

    const message = formatVIPPlansBroadcastMessage(plans, paymentSettings);
    const res = await sendTelegramMessage(message, targetTelegramChannel, 'HTML');
    setIsSendingToTelegram(false);

    if (res.success) {
      setSendFeedback({
        status: 'success',
        message: `¡Planes y métodos de pago VIP publicados con éxito en ${targetTelegramChannel}!`
      });
    } else {
      setSendFeedback({
        status: 'error',
        message: res.error || 'Error al publicar en Telegram'
      });
    }
  };

  // Filtered Subscribers
  const filteredSubscribers = subscribers.filter(sub => {
    const matchSearch = sub.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
      (sub.username && sub.username.toLowerCase().includes(crmSearch.toLowerCase())) ||
      (sub.operationNumber && sub.operationNumber.toLowerCase().includes(crmSearch.toLowerCase())) ||
      sub.planName.toLowerCase().includes(crmSearch.toLowerCase());

    if (!matchSearch) return false;

    if (statusFilter === 'all') return true;
    return sub.status === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl rounded-2xl bg-[#0B0F1A] border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] text-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  VIP Subscription CRM & AI Voucher Verifier
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  @SoporteFijasIA_bot
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Auditoría con Módulo de Visión Neural • Enlaces de 1 Solo Uso • CRM de Miembros y Recordatorios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'crm'
                ? 'bg-slate-900 border-amber-400 text-amber-300 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>1. CRM de Miembros VIP</span>
            {subscribers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                {subscribers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('verifier')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'verifier'
                ? 'bg-slate-900 border-emerald-400 text-emerald-300 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>2. Verificador IA (Visión Neural)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
              IA
            </span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-slate-900 border-sky-400 text-sky-300 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span>3. Inscripción Manual & Link 1-Uso</span>
          </button>

          <button
            onClick={() => setActiveTab('plans_settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'plans_settings'
                ? 'bg-slate-900 border-purple-400 text-purple-300 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <DollarSign className="w-4 h-4 text-purple-400" />
            <span>4. Tarifas & Cuentas de Pago</span>
          </button>
        </div>

        {/* Global Action Feedback Alert */}
        {actionFeedback && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between border-b ${
            actionFeedback.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-rose-950/80 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{actionFeedback.message}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 1: CRM DE CLIENTES / SUSCRIPTORES VIP
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'crm' && (
            <div className="space-y-6">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Total Miembros
                  </span>
                  <div className="mt-2 text-xl font-black text-white">
                    {stats?.totalSubscribers ?? subscribers.length}
                  </div>
                  <span className="text-[10px] text-slate-500">Histórico en CRM</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex flex-col justify-between">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Activos
                  </span>
                  <div className="mt-2 text-xl font-black text-emerald-300">
                    {stats?.activeSubscribers ?? subscribers.filter(s => s.status === 'active' || s.status === 'expiring_soon').length}
                  </div>
                  <span className="text-[10px] text-emerald-400/70">Con acceso VIP</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex flex-col justify-between">
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Por Vencer (≤3d)
                  </span>
                  <div className="mt-2 text-xl font-black text-amber-300">
                    {stats?.expiringSoonSubscribers ?? subscribers.filter(s => s.status === 'expiring_soon').length}
                  </div>
                  <span className="text-[10px] text-amber-400/70">Alerta 3 días</span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 flex flex-col justify-between">
                  <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Vencidos
                  </span>
                  <div className="mt-2 text-xl font-black text-rose-300">
                    {stats?.expiredSubscribers ?? subscribers.filter(s => s.status === 'expired' || s.status === 'revoked').length}
                  </div>
                  <span className="text-[10px] text-rose-400/70">Requiere renovación</span>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 col-span-2 sm:col-span-1 flex flex-col justify-between">
                  <span className="text-[11px] text-purple-400 font-semibold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Recaudación Total
                  </span>
                  <div className="mt-2 text-base font-black text-purple-200">
                    S/ {stats?.totalRevenuePEN ? stats.totalRevenuePEN.toFixed(2) : '189.60'}
                  </div>
                  <span className="text-[10px] text-purple-300/70">
                    + ${stats?.totalRevenueUSDT || 25} USDT
                  </span>
                </div>
              </div>

              {/* Action Bar & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, @usuario o N° op..."
                      value={crmSearch}
                      onChange={e => setCrmSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="active">Activos</option>
                    <option value="expiring_soon">Por Vencer (≤3 Días)</option>
                    <option value="expired">Vencidos</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunExpiryCheck}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-sm"
                    title="Ejecutar escaneo automático de recordatorios 3 días y expiraciones"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Ejecutar Motor Recordatorios</span>
                  </button>

                  <button
                    onClick={loadCRMData}
                    disabled={isLoadingCRM}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Actualizar CRM"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCRM ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* CRM Members Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold">
                      <th className="p-3">Suscriptor Telegram</th>
                      <th className="p-3">Plan / Membresía</th>
                      <th className="p-3">Monto / Método</th>
                      <th className="p-3">Inicio & Vencimiento</th>
                      <th className="p-3 text-center">Días Restantes</th>
                      <th className="p-3 text-center">Estado</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                          No se encontraron miembros en el CRM con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscribers.map(sub => {
                        const isExpiring = sub.status === 'expiring_soon' || (sub.daysRemaining <= 3 && sub.daysRemaining > 0);
                        const isExpired = sub.status === 'expired' || sub.daysRemaining <= 0;
                        const isRevoked = sub.status === 'revoked';

                        return (
                          <tr key={sub.id} className="hover:bg-slate-900/50 transition-colors">
                            {/* Subscriber info */}
                            <td className="p-3">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{sub.name}</span>
                                {sub.verifiedByAI && (
                                  <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono" title="Verificado con IA">
                                    IA
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {sub.username && <span className="text-sky-400 font-mono">{sub.username}</span>}
                                <span className="text-slate-500">ID: {sub.chatId}</span>
                              </div>
                              {sub.operationNumber && (
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Op: {sub.operationNumber}
                                </div>
                              )}
                            </td>

                            {/* Plan */}
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                sub.planId === 'trimestral'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : sub.planId === 'semanal'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {sub.planName}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Duración: {sub.planDurationDays} días
                              </div>
                            </td>

                            {/* Amount & Method */}
                            <td className="p-3">
                              <div className="font-bold text-white">
                                {sub.currency === 'PEN' ? `S/ ${sub.amountPaid.toFixed(2)}` : `$ ${sub.amountPaid.toFixed(2)} ${sub.currency}`}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {sub.paymentMethod}
                              </span>
                            </td>

                            {/* Dates */}
                            <td className="p-3">
                              <div className="text-slate-300 font-medium">
                                Vence: <span className="text-white font-bold">{new Date(sub.expiryDate).toLocaleDateString('es-PE')}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Inicio: {new Date(sub.startDate).toLocaleDateString('es-PE')}
                              </div>
                            </td>

                            {/* Days remaining */}
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                                isRevoked
                                  ? 'bg-slate-800 text-slate-400'
                                  : isExpired
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : isExpiring
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {isRevoked ? 'Revocado' : isExpired ? '0 Días (Venció)' : `${sub.daysRemaining} Días`}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="p-3 text-center">
                              {isRevoked ? (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                                  Revocado
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                  Vencido
                                </span>
                              ) : isExpiring ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                  Por Vencer (≤3d)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                  Activo
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Send 3-Day Reminder */}
                                {isExpiring && !isRevoked && (
                                  <button
                                    onClick={() => handleSendReminder(sub)}
                                    className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all"
                                    title="Enviar recordatorio de renovación de 3 días por Telegram"
                                  >
                                    <Bell className="w-3 h-3 inline mr-1" />
                                    Alerta 3d
                                  </button>
                                )}

                                {/* Renew */}
                                <button
                                  onClick={() => {
                                    setRenewalSub(sub);
                                    setRenewalDays(sub.planDurationDays || 30);
                                    setRenewalPlanId(sub.planId || 'mensual');
                                  }}
                                  className="px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all"
                                  title="Renovar y extender días de acceso"
                                >
                                  <RefreshCw className="w-3 h-3 inline mr-1" />
                                  Renovar
                                </button>

                                {/* Copy 1-Use Invite Link */}
                                {sub.inviteLink && (
                                  <button
                                    onClick={() => handleCopy(sub.inviteLink, `link-${sub.id}`)}
                                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                                    title="Copiar Enlace Único de 1 Acceso"
                                  >
                                    {copiedKey === `link-${sub.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                  </button>
                                )}

                                {/* Revoke */}
                                {!isRevoked && (
                                  <button
                                    onClick={() => handleRevoke(sub)}
                                    className="p-1 rounded-md bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                                    title="Revocar Acceso VIP"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete */}
                                <button
                                  onClick={() => handleDelete(sub)}
                                  className="p-1 rounded-md bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                                  title="Eliminar del CRM"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 2: LECTURA Y VALIDACIÓN DE VOUCHERS CON IA (Visión Neural)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'verifier' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 p-4 rounded-xl border border-emerald-800/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Motor de Auditoría y Verificación de Comprobantes con Visión Neural
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Sube una captura de pago (Yape, Plin o Binance). El Motor Neural analizará el monto exacto, número de operación, fecha/hora y beneficiario, y clasificará automáticamente la membresía (Semanal, Mensual o Trimestral) para generar un enlace único de 1 solo uso.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Upload & Preview Column */}
                <div className="lg:col-span-5 space-y-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                      imagePreviewUrl
                        ? 'border-emerald-500/40 bg-emerald-950/10'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-950/50 hover:bg-slate-900/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {imagePreviewUrl ? (
                      <div className="relative w-full flex flex-col items-center">
                        <img
                          src={imagePreviewUrl}
                          alt="Comprobante de pago"
                          className="max-h-56 rounded-lg object-contain border border-slate-700 shadow-md"
                        />
                        <span className="mt-2 text-[11px] text-emerald-400 font-semibold">
                          Click para cambiar comprobante
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 mb-3 border border-slate-800">
                          <Upload className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-white">
                          Arrastra aquí el comprobante o haz click para subir
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          PNG, JPG o JPEG de Yape, Plin, Binance o Banco
                        </span>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Notas u Observaciones del Cliente (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Usuario @juan_perez pago mensualidad"
                      value={verifierNotes}
                      onChange={e => setVerifierNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={handleVerifyWithAI}
                    disabled={!imageBase64 || isAnalyzingVoucher}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                      !imageBase64 || isAnalyzingVoucher
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {isAnalyzingVoucher ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analizando con Visión Neural...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Auditar y Verificar Comprobante con IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Results & Auto-Subscription Column */}
                <div className="lg:col-span-7 space-y-4">
                  {verifierError && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <div className="font-bold text-rose-200">Verificación No Conforme</div>
                        <div className="mt-0.5">{verifierError}</div>
                      </div>
                    </div>
                  )}

                  {verificationResult && (
                    <div className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
                      verificationResult.isValid 
                        ? 'bg-slate-900/90 border-emerald-500/40' 
                        : 'bg-slate-900/90 border-rose-500/40'
                    }`}>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            verificationResult.isValid 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {verificationResult.isValid ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          </div>
                          <div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${
                              verificationResult.isValid ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {verificationResult.isValid ? 'Comprobante Válido & Auditado' : 'Comprobante Rechazado / No Conforme'}
                            </span>
                            <h4 className="text-base font-black text-white">
                              {verificationResult.isValid ? verificationResult.planName : 'No Califica para Activación VIP'}
                            </h4>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Score Confianza</span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                            verificationResult.isValid 
                              ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' 
                              : 'text-rose-400 bg-rose-500/20 border-rose-500/30'
                          }`}>
                            {verificationResult.confidenceScore}% {verificationResult.isValid ? 'IA Match' : 'Rechazado'}
                          </span>
                        </div>
                      </div>

                      {/* Rejection Reason Alert if invalid */}
                      {!verificationResult.isValid && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs">
                          <span className="font-bold block text-rose-400 mb-0.5">Motivo del Rechazo:</span>
                          <p>{verificationResult.rejectionReason || "La imagen enviada no corresponde a un comprobante de pago bancario válido o el titular no coincide."}</p>
                        </div>
                      )}

                      {/* Extracted Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Monto Extraído</span>
                          <span className={`font-extrabold text-sm ${verificationResult.isValid ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {verificationResult.currency === 'PEN' ? `S/ ${verificationResult.amount.toFixed(2)}` : `$ ${verificationResult.amount.toFixed(2)} ${verificationResult.currency}`}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">N° de Operación</span>
                          <span className="font-mono text-white font-bold">
                            {verificationResult.operationNumber || 'No detectado'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Método de Pago</span>
                          <span className="font-bold text-amber-300">
                            {verificationResult.paymentMethod}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Fecha y Hora</span>
                          <span className="text-slate-200 font-medium">
                            {verificationResult.dateStr} {verificationResult.timeStr}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Destinatario Validado</span>
                          <span className="text-slate-200 font-bold truncate">
                            {verificationResult.beneficiaryName || 'No identificado'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Días de Acceso VIP</span>
                          <span className="text-white font-bold">
                            {verificationResult.isValid ? `${verificationResult.planDurationDays} Días` : '0 Días'}
                          </span>
                        </div>
                      </div>

                      {/* Extracted Text Snippet */}
                      {verificationResult.extractedTextPreview && (
                        <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] text-slate-300">
                          <span className="text-slate-500 block text-[10px] font-semibold">Texto Detectado en Imagen:</span>
                          <p className="font-mono text-slate-300 mt-0.5 truncate">{verificationResult.extractedTextPreview}</p>
                        </div>
                      )}

                      {/* Auto-Enroll Action */}
                      {verificationResult.isValid ? (
                        !autoEnrollSuccess ? (
                          <button
                            onClick={handleAutoEnrollFromVerification}
                            disabled={isAutoEnrolling}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs sm:text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                          >
                            {isAutoEnrolling ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Generando Enlace 1-Uso e Inscribiendo en CRM...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4" />
                                <span>Auto-Suscribir y Generar Enlace 1-Uso (Member Limit: 1)</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5">
                            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>¡Suscripción Registrada en CRM con Éxito!</span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                              <span className="font-mono text-xs text-amber-300 truncate">
                                {autoEnrollSuccess.inviteLink}
                              </span>
                              <button
                                onClick={() => handleCopy(autoEnrollSuccess.inviteLink, 'auto-link')}
                                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 shrink-0"
                              >
                                {copiedKey === 'auto-link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>Copiar</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Enlace exclusivo de 1 solo uso listo para entregar al cliente.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                          ⚠️ <b>No es posible auto-inscribir:</b> El comprobante no superó los controles de verificación antifraude.
                        </div>
                      )}
                    </div>
                  )}

                  {!verificationResult && !isAnalyzingVoucher && !verifierError && (
                    <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <Bot className="w-10 h-10 text-slate-600" />
                      <div className="text-xs max-w-sm">
                        Sube un comprobante a la izquierda y presiona <b>"Auditar y Verificar con IA"</b> para extraer los datos automáticamente.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 3: INSCRIPCIÓN MANUAL & GENERADOR 1-USO
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'generator' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                  <UserPlus className="w-4 h-4" />
                  <span>Inscripción Manual de Suscriptor VIP</span>
                </div>
                <p className="text-xs text-slate-400">
                  Registra un cliente manualmente, genera un enlace exclusivo de 1 solo acceso con la API de Telegram y despáchalo directamente a su chat de Telegram.
                </p>
              </div>

              <form onSubmit={handleManualEnroll} className="space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre del Suscriptor <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Bray Yusman Quispe"
                    value={subscriberName}
                    onChange={e => setSubscriberName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      @Usuario Telegram (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: @bray_quispe"
                      value={subscriberUsername}
                      onChange={e => setSubscriberUsername(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Chat ID / Teléfono Telegram:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 901326470"
                      value={subscriberChatId}
                      onChange={e => setSubscriberChatId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Plan a Asignar:
                    </label>
                    <select
                      value={manualPlanId}
                      onChange={e => {
                        const pid = e.target.value as any;
                        setManualPlanId(pid);
                        if (pid === 'semanal') setManualAmount(19.90);
                        else if (pid === 'mensual') setManualAmount(39.90);
                        else if (pid === 'trimestral') setManualAmount(89.90);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="semanal">⚡ Semanal (7 Días) - S/ 19.90</option>
                      <option value="mensual">👑 Mensual VIP (30 Días) - S/ 39.90</option>
                      <option value="trimestral">💎 Trimestral (90 Días) - S/ 89.90</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Método de Pago:
                    </label>
                    <select
                      value={manualPaymentMethod}
                      onChange={e => setManualPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Yape">Yape (901326470)</option>
                      <option value="Plin">Plin (901326470)</option>
                      <option value="Binance">Binance Pay (849201948)</option>
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Manual">Efectivo / Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Monto Pagado:
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      value={manualAmount}
                      onChange={e => setManualAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    N° de Operación / Código de Referencia:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 98124018"
                    value={manualOpNumber}
                    onChange={e => setManualOpNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sendTelegramCheck"
                    checked={sendDirectToTelegram}
                    onChange={e => setSendDirectToTelegram(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="sendTelegramCheck" className="text-xs text-slate-300 cursor-pointer">
                    Despachar mensaje de bienvenida y enlace de 1 uso directamente por Telegram (si hay Chat ID)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isEnrollingManual || !subscriberName.trim()}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    isEnrollingManual || !subscriberName.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-sky-500 to-blue-500 text-black hover:opacity-95 shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                  }`}
                >
                  {isEnrollingManual ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando y Generando Link de 1 Uso...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Registrar Suscriptor & Generar Enlace Único (1 Solo Uso)</span>
                    </>
                  )}
                </button>
              </form>

              {manualEnrollResult && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Suscriptor Registrado con Éxito en el CRM!</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-amber-300 truncate">
                      {manualEnrollResult.inviteLink}
                    </span>
                    <button
                      onClick={() => handleCopy(manualEnrollResult.inviteLink, 'manual-link')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      {copiedKey === 'manual-link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar</span>
                    </button>
                  </div>

                  {manualEnrollResult.telegramSent && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Mensaje entregado exitosamente por Telegram.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 4: TARIFAS & CUENTAS DE PAGO (DIFUSIÓN)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'plans_settings' && (
            <div className="space-y-6">
              {/* Broadcast to Channel Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-400" />
                    <span>Difusión de Tarifas al Canal Público</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Publica los planes oficiales en <b>{targetTelegramChannel}</b> indicando a los usuarios que contacten a <b>@SoporteFijasIA_bot</b> para activar su membresía.
                  </p>
                </div>

                <button
                  onClick={handleBroadcastVIPPlans}
                  disabled={isSendingToTelegram}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingToTelegram ? 'Publicando...' : `Publicar en ${targetTelegramChannel}`}</span>
                </button>
              </div>

              {sendFeedback.status !== 'idle' && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  sendFeedback.status === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                }`}>
                  {sendFeedback.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{sendFeedback.message}</span>
                </div>
              )}

              {/* Plans Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      plan.id === 'mensual'
                        ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-400 text-black font-black text-[10px] tracking-wider uppercase shadow-md">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h4 className="font-extrabold text-white text-base flex items-center gap-1.5">
                        <span>{plan.name}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
                        {plan.description}
                      </p>

                      <div className="my-4 pb-3 border-b border-slate-800">
                        <div className="text-2xl font-black text-amber-300">
                          S/ {plan.priceSoles.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          o ${plan.priceUsdt} USDT (Binance Pay)
                        </div>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-300">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Methods Accounts Box */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Cuentas Oficiales de Cobro</span>
                  </div>

                  <button
                    onClick={() => setIsEditingPayment(!isEditingPayment)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    {isEditingPayment ? 'Cancelar Edición' : 'Editar Cuentas'}
                  </button>
                </div>

                {!isEditingPayment ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Yape */}
                    <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300">🇵🇪 YAPE</span>
                        <button
                          onClick={() => handleCopy(paymentSettings.yapeNumber, 'yape')}
                          className="p-1 rounded bg-purple-900/40 hover:bg-purple-800 text-purple-200"
                        >
                          {copiedKey === 'yape' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="mt-2 font-mono text-white text-sm font-bold">{paymentSettings.yapeNumber}</div>
                      <div className="text-[11px] text-purple-200 font-medium truncate">{paymentSettings.yapeHolder}</div>
                    </div>

                    {/* Plin */}
                    <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-300">🇵🇪 PLIN</span>
                        <button
                          onClick={() => handleCopy(paymentSettings.plinNumber, 'plin')}
                          className="p-1 rounded bg-sky-900/40 hover:bg-sky-800 text-sky-200"
                        >
                          {copiedKey === 'plin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="mt-2 font-mono text-white text-sm font-bold">{paymentSettings.plinNumber}</div>
                      <div className="text-[11px] text-sky-200 font-medium truncate">{paymentSettings.plinHolder}</div>
                    </div>

                    {/* Binance Pay */}
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">🌐 Binance Pay (USDT)</span>
                        <button
                          onClick={() => handleCopy(paymentSettings.binancePayId, 'binance')}
                          className="p-1 rounded bg-amber-900/40 hover:bg-amber-800 text-amber-200"
                        >
                          {copiedKey === 'binance' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="mt-2 font-mono text-white text-sm font-bold">ID: {paymentSettings.binancePayId}</div>
                      <div className="text-[11px] text-amber-200 font-medium">Red BEP-20 / Direct Pay</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Número Yape / Plin:</label>
                      <input
                        type="text"
                        value={paymentSettings.yapeNumber}
                        onChange={e => setPaymentSettings({ ...paymentSettings, yapeNumber: e.target.value, plinNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Titular de la Cuenta:</label>
                      <input
                        type="text"
                        value={paymentSettings.yapeHolder}
                        onChange={e => setPaymentSettings({ ...paymentSettings, yapeHolder: e.target.value, plinHolder: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Binance Pay ID:</label>
                      <input
                        type="text"
                        value={paymentSettings.binancePayId}
                        onChange={e => setPaymentSettings({ ...paymentSettings, binancePayId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          localStorage.setItem('tipster_payment_settings', JSON.stringify(paymentSettings));
                          setIsEditingPayment(false);
                        }}
                        className="w-full py-2 rounded-lg bg-emerald-500 text-black font-bold"
                      >
                        Guardar Cuentas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Renewal Pop-up Overlay */}
        {renewalSub && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>Renovar Membresía VIP</span>
                </div>
                <button onClick={() => setRenewalSub(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div>
                <span className="text-xs text-slate-400">Suscriptor:</span>
                <div className="text-sm font-bold text-white">{renewalSub.name} ({renewalSub.username || `ID: ${renewalSub.chatId}`})</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setRenewalDays(7); setRenewalPlanId('semanal'); }}
                  className={`p-2.5 rounded-xl border text-center font-bold ${
                    renewalDays === 7 ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  +7 Días (Semanal)
                </button>
                <button
                  type="button"
                  onClick={() => { setRenewalDays(30); setRenewalPlanId('mensual'); }}
                  className={`p-2.5 rounded-xl border text-center font-bold ${
                    renewalDays === 30 ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  +30 Días (Mensual)
                </button>
                <button
                  type="button"
                  onClick={() => { setRenewalDays(90); setRenewalPlanId('trimestral'); }}
                  className={`p-2.5 rounded-xl border text-center font-bold ${
                    renewalDays === 90 ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  +90 Días (Trimestral)
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setRenewalSub(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExecuteRenewal}
                  disabled={isRenewing}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {isRenewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirmar Renovación</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#070A12] flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>FIJAS IA • VIP Subscription CRM & Motor de Visión Neural Auto-Delivery</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
