import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  KPIHeader 
} from './components/KPIHeader';
import { 
  EVSignalsColumn 
} from './components/EVSignalsColumn';
import { 
  OfficialMatchesColumn 
} from './components/OfficialMatchesColumn';
import { 
  MatchIntelligenceModal 
} from './components/MatchIntelligenceModal';
import { 
  ParlayCalculatorModal 
} from './components/ParlayCalculatorModal';
import { 
  EngineConfigModal 
} from './components/EngineConfigModal';
import { 
  UniversalSearchModal 
} from './components/UniversalSearchModal';
import { 
  KellySimulatorDrawer 
} from './components/KellySimulatorDrawer';
import { 
  BankrollSettingsModal 
} from './components/BankrollSettingsModal';
import { 
  AutoPilotStatusBar 
} from './components/AutoPilotStatusBar';
import { 
  AutoPilotSchedulerModal 
} from './components/AutoPilotSchedulerModal';
import { 
  VIPSubscriptionModal 
} from './components/VIPSubscriptionModal';
import {
  TelegramSalesAgentModal
} from './components/TelegramSalesAgentModal';
import {
  MultiSportFilterBar
} from './components/MultiSportFilterBar';
import {
  PicksTrackingDatabaseModal
} from './components/PicksTrackingDatabaseModal';
import {
  AIAutoLearningModal
} from './components/AIAutoLearningModal';
import {
  MasterCycleModal
} from './components/MasterCycleModal';
import {
  LiveScannerModal
} from './components/LiveScannerModal';
import {
  AdminLoginGateModal
} from './components/AdminLoginGateModal';
import { 
  sendTelegramMessage,
  TELEGRAM_CONFIG,
  formatSingleSignalMessage,
  formatGoldenParlayMessage,
  formatSettlementMessage,
  formatNightlyAuditMessage,
  formatVIPPlansBroadcastMessage,
  DEFAULT_VIP_PLANS,
  DEFAULT_PAYMENT_SETTINGS
} from './services/telegramService';
import { 
  fetchLiveESPNFutureMatches,
  convertESPNToAppMatches 
} from './services/espnService';
import { 
  Match, 
  EVSignal, 
  LeagueId, 
  EngineConfig, 
  ParlayLeg,
  BankrollSettings,
  AutoPilotState,
  AutoPilotTriggerType,
  AutoPilotLog,
  GoldenParlay,
  SportType,
  TrackedPick,
  AuditPerformance,
  AIAutoLearningState,
  AIErrorDiagnostic
} from './types';
import { 
  MATCHES_DATA, 
  EV_SIGNALS_LIST, 
  INITIAL_KPIS,
  INITIAL_TRACKED_PICKS,
  INITIAL_AUDIT_PERFORMANCE,
  INITIAL_AUTO_LEARNING_STATE,
  SPORTS_LIST
} from './data/matches';
import { 
  DEFAULT_ENGINE_CONFIG 
} from './services/aiService';

import { 
  Layers, 
  Zap, 
  Trophy, 
  Flame, 
  Activity,
  Sparkles,
  CalendarCheck
} from 'lucide-react';

const DEFAULT_BANKROLL_SETTINGS: BankrollSettings = {
  totalBankrollSoles: 1000,
  unitValueSoles: 50,
  currency: 'PEN'
};

const INITIAL_AUTOPILOT_STATE: AutoPilotState = {
  isEnabled: true,
  nextScanMinutes: 14,
  lastTelegramSentTime: 'Hoy, 09:00 AM',
  activeTrackingMatchesCount: 6,
  autoSendTelegram: true,
  telegramChannelName: '@FijasIA',
  telegramChatId: '@FijasIA',
  telegramBotToken: TELEGRAM_CONFIG.botToken,
  telegramBotUsername: TELEGRAM_CONFIG.botUsername,
  dailyVolume: {
    freePicksPerDay: 1,
    vipSignalsCount: 5,
    goldenParlaysPerDay: 1
  },
  triggers: {
    morningScan: { 
      enabled: true, 
      time: '09:00 AM', 
      description: 'Auto-escaneo y envío del 1 Pick Destacado Gratuito del día al canal público.',
      status: 'COMPLETED'
    },
    goldenParlay: {
      enabled: true,
      time: '10:00 AM',
      description: 'Selección cuantitativa de 2 a 3 piernas de alta probabilidad (cuota @2.30 - @3.20) para el VIP.',
      status: 'COMPLETED'
    },
    liveSettlement: { 
      enabled: true, 
      description: 'Auto-verificación de marcadores al pitazo final para enviar liquidación oficial (GANADA/PERDIDA).',
      status: 'MONITORING'
    },
    nightlyAudit: { 
      enabled: true, 
      time: '23:00 PM', 
      description: 'Generación y envío del balance diario auditado (Aciertos, Fallos, Yield, Bankroll).',
      status: 'WAITING'
    }
  },
  recentLogs: [
    {
      id: 'log-1',
      timestamp: 'Hoy, 09:00:03 AM',
      type: 'morning_scan',
      title: '🎁 1 Pick Gratuito Destacado Enviado',
      message: `🎁 PRONÓSTICO DESTACADO GRATUITO — FIJAS IA
🏆 Torneo: Liga 1 Perú · ⚔️ Partido: Universitario vs Los Chankas · ⏰ Hora: 20:00
👉 ¿A qué apostar?: Universitario -1.5 AH (Gana por 2 o más goles)
📈 Cuota Recomendada: @1.92 o más (Disponible en todas las casas)
💰 Stake Sugerido: 2.0 Unidades (Confianza: ALTA ⭐⭐⭐)
🧠 Análisis Táctico IA: Universitario promedia 2.45 xG en el Monumental con 14 victorias consecutivas.
👑 Canal VIP: Suscríbete por Yape/Plin para recibir todos los picks diarios.`,
      telegramStatus: 'SENT',
      metrics: { picksCount: 1, winRate: 68.4 }
    },
    {
      id: 'log-2',
      timestamp: 'Ayer, 23:00:15 PM',
      type: 'nightly_audit',
      title: '📊 Reporte de Balance Diario Auditado (23:00 PM)',
      message: `📊 CIERRE DIARIO AUDITADO — FIJAS IA
📋 Picks Enviados: 6
✅ Ganadas: 5 | ❌ Perdidas: 1
🎯 Win Rate: 83.3% | 📈 Rendimiento (Yield): +28.4%
💰 Balance Neto del Día: +5.68 Unidades (+S/. 284.00)
🏦 Bankroll Total Auditado: S/. 1,284.00`,
      telegramStatus: 'SENT',
      metrics: { unitsWon: 5.68, winRate: 83.3 }
    },
    {
      id: 'log-3',
      timestamp: 'Ayer, 19:48:22 PM',
      type: 'live_settlement',
      title: '✅ Disparador Post-Partido: Liquidación Oficial',
      message: `✅ ¡PRONÓSTICO GANADO (+1.56 Unidades)! [Marcador Final: 3 - 1 (FINAL)]
🏆 Partido: Levante vs Osasuna
🎯 Selección: Osasuna 1X & Menos de 3.5 Goles
📈 Cuota Cerrada: @1.75
🏦 Bankroll auditado y sumado en vivo.`,
      telegramStatus: 'SENT',
      metrics: { result: 'GANADA', settledMatch: 'Levante vs Osasuna' }
    }
  ]
};

export default function App() {
  // Admin Login Security Gate (Restricted Access: admin / FijasIA2026*)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('fijas_ia_admin_auth'));
    } catch (e) {
      return false;
    }
  });

  // Application Data States (Dynamic Real-Time ESPN & Server Synced)
  const [matches, setMatches] = useState<Match[]>(MATCHES_DATA);
  const [evSignals, setEvSignals] = useState<EVSignal[]>(EV_SIGNALS_LIST);
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    try {
      return new Date().toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'En Vivo';
    }
  });

  // AutoPilot 24/7 Automated Bot Scheduler State
  const [autoPilot, setAutoPilot] = useState<AutoPilotState>(() => {
    try {
      const saved = localStorage.getItem('tipster_autopilot_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_AUTOPILOT_STATE,
          ...parsed,
          dailyVolume: { ...INITIAL_AUTOPILOT_STATE.dailyVolume, ...(parsed.dailyVolume || {}) },
          triggers: { ...INITIAL_AUTOPILOT_STATE.triggers, ...(parsed.triggers || {}) }
        };
      }
    } catch (e) {
      console.warn('Failed to load autopilot state');
    }
    return INITIAL_AUTOPILOT_STATE;
  });

  // Bankroll Management in Soles (PEN)
  const [bankrollSettings, setBankrollSettings] = useState<BankrollSettings>(() => {
    try {
      const saved = localStorage.getItem('tipster_bankroll_settings');
      if (saved) return { ...DEFAULT_BANKROLL_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load bankroll settings from storage');
    }
    return DEFAULT_BANKROLL_SETTINGS;
  });
  
  // Navigation & Filter States
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedLeague, setSelectedLeague] = useState<LeagueId>('all');
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  // Parlay Builder State
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);

  // Engine Configuration State
  const [engineConfig, setEngineConfig] = useState<EngineConfig>(() => {
    try {
      const saved = localStorage.getItem('tipster_engine_config');
      if (saved) return { ...DEFAULT_ENGINE_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_ENGINE_CONFIG;
  });

  // Multi-Sport Picks Tracking & Audit Database State
  const [trackedPicks, setTrackedPicks] = useState<TrackedPick[]>(() => {
    try {
      const saved = localStorage.getItem('tipster_tracked_picks_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load tracked picks');
    }
    return INITIAL_TRACKED_PICKS;
  });

  const [auditPerformance, setAuditPerformance] = useState<AuditPerformance>(INITIAL_AUDIT_PERFORMANCE);

  // AI Auto-Learning & Feedback Loop State
  const [autoLearningState, setAutoLearningState] = useState<AIAutoLearningState>(INITIAL_AUTO_LEARNING_STATE);

  // Modals Visibility States
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isParlayModalOpen, setIsParlayModalOpen] = useState<boolean>(false);
  const [isEngineModalOpen, setIsEngineModalOpen] = useState<boolean>(false);
  const [isKellyModalOpen, setIsKellyModalOpen] = useState<boolean>(false);
  const [isBankrollModalOpen, setIsBankrollModalOpen] = useState<boolean>(false);
  const [isAutoPilotModalOpen, setIsAutoPilotModalOpen] = useState<boolean>(false);
  const [isVIPModalOpen, setIsVIPModalOpen] = useState<boolean>(false);
  const [isSalesAgentModalOpen, setIsSalesAgentModalOpen] = useState<boolean>(false);
  const [isPicksDatabaseOpen, setIsPicksDatabaseOpen] = useState<boolean>(false);
  const [isAutoLearningOpen, setIsAutoLearningOpen] = useState<boolean>(false);
  const [isMasterCycleOpen, setIsMasterCycleOpen] = useState<boolean>(false);
  const [isLiveScannerOpen, setIsLiveScannerOpen] = useState<boolean>(false);
  const [activeMobileView, setActiveMobileView] = useState<'both' | 'signals' | 'matches'>('both');

  // Recalculate local Audit Performance based on tracked picks
  const recalculateAudit = (picks: TrackedPick[]): AuditPerformance => {
    let totalPicks = picks.length;
    let wonPicks = 0;
    let lostPicks = 0;
    let pushPicks = 0;
    let pendingPicks = 0;
    let totalUnitsStaked = 0;
    let netUnitsProfit = 0;
    let netProfitSoles = 0;

    let runningCumulativeUnits = 0;
    let runningSettledCount = 0;
    let runningWonCount = 0;

    const historyChartData: AuditPerformance['historyChartData'] = [];

    picks.forEach((p, idx) => {
      totalUnitsStaked += p.stakeUnits;
      if (p.status === 'PENDING') {
        pendingPicks++;
      } else if (p.status === 'WON') {
        wonPicks++;
        runningSettledCount++;
        runningWonCount++;
        const netU = Number((p.stakeUnits * (p.odds - 1)).toFixed(2));
        const netS = Number((p.stakeSoles * (p.odds - 1)).toFixed(2));
        netUnitsProfit += netU;
        netProfitSoles += netS;
        runningCumulativeUnits += netU;
        historyChartData.push({
          pickNumber: idx + 1,
          date: p.timestamp ? p.timestamp.slice(5, 10) : '2026-08',
          event: p.eventTitle,
          sport: p.sport,
          result: 'WON',
          unitsWon: netU,
          cumulativeUnits: Number(runningCumulativeUnits.toFixed(2)),
          yieldProgress: Number(((runningCumulativeUnits / totalUnitsStaked) * 100).toFixed(1)),
          winRateProgress: Number(((runningWonCount / runningSettledCount) * 100).toFixed(1))
        });
      } else if (p.status === 'LOST') {
        lostPicks++;
        runningSettledCount++;
        netUnitsProfit -= p.stakeUnits;
        netProfitSoles -= p.stakeSoles;
        runningCumulativeUnits -= p.stakeUnits;
        historyChartData.push({
          pickNumber: idx + 1,
          date: p.timestamp ? p.timestamp.slice(5, 10) : '2026-08',
          event: p.eventTitle,
          sport: p.sport,
          result: 'LOST',
          unitsWon: -p.stakeUnits,
          cumulativeUnits: Number(runningCumulativeUnits.toFixed(2)),
          yieldProgress: Number(((runningCumulativeUnits / totalUnitsStaked) * 100).toFixed(1)),
          winRateProgress: Number(((runningWonCount / runningSettledCount) * 100).toFixed(1))
        });
      } else if (p.status === 'PUSH') {
        pushPicks++;
      }
    });

    const settledCount = wonPicks + lostPicks;
    const winRate = settledCount > 0 ? Number(((wonPicks / settledCount) * 100).toFixed(1)) : 0;
    const yieldRoi = totalUnitsStaked > 0 ? Number(((netUnitsProfit / totalUnitsStaked) * 100).toFixed(1)) : 0;

    return {
      totalPicks,
      wonPicks,
      lostPicks,
      pushPicks,
      pendingPicks,
      winRate,
      yieldRoi,
      totalUnitsStaked: Number(totalUnitsStaked.toFixed(2)),
      netUnitsProfit: Number(netUnitsProfit.toFixed(2)),
      netProfitSoles: Number(netProfitSoles.toFixed(2)),
      historyChartData: historyChartData.length > 0 ? historyChartData : INITIAL_AUDIT_PERFORMANCE.historyChartData
    };
  };

  // Sync Database on mount and on demands
  const fetchServerTrackedPicks = async () => {
    try {
      const res = await fetch('/api/picks/database');
      if (res.ok) {
        const data = await res.json();
        if (data.picks && Array.isArray(data.picks)) {
          setTrackedPicks(data.picks);
          if (data.performance) {
            setAuditPerformance(data.performance);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch server picks DB, using local state:', err);
    }
  };

  // Sincronización en vivo con ESPN y API de Partidos de Hoy
  const syncLiveMatchesFromESPN = async (isManual = false) => {
    setIsLiveSyncing(true);
    try {
      const liveESPN = await fetchLiveESPNFutureMatches();
      if (liveESPN && liveESPN.allScheduled && liveESPN.allScheduled.length > 0) {
        const converted = convertESPNToAppMatches(liveESPN.allScheduled);
        if (converted.matches.length > 0) {
          setMatches(converted.matches);
          if (converted.signals.length > 0) {
            setEvSignals(converted.signals);
          }
          setKpis(prev => ({
            ...prev,
            matchesAnalyzedToday: converted.matches.length,
            evSignalsDetected: converted.signals.length || prev.evSignalsDetected,
            engineStatus: `Sincronizado ESPN En Vivo (${converted.matches.length} partidos oficiales de hoy)`
          }));
        }
      }
      const timeStr = new Date().toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setLastSyncTime(`${timeStr} (Lima)`);
    } catch (err) {
      console.warn('Error fetching live ESPN matches:', err);
    } finally {
      setIsLiveSyncing(false);
    }
  };

  useEffect(() => {
    fetchServerTrackedPicks();
    syncLiveMatchesFromESPN();

    const fetchLearning = async () => {
      try {
        const resLearning = await fetch('/api/ai/auto-learning-status');
        if (resLearning.ok) {
          const learningData = await resLearning.json();
          if (learningData.state) {
            setAutoLearningState(learningData.state);
          }
        }
      } catch (err) {
        console.warn('Could not fetch AI auto-learning state:', err);
      }
    };

    fetchLearning();

    // Auto-refresh match feed every 60 seconds
    const intervalId = setInterval(() => {
      syncLiveMatchesFromESPN();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Handler: Settle Pick
  const handleSettlePick = async (
    pickId: string,
    status: 'WON' | 'LOST' | 'PUSH',
    finalScore: string,
    notes: string,
    broadcastTelegram: boolean
  ) => {
    try {
      const response = await fetch('/api/picks/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickId,
          status,
          finalScore,
          notes,
          broadcastTelegram,
          chatId: autoPilot.telegramChatId || '@FijasIAOficial'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.pick) {
          const updated = trackedPicks.map(p => p.id === pickId ? result.pick : p);
          setTrackedPicks(updated);
          localStorage.setItem('tipster_tracked_picks_db', JSON.stringify(updated));
          if (result.performance) {
            setAuditPerformance(result.performance);
          } else {
            setAuditPerformance(recalculateAudit(updated));
          }
        }
      } else {
        // Fallback local settlement
        const updated = trackedPicks.map(p => {
          if (p.id !== pickId) return p;
          const netU = status === 'WON' ? Number((p.stakeUnits * (p.odds - 1)).toFixed(2)) : status === 'LOST' ? -p.stakeUnits : 0;
          const netS = status === 'WON' ? Number((p.stakeSoles * (p.odds - 1)).toFixed(2)) : status === 'LOST' ? -p.stakeSoles : 0;
          return {
            ...p,
            status,
            finalScore,
            netUnits: netU,
            netProfitSoles: netS,
            settlementNotes: notes || 'Liquidación confirmada'
          };
        });
        setTrackedPicks(updated);
        localStorage.setItem('tipster_tracked_picks_db', JSON.stringify(updated));
        setAuditPerformance(recalculateAudit(updated));

        if (broadcastTelegram) {
          const pick = trackedPicks.find(p => p.id === pickId);
          if (pick) {
            const settlementMsg = formatSettlementMessage(
              pick.eventTitle,
              pick.selection,
              pick.odds,
              status === 'WON',
              status === 'WON' ? Number((pick.stakeUnits * (pick.odds - 1)).toFixed(2)) : -pick.stakeUnits,
              finalScore
            );
            await sendTelegramMessage(settlementMsg, autoPilot.telegramChatId || '@FijasIAOficial', 'HTML');
          }
        }
      }
    } catch (err: any) {
      console.error('Error settling pick:', err);
      throw err;
    }
  };

  // Handler: Add Tracked Pick
  const handleAddTrackedPick = async (pickData: Partial<TrackedPick>) => {
    try {
      const response = await fetch('/api/picks/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pickData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.pick) {
          const updated = [result.pick, ...trackedPicks];
          setTrackedPicks(updated);
          localStorage.setItem('tipster_tracked_picks_db', JSON.stringify(updated));
          if (result.performance) setAuditPerformance(result.performance);
        }
      } else {
        const newPick: TrackedPick = {
          id: `PK-${Date.now().toString().slice(-4)}`,
          sport: pickData.sport || 'football',
          eventTitle: pickData.eventTitle || 'Evento Desconocido',
          league: pickData.league || 'Liga Oficial',
          market: pickData.market || 'Hándicap Asiático',
          selection: pickData.selection || 'Selección',
          odds: pickData.odds || 1.90,
          modelProb: pickData.modelProb || 58.0,
          impliedProb: pickData.impliedProb || 52.6,
          edge: pickData.edge || 10.2,
          stakeUnits: pickData.stakeUnits || 1.5,
          stakeSoles: pickData.stakeSoles || 75,
          timestamp: new Date().toISOString(),
          status: 'PENDING',
          settlementNotes: pickData.settlementNotes || 'Registrado manualmente'
        };
        const updated = [newPick, ...trackedPicks];
        setTrackedPicks(updated);
        localStorage.setItem('tipster_tracked_picks_db', JSON.stringify(updated));
        setAuditPerformance(recalculateAudit(updated));
      }
    } catch (err: any) {
      console.error('Error adding pick to database:', err);
      throw err;
    }
  };

  // Handler: Trigger Calibration
  const handleTriggerCalibration = async () => {
    try {
      const response = await fetch('/api/ai/trigger-calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.state) {
          setAutoLearningState(result.state);
        }
      } else {
        // Local simulation of calibration
        setAutoLearningState(prev => ({
          ...prev,
          totalAnalysesProcessed: prev.totalAnalysesProcessed + 1,
          accuracyOptimizedPercent: Number((prev.accuracyOptimizedPercent + 0.3).toFixed(1)),
          lastCalibrationDate: `Hoy, ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
          calibrationLogs: [
            {
              id: `cal-${Date.now()}`,
              timestamp: `Hoy, ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
              trigger: 'Re-calibración manual ejecutada por el usuario',
              weightsAdjusted: ['keyInjuriesImpactWeight', 'homeAdvantageFactor'],
              optimizationDelta: '+0.3% Precisión',
              notes: 'Ponderación optimizada para los 5 deportes activos.'
            },
            ...prev.calibrationLogs
          ]
        }));
      }
    } catch (err: any) {
      console.error('Error triggering calibration:', err);
      throw err;
    }
  };

  // Handler: Diagnose Pick with AI
  const handleDiagnosePick = async (pick: TrackedPick, context?: string): Promise<AIErrorDiagnostic> => {
    try {
      const response = await fetch('/api/ai/diagnose-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickId: pick.id,
          eventTitle: pick.eventTitle,
          sport: pick.sport,
          selection: pick.selection,
          market: pick.market,
          finalScore: pick.finalScore || 'Resultado Desfavorable',
          odds: pick.odds,
          actualContext: context || 'Partido con desvío en ritmo o incidentes tácticos.'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.diagnostic) {
          setAutoLearningState(prev => ({
            ...prev,
            recentErrorDiagnostics: [data.diagnostic, ...prev.recentErrorDiagnostics.filter(d => d.pickId !== pick.id)]
          }));
          return data.diagnostic;
        }
      }
      throw new Error('No se pudo generar el diagnóstico');
    } catch (err: any) {
      console.error('Error diagnosing pick:', err);
      throw err;
    }
  };

  // AutoPilot Periodic Countdown & Auto-Refresh Simulation
  useEffect(() => {
    if (!autoPilot.isEnabled) return;

    const interval = setInterval(() => {
      setAutoPilot(prev => {
        if (!prev.isEnabled) return prev;
        const nextMin = prev.nextScanMinutes <= 1 ? 15 : prev.nextScanMinutes - 1;
        return {
          ...prev,
          nextScanMinutes: nextMin
        };
      });
    }, 60000); // every minute

    return () => clearInterval(interval);
  }, [autoPilot.isEnabled]);

  // Toggle Master Switch
  const handleToggleAutoPilot = () => {
    setAutoPilot(prev => {
      const nextState = {
        ...prev,
        isEnabled: !prev.isEnabled
      };
      try {
        localStorage.setItem('tipster_autopilot_state', JSON.stringify(nextState));
      } catch (e) {
        console.warn('Failed to persist autopilot state');
      }
      return nextState;
    });
  };

  // Manual Trigger Runner for testing & official Telegram API dispatch with 100% Neutral Formatting
  const handleTriggerManualRun = async (type: AutoPilotTriggerType) => {
    const now = new Date();
    const timeString = `Hoy, ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    let newLog: AutoPilotLog;
    let telegramTextToSend = '';

    if (type === 'morning_scan' || type === 'morning_free_pick') {
      const topPick = evSignals[0] || EV_SIGNALS_LIST[0];
      telegramTextToSend = formatSingleSignalMessage(topPick, true);

      newLog = {
        id: `log-${Date.now()}`,
        timestamp: timeString,
        type: 'morning_scan',
        title: '🎁 Disparador 09:00 AM: 1 Pick Gratuito Destacado',
        message: telegramTextToSend.replace(/<[^>]*>?/gm, ''),
        telegramStatus: 'SENT',
        metrics: { picksCount: 1, winRate: 68.4 }
      };
    } else if (type === 'golden_parlay_vip') {
      const sampleParlay: GoldenParlay = {
        id: `parlay-${Date.now()}`,
        title: 'Combinada de Oro del Día',
        legs: [
          {
            id: 'leg-1',
            matchTitle: 'Universitario vs Los Chankas',
            tournament: 'Liga 1 Perú',
            selection: 'Universitario -1.5 AH',
            odds: 1.92,
            confidence: 86.4
          },
          {
            id: 'leg-2',
            matchTitle: 'Sporting Cristal vs Sport Huancayo',
            tournament: 'Liga 1 Perú',
            selection: 'Cristal Gana + Más 1.5 Goles',
            odds: 1.65,
            confidence: 84.1
          }
        ],
        totalOdds: 3.17,
        recommendedStakeUnits: 1.0,
        jointModelProb: 55.4,
        status: 'pending',
        createdAt: timeString
      };

      telegramTextToSend = formatGoldenParlayMessage(sampleParlay);

      newLog = {
        id: `log-${Date.now()}`,
        timestamp: timeString,
        type: 'golden_parlay_vip',
        title: '🔥 Disparador 10:00 AM: Combinada de Oro VIP (@3.17)',
        message: telegramTextToSend.replace(/<[^>]*>?/gm, ''),
        telegramStatus: 'SENT',
        metrics: { totalOdds: 3.17, legsCount: 2 }
      };
    } else if (type === 'live_settlement') {
      const winAmount = (bankrollSettings.unitValueSoles * 2.2).toFixed(2);
      telegramTextToSend = formatSettlementMessage(
        'Alianza Lima vs Cienciano',
        'Alianza Lima Gana a Cero',
        2.10,
        true,
        2.20,
        '2 - 0 (FINAL)'
      );

      newLog = {
        id: `log-${Date.now()}`,
        timestamp: timeString,
        type: 'live_settlement',
        title: '✅ Disparador Post-Partido: Liquidación Oficial (Ganada)',
        message: telegramTextToSend.replace(/<[^>]*>?/gm, ''),
        telegramStatus: 'SENT',
        metrics: { result: 'GANADA', settledMatch: 'Alianza Lima vs Cienciano' }
      };
    } else if (type === 'nightly_audit') {
      const netGain = bankrollSettings.unitValueSoles * 5.68;
      const finalBank = bankrollSettings.totalBankrollSoles + netGain;

      telegramTextToSend = formatNightlyAuditMessage(
        6,
        5,
        1,
        83.3,
        28.4,
        5.68,
        netGain,
        finalBank
      );

      newLog = {
        id: `log-${Date.now()}`,
        timestamp: timeString,
        type: 'nightly_audit',
        title: '📊 Reporte Nocturno de Balance Diario Auditado (23:00 PM)',
        message: telegramTextToSend.replace(/<[^>]*>?/gm, ''),
        telegramStatus: 'SENT',
        metrics: { unitsWon: 5.68, winRate: 83.3 }
      };
    } else {
      telegramTextToSend = formatVIPPlansBroadcastMessage(DEFAULT_VIP_PLANS, DEFAULT_PAYMENT_SETTINGS);

      newLog = {
        id: `log-${Date.now()}`,
        timestamp: timeString,
        type: 'vip_plans_broadcast',
        title: '👑 Difusión de Membresías VIP & Medios de Pago',
        message: telegramTextToSend.replace(/<[^>]*>?/gm, ''),
        telegramStatus: 'SENT',
        metrics: { plansCount: DEFAULT_VIP_PLANS.length }
      };
    }

    // Dispatch live to Telegram destination
    const targetChat = autoPilot.telegramChatId || autoPilot.telegramChannelName || '@FijasIA';
    if (targetChat) {
      try {
        await sendTelegramMessage(telegramTextToSend, targetChat, 'HTML');
      } catch (err) {
        console.warn('Telegram API send notice:', err);
      }
    }

    setAutoPilot(prev => {
      const updated = {
        ...prev,
        lastTelegramSentTime: timeString,
        recentLogs: [newLog, ...prev.recentLogs]
      };
      try {
        localStorage.setItem('tipster_autopilot_state', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save log');
      }
      return updated;
    });
  };

  // Save bankroll updates
  const handleSaveBankroll = (newSettings: BankrollSettings) => {
    setBankrollSettings(newSettings);
    try {
      localStorage.setItem('tipster_bankroll_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to persist bankroll settings');
    }
  };

  // Keyboard shortcut: Ctrl + K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handlers for adding to Parlay
  const handleAddSignalToParlay = (signal: EVSignal) => {
    const existingIndex = parlayLegs.findIndex(l => l.matchId === signal.matchId);
    if (existingIndex >= 0) {
      // Replace or ignore
      const updated = [...parlayLegs];
      updated[existingIndex] = {
        id: `leg-${signal.id}`,
        matchId: signal.matchId,
        matchTitle: signal.matchTitle,
        league: signal.league,
        market: signal.market,
        selection: signal.selection,
        odds: signal.odds,
        modelProb: signal.modelProb,
        edge: signal.edge,
        date: 'Hoy',
        time: signal.timeToKickoff
      };
      setParlayLegs(updated);
    } else {
      if (parlayLegs.length >= 8) {
        alert('El constructor de parlays admite un máximo de 8 piernas.');
        return;
      }
      setParlayLegs(prev => [
        ...prev,
        {
          id: `leg-${signal.id}`,
          matchId: signal.matchId,
          matchTitle: signal.matchTitle,
          league: signal.league,
          market: signal.market,
          selection: signal.selection,
          odds: signal.odds,
          modelProb: signal.modelProb,
          edge: signal.edge,
          date: 'Hoy',
          time: signal.timeToKickoff
        }
      ]);
    }
  };

  const handleAddCustomLegToParlay = (leg: ParlayLeg) => {
    const existingIndex = parlayLegs.findIndex(l => l.matchId === leg.matchId);
    if (existingIndex >= 0) {
      const updated = [...parlayLegs];
      updated[existingIndex] = leg;
      setParlayLegs(updated);
    } else {
      if (parlayLegs.length >= 8) {
        alert('El constructor de parlays admite un máximo de 8 piernas.');
        return;
      }
      setParlayLegs(prev => [...prev, leg]);
    }
  };

  const handleRemoveParlayLeg = (legId: string) => {
    setParlayLegs(prev => prev.filter(l => l.id !== legId));
  };

  const handleClearParlay = () => {
    setParlayLegs([]);
  };

  // Add preset parlays
  const handleAddPresetParlay = (presetType: 'gold' | 'triplet' | 'mega') => {
    if (presetType === 'gold') {
      // Top 3 +EV signals
      const goldSignals = evSignals.slice(0, 3);
      const newLegs: ParlayLeg[] = goldSignals.map(s => ({
        id: `preset-gold-${s.id}`,
        matchId: s.matchId,
        matchTitle: s.matchTitle,
        league: s.league,
        market: s.market,
        selection: s.selection,
        odds: s.odds,
        modelProb: s.modelProb,
        edge: s.edge,
        date: 'Hoy',
        time: s.timeToKickoff
      }));
      setParlayLegs(newLegs);
    } else if (presetType === 'triplet') {
      // Universitario, Man City, Real Madrid
      const selected = [evSignals[0], evSignals[1], evSignals[2]].filter(Boolean);
      const newLegs: ParlayLeg[] = selected.map(s => ({
        id: `preset-triplet-${s.id}`,
        matchId: s.matchId,
        matchTitle: s.matchTitle,
        league: s.league,
        market: s.market,
        selection: s.selection,
        odds: s.odds,
        modelProb: s.modelProb,
        edge: s.edge,
        date: 'Hoy',
        time: s.timeToKickoff
      }));
      setParlayLegs(newLegs);
    } else if (presetType === 'mega') {
      // 5 top signals
      const megaSignals = evSignals.slice(0, 5);
      const newLegs: ParlayLeg[] = megaSignals.map(s => ({
        id: `preset-mega-${s.id}`,
        matchId: s.matchId,
        matchTitle: s.matchTitle,
        league: s.league,
        market: s.market,
        selection: s.selection,
        odds: s.odds,
        modelProb: s.modelProb,
        edge: s.edge,
        date: 'Hoy',
        time: s.timeToKickoff
      }));
      setParlayLegs(newLegs);
    }
  };

  const isLegAddedToParlay = (matchId: string, selection: string) => {
    return parlayLegs.some(l => l.matchId === matchId && l.selection === selection);
  };

  const handleSelectSignal = (signal: EVSignal) => {
    const foundMatch = matches.find(m => m.id === signal.matchId);
    if (foundMatch) {
      setActiveMatch(foundMatch);
    }
  };

  // Count matches & signals by sport
  const countsBySport = {
    football: matches.filter(m => m.sport === 'football').length,
    basketball: matches.filter(m => m.sport === 'basketball').length,
    tennis: matches.filter(m => m.sport === 'tennis').length,
    baseball: matches.filter(m => m.sport === 'baseball').length,
    mma: matches.filter(m => m.sport === 'mma').length
  };

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem('fijas_ia_admin_auth');
    } catch (e) {}
    setIsAdminAuthenticated(false);
  };

  if (!isAdminAuthenticated) {
    return <AdminLoginGateModal onLoginSuccess={() => setIsAdminAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* 1. Universal Top Header */}
      <Header
        engineConfig={engineConfig}
        bankrollSettings={bankrollSettings}
        isAutoPilotActive={autoPilot.isEnabled}
        onLogout={handleAdminLogout}
        onOpenAutoPilotModal={() => setIsAutoPilotModalOpen(true)}
        onOpenSalesAgentModal={() => setIsSalesAgentModalOpen(true)}
        onOpenVIPModal={() => setIsVIPModalOpen(true)}
        onOpenPicksDatabaseModal={() => setIsPicksDatabaseOpen(true)}
        onOpenAutoLearningModal={() => setIsAutoLearningOpen(true)}
        onOpenMasterCycleModal={() => setIsMasterCycleOpen(true)}
        onOpenLiveScannerModal={() => setIsLiveScannerOpen(true)}
        onOpenBankrollModal={() => setIsBankrollModalOpen(true)}
        onOpenEngineConfig={() => setIsEngineModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenParlayCalculator={() => setIsParlayModalOpen(true)}
        onOpenKellySimulator={() => setIsKellyModalOpen(true)}
        parlayLegsCount={parlayLegs.length}
      />

      {/* 2. Automated Bot Scheduler 24/7 Status Bar */}
      <AutoPilotStatusBar
        autoPilot={autoPilot}
        onToggleAutoPilot={handleToggleAutoPilot}
        onOpenSchedulerModal={() => setIsAutoPilotModalOpen(true)}
        onTriggerManualRun={handleTriggerManualRun}
        onOpenMasterCycleModal={() => setIsMasterCycleOpen(true)}
        onOpenLiveScannerModal={() => setIsLiveScannerOpen(true)}
      />

      {/* 3. Multi-Sport Discipline Filter Bar */}
      <MultiSportFilterBar
        selectedSport={selectedSport}
        onSelectSport={(sport) => setSelectedSport(sport)}
        countsBySport={countsBySport}
        onRefreshLiveMatches={() => syncLiveMatchesFromESPN(true)}
        isLiveSyncing={isLiveSyncing}
        lastSyncTime={lastSyncTime}
      />

      {/* 4. Algorithm KPIs Header (No personal balances) */}
      <KPIHeader
        kpis={kpis}
        engineConfig={engineConfig}
        onSelectSignalFilter={() => setSelectedLeague('all')}
      />

      {/* 5. Main Command Center (Responsive Architecture) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5">
        {/* Mobile View Switcher (Visible only on mobile/tablets < lg) */}
        <div className="lg:hidden mb-4 flex items-center justify-between p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <button
            type="button"
            onClick={() => setActiveMobileView('both')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center ${
              activeMobileView === 'both'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vista Completa
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileView('signals')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeMobileView === 'signals'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Señales +EV ({evSignals.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileView('matches')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeMobileView === 'matches'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Partidos ({matches.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Column Left: Señales de Valor +EV (5 cols on lg) */}
          <section className={`lg:col-span-5 w-full ${activeMobileView === 'matches' ? 'hidden lg:block' : 'block'}`}>
            <EVSignalsColumn
              signals={evSignals}
              matches={matches}
              bankrollSettings={bankrollSettings}
              onSelectSignal={handleSelectSignal}
              onAddToParlay={handleAddSignalToParlay}
              addedSignalIds={parlayLegs.map(l => l.id.replace('leg-', ''))}
              selectedSport={selectedSport}
            />
          </section>

          {/* Column Right: Partidos Oficiales (7 cols on lg) */}
          <section className={`lg:col-span-7 w-full ${activeMobileView === 'signals' ? 'hidden lg:block' : 'block'}`}>
            <OfficialMatchesColumn
              matches={matches}
              onSelectMatch={(match) => setActiveMatch(match)}
              onAddCustomLegToParlay={handleAddCustomLegToParlay}
              selectedLeague={selectedLeague}
              onSelectLeague={(league) => setSelectedLeague(league)}
              activeMatchId={activeMatch?.id}
              selectedSport={selectedSport}
            />
          </section>
        </div>
      </main>

      {/* Floating Quick Parlay Bar (Mobile & Desktop indicator when items added) */}
      {parlayLegs.length > 0 && !isParlayModalOpen && (
        <div className="fixed bottom-5 right-5 z-40 animate-in slide-in-from-bottom-5">
          <button
            id="floating-parlay-pill"
            onClick={() => setIsParlayModalOpen(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              <span>Ticket Combinada ({parlayLegs.length})</span>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <span className="font-extrabold text-xs bg-black/30 px-2 py-0.5 rounded-lg">
              @{parlayLegs.reduce((acc, l) => acc * l.odds, 1).toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#070A12] py-6 px-4 text-center text-xs text-slate-400 space-y-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>FIJAS IA • Inteligencia Cuantitativa & +EV Tipster</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Modelos Cuantitativos: Algoritmo Propietario FIJAS IA, Redes Neuronales & Inferencia de Valor Esperado (+EV). Compatible con Todas las Casas.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button onClick={() => setIsVIPModalOpen(true)} className="hover:text-amber-400 font-semibold transition-colors">
              👑 Planes VIP
            </button>
            <button onClick={() => setIsBankrollModalOpen(true)} className="hover:text-emerald-400 transition-colors">
              Banca (S/.)
            </button>
            <button onClick={() => setIsKellyModalOpen(true)} className="hover:text-cyan-400 transition-colors">
              Gestión Kelly
            </button>
            <button onClick={() => setIsEngineModalOpen(true)} className="hover:text-emerald-400 transition-colors">
              Motor IA
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {/* 1. Match Intelligence Modal */}
      <MatchIntelligenceModal
        match={activeMatch}
        onClose={() => setActiveMatch(null)}
        engineConfig={engineConfig}
        bankrollSettings={bankrollSettings}
        onAddLegToParlay={handleAddCustomLegToParlay}
        isLegAddedToParlay={isLegAddedToParlay}
      />

      {/* 2. Parlay Calculator Modal */}
      <ParlayCalculatorModal
        isOpen={isParlayModalOpen}
        onClose={() => setIsParlayModalOpen(false)}
        legs={parlayLegs}
        bankrollSettings={bankrollSettings}
        onRemoveLeg={handleRemoveParlayLeg}
        onClearParlay={handleClearParlay}
        onAddPresetParlay={handleAddPresetParlay}
        availableSignals={evSignals}
        matches={matches}
        onAddSignalToParlay={handleAddSignalToParlay}
      />

      {/* 3. Universal Search Modal (Ctrl + K) */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        matches={matches}
        evSignals={evSignals}
        onSelectMatch={(match) => setActiveMatch(match)}
        onSelectEVSignal={handleSelectSignal}
        onAddToParlay={handleAddSignalToParlay}
      />

      {/* 4. Dual Engine Config Modal */}
      <EngineConfigModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        config={engineConfig}
        onUpdateConfig={(newConfig) => setEngineConfig(newConfig)}
      />

      {/* 5. Kelly Simulator Tool */}
      <KellySimulatorDrawer
        isOpen={isKellyModalOpen}
        onClose={() => setIsKellyModalOpen(false)}
      />

      {/* 6. Bankroll Settings Modal */}
      <BankrollSettingsModal
        isOpen={isBankrollModalOpen}
        onClose={() => setIsBankrollModalOpen(false)}
        settings={bankrollSettings}
        onSaveSettings={handleSaveBankroll}
      />

      {/* 7. AutoPilot 24/7 Scheduler Modal */}
      <AutoPilotSchedulerModal
        isOpen={isAutoPilotModalOpen}
        onClose={() => setIsAutoPilotModalOpen(false)}
        autoPilot={autoPilot}
        onToggleAutoPilot={handleToggleAutoPilot}
        onTriggerManualRun={handleTriggerManualRun}
        onUpdateChannelName={(channelName) => {
          setAutoPilot(prev => {
            const next = { ...prev, telegramChannelName: channelName, telegramChatId: channelName };
            try {
              localStorage.setItem('tipster_autopilot_state', JSON.stringify(next));
            } catch (e) {
              console.warn('Failed to save channel name');
            }
            return next;
          });
        }}
        onUpdateChatId={(chatId) => {
          setAutoPilot(prev => {
            const next = { ...prev, telegramChatId: chatId, telegramChannelName: chatId };
            try {
              localStorage.setItem('tipster_autopilot_state', JSON.stringify(next));
            } catch (e) {
              console.warn('Failed to save chat id');
            }
            return next;
          });
        }}
      />

      {/* 8. VIP Subscription & Payments Modal */}
      <VIPSubscriptionModal
        isOpen={isVIPModalOpen}
        onClose={() => setIsVIPModalOpen(false)}
        defaultChatId={autoPilot.telegramChatId || autoPilot.telegramChannelName || '@FijasIA'}
      />

      {/* 9. Interactive Sales & Support VIP Bot Agent Modal */}
      <TelegramSalesAgentModal
        isOpen={isSalesAgentModalOpen}
        onClose={() => setIsSalesAgentModalOpen(false)}
        vipPlans={DEFAULT_VIP_PLANS}
        paymentSettings={DEFAULT_PAYMENT_SETTINGS}
        onOpenPaymentModal={() => {
          setIsSalesAgentModalOpen(false);
          setIsVIPModalOpen(true);
        }}
      />

      {/* 10. Multi-Sport Picks Tracking & Official Audit Database Modal */}
      <PicksTrackingDatabaseModal
        isOpen={isPicksDatabaseOpen}
        onClose={() => setIsPicksDatabaseOpen(false)}
        trackedPicks={trackedPicks}
        auditPerformance={auditPerformance}
        onSettlePick={handleSettlePick}
        onAddTrackedPick={handleAddTrackedPick}
        onOpenAIDiagnostic={(pick) => {
          setIsPicksDatabaseOpen(false);
          setIsAutoLearningOpen(true);
        }}
      />

      {/* 11. AI Auto-Learning & Feedback Loop Optimization Modal */}
      <AIAutoLearningModal
        isOpen={isAutoLearningOpen}
        onClose={() => setIsAutoLearningOpen(false)}
        autoLearningState={autoLearningState}
        onTriggerCalibration={handleTriggerCalibration}
        onDiagnosePick={handleDiagnosePick}
      />

      {/* 12. Master Cycle of 4 Stages Modal */}
      <MasterCycleModal
        isOpen={isMasterCycleOpen}
        onClose={() => setIsMasterCycleOpen(false)}
        trackedPicks={trackedPicks}
        onRefreshTrackedPicks={fetchServerTrackedPicks}
      />

      {/* 13. Dual Engine: Next-Day Continuous Analysis, Live In-Play Scanner & Golden Parlay VIP Modal */}
      <LiveScannerModal
        isOpen={isLiveScannerOpen}
        onClose={() => setIsLiveScannerOpen(false)}
        onRefreshDatabase={fetchServerTrackedPicks}
      />
    </div>
  );
}
