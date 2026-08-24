import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Cpu, 
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Key,
  Send,
  Mail,
  Smartphone,
  MessageSquare
} from 'lucide-react';

interface AdminLoginGateModalProps {
  onLoginSuccess: () => void;
}

const DEFAULT_MASTER_PASSWORD = 'FijasIA2026*';
const MASTER_RECOVERY_KEY = 'FIJAS-ADMIN-ROOT-2026';
const ADMIN_DEFAULT_EMAIL = 'bray.yusman@gmail.com';
const ADMIN_DEFAULT_TELEGRAM_ID = '5261686165';

export const AdminLoginGateModal: React.FC<AdminLoginGateModalProps> = ({ onLoginSuccess }) => {
  // Mode: 'login' | 'change_password' | 'recovery'
  const [activeTab, setActiveTab] = useState<'login' | 'change_password' | 'recovery'>('login');
  
  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  
  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Recovery form state
  const [recoveryMethod, setRecoveryMethod] = useState<'telegram' | 'email' | 'root_key'>('telegram');
  const [telegramChatId, setTelegramChatId] = useState(ADMIN_DEFAULT_TELEGRAM_ID);
  const [detectedChats, setDetectedChats] = useState<Array<{ chatId: string | number; name: string; username?: string }>>([]);
  const [emailTarget, setEmailTarget] = useState(ADMIN_DEFAULT_EMAIL);
  const [recoveryOtpCode, setRecoveryOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-detect recent chats when opening recovery tab
  useEffect(() => {
    if (activeTab === 'recovery') {
      fetch('/api/admin/recent-telegram-chats')
        .then(r => r.json())
        .then(data => {
          if (data && data.recentChats && data.recentChats.length > 0) {
            setDetectedChats(data.recentChats);
            const latest = data.recentChats[0];
            if (latest && latest.chatId) {
              setTelegramChatId(String(latest.chatId));
            }
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  // Get current stored master password
  const getStoredMasterPassword = (): string => {
    try {
      return localStorage.getItem('fijas_ia_master_password') || DEFAULT_MASTER_PASSWORD;
    } catch {
      return DEFAULT_MASTER_PASSWORD;
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    setTimeout(() => {
      const validPass = getStoredMasterPassword();
      if (username.trim() === 'admin' && password === validPass) {
        try {
          if (rememberSession) {
            localStorage.setItem('fijas_ia_admin_auth', 'authenticated_' + Date.now());
          } else {
            sessionStorage.setItem('fijas_ia_admin_auth', 'authenticated_' + Date.now());
            localStorage.removeItem('fijas_ia_admin_auth');
          }
        } catch (e) {
          console.warn('Storage not available', e);
        }
        onLoginSuccess();
      } else {
        setError('Credenciales incorrectas. Verifique el usuario o la contraseña maestra.');
        setLoading(false);
      }
    }, 350);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const currentStoredPass = getStoredMasterPassword();

    if (currentPassword !== currentStoredPass) {
      setError('La contraseña actual ingresada no coincide.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        localStorage.setItem('fijas_ia_master_password', newPassword);
        setSuccessMessage('¡Contraseña maestra actualizada con éxito! Ahora puede iniciar sesión con su nueva clave.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setActiveTab('login');
      } catch (err) {
        setError('No se pudo guardar la contraseña en el almacenamiento local.');
      }
      setLoading(false);
    }, 400);
  };

  // Request OTP via Telegram Bot or Email
  const handleRequestOtp = async () => {
    setError('');
    setSuccessMessage('');
    setOtpLoading(true);

    try {
      const target = recoveryMethod === 'telegram' ? telegramChatId : emailTarget;
      const res = await fetch('/api/admin/request-recovery-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: recoveryMethod, target })
      });

      const data = await res.json();
      if (data.ok) {
        setOtpSent(true);
        if (data.code) {
          setRecoveryOtpCode(data.code); // Auto-fill for convenience
        }
        if (data.deliveredToTelegram) {
          setSuccessMessage(`¡Código OTP enviado exitosamente a tu Telegram! Revisa tus mensajes o usa el código auto-completado.`);
        } else {
          setSuccessMessage(data.message || `Código generado: ${data.code}. Si no has iniciado chat con el bot, el código ha sido auto-cargado abajo.`);
        }
      } else {
        setError(data.error || 'No se pudo enviar el código de recuperación.');
      }
    } catch (err: any) {
      setError('Error al solicitar código al servidor.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Quick Reset to Factory Password
  const handleFactoryReset = () => {
    try {
      localStorage.setItem('fijas_ia_master_password', DEFAULT_MASTER_PASSWORD);
      setSuccessMessage('¡Contraseña restablecida a los valores de fábrica: FijasIA2026* !');
      setPassword(DEFAULT_MASTER_PASSWORD);
      setActiveTab('login');
      setError('');
    } catch (e) {
      setError('Error al restablecer la contraseña.');
    }
  };

  // Verify OTP and Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (recoveryMethod === 'root_key') {
      if (recoveryKey.trim().toUpperCase() !== MASTER_RECOVERY_KEY) {
        setError('Clave de Recuperación Root incorrecta.');
        return;
      }

      if (resetNewPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }

      try {
        localStorage.setItem('fijas_ia_master_password', resetNewPassword);
        setSuccessMessage('¡Contraseña restablecida con éxito! Ingrese con sus nuevas credenciales.');
        setRecoveryKey('');
        setResetNewPassword('');
        setActiveTab('login');
      } catch (e) {
        setError('Error al guardar la nueva contraseña.');
      }
      return;
    }

    if (!recoveryOtpCode || recoveryOtpCode.length < 6) {
      setError('Ingrese el código de 6 dígitos recibido.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/verify-recovery-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: recoveryOtpCode, newPassword: resetNewPassword })
      });

      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('fijas_ia_master_password', resetNewPassword);
        setSuccessMessage('¡Contraseña restablecida correctamente! Ingrese con sus nuevas credenciales.');
        setRecoveryOtpCode('');
        setResetNewPassword('');
        setOtpSent(false);
        setActiveTab('login');
      } else {
        setError(data.error || 'Código incorrecto o expirado.');
      }
    } catch (err: any) {
      setError('Error al validar el código con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070A11]/95 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg bg-[#0D121E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 my-auto">
        {/* Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3.5 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
            <Lock className="w-7 h-7 text-emerald-400" />
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0D121E] border border-emerald-500/40">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
              FIJAS <span className="text-emerald-400">IA</span>
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              ADMIN CONTROL
            </span>
          </div>

          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Panel Cuantitativo & Motor de Pronósticos Deportivos. Acceso restringido para operadores y administradores.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ingreso</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('change_password');
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'change_password'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Cambiar Clave</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('recovery');
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'recovery'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recuperación</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Usuario Administrador</span>
              </label>
              <input
                id="admin-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Contraseña Maestra</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('recovery')}
                  className="text-[11px] text-emerald-400 hover:underline font-medium"
                >
                  ¿Olvidó su clave?
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option & Quick Autofill */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Recordar sesión</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('FijasIA2026*');
                  setError('');
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
              >
                Autocompletar (FijasIA2026*)
              </button>
            </div>

            <button
              id="admin-login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verificando Credenciales...</span>
                </div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acceder al Panel de Control</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: CHANGE PASSWORD FORM */}
        {activeTab === 'change_password' && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Contraseña Actual</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese contraseña actual"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nueva Contraseña Maestra</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confirmar Nueva Contraseña</span>
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? 'Guardando Cambios...' : 'Guardar Nueva Contraseña'}
            </button>
          </form>
        )}

        {/* TAB 3: RECOVERY FORM VIA TELEGRAM / EMAIL / ROOT KEY */}
        {activeTab === 'recovery' && (
          <div className="space-y-4">
            {/* Recovery Channel Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setRecoveryMethod('telegram');
                  setOtpSent(false);
                  setError('');
                }}
                className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  recoveryMethod === 'telegram'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecoveryMethod('email');
                  setOtpSent(false);
                  setError('');
                }}
                className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  recoveryMethod === 'email'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3 h-3" />
                <span>Correo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecoveryMethod('root_key');
                  setOtpSent(false);
                  setError('');
                }}
                className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  recoveryMethod === 'root_key'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="w-3 h-3" />
                <span>Clave Root</span>
              </button>
            </div>

            {/* Telegram Recovery Flow */}
            {recoveryMethod === 'telegram' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs space-y-1.5">
                  <p className="font-semibold">Recuperación Directa por Telegram:</p>
                  <p className="text-[11px] text-cyan-200/80 leading-relaxed">
                    Asegúrate de haber abierto el chat y presionado <b>/start</b> en cualquiera de nuestros bots oficiales:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href="https://t.me/SoporteFijasIA_bot"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[11px] font-bold border border-cyan-500/40 inline-flex items-center gap-1 transition-all"
                    >
                      <span>🤖 @SoporteFijasIA_bot</span>
                    </a>
                    <a
                      href="https://t.me/FijasIAOficial_bot"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[11px] font-bold border border-cyan-500/40 inline-flex items-center gap-1 transition-all"
                    >
                      <span>⚡ @FijasIAOficial_bot</span>
                    </a>
                  </div>
                </div>

                {!otpSent ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-cyan-400">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Tu Telegram ID / Chat ID</span>
                        </span>
                        {detectedChats.length > 0 && (
                          <span className="text-[10px] text-emerald-400 font-medium">Detectado en vivo</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        placeholder="Ej: 5261686165"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                      />

                      {detectedChats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] text-slate-400 self-center">Chats recientes:</span>
                          {detectedChats.map((c) => (
                            <button
                              key={String(c.chatId)}
                              type="button"
                              onClick={() => setTelegramChatId(String(c.chatId))}
                              className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer"
                            >
                              {c.name} ({c.chatId})
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        💡 <b>Tip:</b> También puedes escribir el comando <code className="text-cyan-300 font-bold bg-slate-800 px-1 rounded">/otp</code> directamente a <a href="https://t.me/SoporteFijasIA_bot" target="_blank" rel="noreferrer" className="text-cyan-400 underline">@SoporteFijasIA_bot</a> en Telegram y te responderá con tu código al instante.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={otpLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {otpLoading ? 'Generando y Enviando Código...' : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Solicitar Código OTP a Telegram</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtpAndReset} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-cyan-400">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Código OTP (6 dígitos)</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">Auto-completado</span>
                      </label>
                      <input
                        type="text"
                        value={recoveryOtpCode}
                        onChange={(e) => setRecoveryOtpCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-center font-mono text-lg tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Nueva Contraseña Deseada</span>
                      </label>
                      <input
                        type="password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {loading ? 'Restableciendo...' : 'Validar Código & Guardar Nueva Clave'}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                      >
                        Reintentar con otro ID
                      </button>

                      <button
                        type="button"
                        onClick={handleFactoryReset}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                      >
                        Restablecer a FijasIA2026*
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Email Recovery Flow */}
            {recoveryMethod === 'email' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">
                  <p className="font-semibold mb-0.5">Recuperación por Correo Electrónico:</p>
                  <p className="text-[11px] text-cyan-200/80">
                    Se enviará un código de verificación seguro a la dirección del administrador titular.
                  </p>
                </div>

                {!otpSent ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Correo Electrónico Registrado</span>
                      </label>
                      <input
                        type="email"
                        value={emailTarget}
                        onChange={(e) => setEmailTarget(e.target.value)}
                        placeholder="bray.yusman@gmail.com"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={otpLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {otpLoading ? 'Generando Código...' : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Código al Correo</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtpAndReset} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Código OTP (6 dígitos)</span>
                      </label>
                      <input
                        type="text"
                        value={recoveryOtpCode}
                        onChange={(e) => setRecoveryOtpCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-center font-mono text-lg tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Nueva Contraseña Deseada</span>
                      </label>
                      <input
                        type="password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {loading ? 'Restableciendo...' : 'Validar Código & Guardar Nueva Clave'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Root Key Fallback */}
            {recoveryMethod === 'root_key' && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <p className="font-semibold mb-0.5">Clave Maestra de Seguridad Root:</p>
                  <p className="text-[11px] text-amber-200/80">
                    Clave de emergencia local: <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300 font-bold">FIJAS-ADMIN-ROOT-2026</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clave Root de Seguridad</span>
                  </label>
                  <input
                    type="text"
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="FIJAS-ADMIN-ROOT-2026"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nueva Contraseña Deseada</span>
                  </label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? 'Restableciendo...' : 'Restablecer con Clave Root'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Encriptación Local & Servidor</span>
          </span>
          <span className="text-emerald-400 font-medium">
            FIJAS IA v2.8 PRO
          </span>
        </div>
      </div>
    </div>
  );
};
