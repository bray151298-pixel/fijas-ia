export type SportType = 'football' | 'basketball' | 'tennis' | 'baseball' | 'mma';

export type LeagueId = 
  | 'all'
  | 'liga1-peru'
  | 'premier-league'
  | 'la-liga'
  | 'serie-a'
  | 'champions-league'
  | 'copa-libertadores'
  | 'nba-basketball'
  | 'tennis-atp-wta'
  | 'mlb-baseball'
  | 'ufc-mma';

export interface SportDefinition {
  id: SportType;
  name: string;
  emoji: string;
  iconName: string;
  leagues: { id: LeagueId; name: string; flag: string }[];
  marketLabels: {
    primary: string;
    secondary: string;
    totals: string;
    handicap: string;
  };
}

export interface AbsenceInfo {
  team: string;
  player: string;
  position: string;
  reason: string;
  impactLevel: 'alto' | 'medio' | 'bajo';
}

export interface H2HRecord {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  homeXG?: number;
  awayXG?: number;
  winner: 'home' | 'draw' | 'away';
  competition: string;
}

export interface MatchOdds {
  home: number;
  draw?: number;
  away: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
  doubleChance1X?: number;
  doubleChanceX2?: number;
  doubleChance12?: number;
  // Multi-Sport Specific Lines
  spreadHandicapHome?: number; // e.g. -6.5 @ 1.90 (NBA) or -1.5 @ 1.95 (MLB/Tennis)
  spreadHandicapAway?: number; // e.g. +6.5 @ 1.90
  spreadPoints?: number;       // e.g. -6.5 / +6.5
  totalOverUnderPoints?: number; // e.g. 224.5 (NBA) / 8.5 (MLB) / 21.5 (Tennis) / 2.5 (UFC rounds)
  totalOverOdds?: number;      // e.g. 1.90
  totalUnderOdds?: number;     // e.g. 1.90
  propMethodKO?: number;       // UFC KO/TKO
  propMethodSub?: number;      // UFC Submission
  propMethodDec?: number;      // UFC Decision
}

export interface CalibratedProbabilities {
  home: number;      // %
  draw?: number;     // %
  away: number;      // %
  over15?: number;   // %
  over25?: number;   // %
  under25?: number;  // %
  bttsYes?: number;  // %
  bttsNo?: number;   // %
  cleanSheetHome?: number;
  cleanSheetAway?: number;
  totalOverProb?: number;   // % (Multi-sport totals)
  totalUnderProb?: number;  // %
  spreadCoverProb?: number; // % (Multi-sport handicap)
}

export interface EVSignal {
  id: string;
  sport: SportType;
  matchId: string;
  matchTitle: string;
  league: string;
  market: string;
  selection: string;
  plainMarket?: string;
  plainSelection?: string;
  odds: number;
  fairOdds: number;
  modelProb: number;
  impliedProb: number;
  edge: number;           // e.g. +8.4%
  stake: '+1.0u' | '+1.5u' | '+2.0u' | '+2.5u';
  stakeMultiplier?: number;
  confidence: number;     // 0 - 100
  urgency: 'ALTA' | 'MEDIA' | 'ESTABLE';
  rationale: string;
  tacticalReason?: string;
  injuriesContext?: string;
  timeToKickoff: string;
  apuestaTotalMarketCode?: string;
  apuestaTotalDeepLink?: string;
  apuestaTotalSpecialBoost?: boolean;
}

export interface BankrollSettings {
  totalBankrollSoles: number; // e.g. S/. 1000
  unitValueSoles: number;     // e.g. S/. 20 (2% of bankroll)
  currency: 'PEN';            // Soles Peruanos
}

export interface ApuestaTotalMarketComparison {
  marketName: string;
  apuestaTotalOdds: number;
  fairOdds: number;
  modelProb: number;
  edge: number;
  hasValue: boolean;
}

export interface MatchSportStats {
  // Football
  homeXG?: number;
  awayXG?: number;
  homePossession?: number;
  awayPossession?: number;
  homeShotsOnTarget?: number;
  awayShotsOnTarget?: number;
  // Basketball (NBA)
  homePointsPerGame?: number;
  awayPointsPerGame?: number;
  homePace?: number;
  awayPace?: number;
  homeOffensiveRating?: number;
  awayDefensiveRating?: number;
  // Tennis
  firstServePercentageHome?: number;
  firstServePercentageAway?: number;
  acesPerMatchHome?: number;
  breakPointConversionHome?: number;
  surfaceType?: 'Dura' | 'Polvo de Ladrillo' | 'Césped';
  // Baseball (MLB)
  startingPitcherHome?: string;
  startingPitcherAway?: string;
  eraPitcherHome?: number;
  eraPitcherAway?: number;
  whipHome?: number;
  whipAway?: number;
  // MMA / UFC
  fighter1Record?: string; // e.g. "26-1-0"
  fighter2Record?: string; // e.g. "21-3-0"
  fighter1SigStrikesPerMin?: number;
  fighter2SigStrikesPerMin?: number;
  fighter1TakedownAvg?: number;
  fighter2TakedownAvg?: number;
}

export interface Match {
  id: string;
  sport: SportType;
  leagueId: LeagueId;
  league: string;
  leagueFlag: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  referee?: string;
  temperature?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  liveMinute?: number;
  liveScore?: { home: number; away: number; periodInfo?: string };
  odds: MatchOdds;
  probabilities: CalibratedProbabilities;
  h2h: H2HRecord[];
  form: {
    home: ('W' | 'D' | 'L')[];
    away: ('W' | 'D' | 'L')[];
  };
  statsComparison: {
    homeXG: number;
    awayXG: number;
    homePossession: number;
    awayPossession: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
  };
  sportStats?: MatchSportStats;
  absences?: AbsenceInfo[];
  evSignal?: EVSignal;
}

// Tracked Pick Database Interface
export interface TrackedPick {
  id: string;
  sport: SportType;
  eventTitle: string;
  league: string;
  market: string;
  selection: string;
  odds: number;
  modelProb: number;
  impliedProb: number;
  edge: number;
  stakeUnits: number; // e.g. 1.0, 1.5, 2.0
  stakeSoles: number;  // e.g. S/. 50.00
  timestamp: string;  // ISO string
  status: 'PENDING' | 'WON' | 'LOST' | 'PUSH';
  finalScore?: string; // e.g. "Universitario 2 - 0 Los Chankas"
  netUnits?: number;   // e.g. +1.84 or -2.00
  netProfitSoles?: number; // e.g. +S/. 92.00 or -S/. 100.00
  settledAt?: string;
  telegramNotified?: boolean;
  settlementNotes?: string;
  clvPercent?: number; // Closing line value edge
}

export interface AuditPerformance {
  totalPicks: number;
  pendingPicks: number;
  wonPicks: number;
  lostPicks: number;
  pushPicks: number;
  winRate: number; // e.g. 68.4%
  totalUnitsStaked: number;
  netUnitsProfit: number;
  yieldRoi: number; // e.g. +16.8%
  netProfitSoles: number;
  historyChartData: {
    pickNumber: number;
    date: string;
    event: string;
    sport: SportType;
    result: 'WON' | 'LOST' | 'PUSH' | 'PENDING';
    unitsWon: number;
    cumulativeUnits: number;
    yieldProgress: number;
    winRateProgress: number;
  }[];
}

// Continuous AI Auto-Learning & Feedback Loop
export interface AIErrorDiagnostic {
  id: string;
  pickId?: string;
  date: string;
  eventTitle: string;
  sport: SportType;
  failedMarket: string;
  pickSelection: string;
  rootCause: 
    | 'bajas_no_reportadas' 
    | 'tiempo_extra_fatiga' 
    | 'tarjeta_roja_expulsion' 
    | 'clima_viento' 
    | 'colapso_bullpen' 
    | 'corte_sumision_imprevista' 
    | 'alta_varianza';
  rootCauseLabel: string;
  aiExplanation: string;
  recalibrationAction: string;
  weightAdjusted: string;
}

export interface AIAutoLearningState {
  isActive: boolean;
  totalAnalysesProcessed: number;
  accuracyOptimizedPercent: number; // e.g. 5.4 (+5.4%)
  lastCalibrationDate: string;
  activeWeights: {
    homeAdvantageFactor: number;       // e.g. 1.12
    recentFormXGWeight: number;        // e.g. 0.38
    keyInjuriesImpactWeight: number;   // e.g. 0.32
    marketInefficiencyEdge: number;    // e.g. 0.25
    weatherFatigueAdjustment: number;  // e.g. 0.16
  };
  recentErrorDiagnostics: AIErrorDiagnostic[];
  calibrationLogs: {
    id: string;
    timestamp: string;
    trigger: string;
    optimizationDelta: string;
    notes: string;
  }[];
}

export interface TacticalAIReport {
  tacticalOverview: string;
  keyFactors: string[];
  absencesImpact: string;
  absencesContext?: string;
  bestValuePick: {
    market: string;
    selection: string;
    marketOdds: number;
    fairOdds: number;
    edgePercent: number;
    modelProbability: number;
    recommendedStake: string;
    verdict: string;
  };
  alternativePicks?: {
    market: string;
    selection: string;
    odds: number;
    edgePercent: number;
    recommendedStake: string;
  }[];
  riskRating: 'Bajo' | 'Moderado' | 'Alto';
  confidenceScore: number;
}

export interface EngineConfig {
  mode: 'gemini' | 'omniroute';
  geminiModel: string;
  omnirouteUrl: string;
  omnirouteKey: string;
  omnirouteModel: string;
  status: 'connected' | 'checking' | 'fallback' | 'error';
  lastPingMs?: number;
  minEdgeEV?: number;
}

export interface ParlayLeg {
  id: string;
  matchId: string;
  matchTitle: string;
  league: string;
  market: string;
  selection: string;
  odds: number;
  modelProb: number;
  edge: number;
  date: string;
  time: string;
}

export interface ParlayCalculation {
  legs: ParlayLeg[];
  totalOdds: number;
  fairOdds: number;
  jointModelProb: number;
  jointImpliedProb: number;
  totalEdge: number;
  recommendedStakeUnits: number;
  potentialPayoutMultiplier: number;
  correlationRisk: 'BAJO' | 'MODERADO' | 'ALTO';
  correlationNotes?: string;
}

export interface AlgorithmKPIs {
  winRate: number;        // e.g. 68.4
  roiYield: number;       // e.g. +16.8
  matchesAnalyzedToday: number; // e.g. 42
  activeEVSignals?: number;       // e.g. 6
  lastModelRun?: string;
  evSignalsDetected?: number;
  engineStatus?: string;
}

export interface VIPPlan {
  id: 'semanal' | 'mensual' | 'trimestral';
  name: string;
  priceSoles: number;
  priceUsdt: number;
  badge?: string;
  description: string;
  features: string[];
}

export interface PaymentSettings {
  yapeNumber: string;
  yapeHolder: string;
  plinNumber: string;
  plinHolder: string;
  binancePayId: string;
  usdtBep20Address: string;
  telegramSupportUser: string;
}

export interface GoldenParlayLeg {
  id: string;
  sport?: SportType;
  sportEmoji?: string;
  eventTitle?: string;
  matchTitle?: string;
  league?: string;
  tournament?: string;
  market?: string;
  selection: string;
  odds: number;
  modelProb?: number;
  confidence?: number;
  edge?: number;
  kickoffTime?: string;
  individualWinProb?: number;
  keyReason?: string;
  status?: 'PENDING' | 'WON' | 'LOST' | 'pending' | 'won' | 'lost';
  finalScore?: string;
}

export interface GoldenParlay {
  id?: string;
  title: string;
  date?: string;
  legs: GoldenParlayLeg[];
  totalOdds: number;
  recommendedStakeUnits: number;
  jointModelProb: number;
  totalEdge?: number;
  confidenceText?: string;
  status?: 'pending' | 'won' | 'lost';
  createdAt?: string;
}

export type AutoPilotTriggerType = 
  | 'morning_scan' 
  | 'morning_free_pick'
  | 'morning_vip_signals'
  | 'golden_parlay_vip'
  | 'daily_picks'
  | 'in_play_alert'
  | 'live_settlement' 
  | 'nightly_audit'
  | 'vip_plans_broadcast';

export interface AutoPilotLog {
  id: string;
  timestamp: string;
  type: AutoPilotTriggerType;
  title: string;
  message: string;
  telegramStatus: 'SENT' | 'PENDING' | 'SIMULATED';
  details?: string;
  metrics?: {
    picksCount?: number;
    unitsWon?: number;
    winRate?: number;
    settledMatch?: string;
    result?: 'GANADA' | 'PERDIDA' | 'PUSH';
    totalOdds?: number;
    legsCount?: number;
    plansCount?: number;
  };
}

export interface AutoPilotState {
  isEnabled: boolean;
  nextScheduledRun?: string;
  nextScanMinutes: number;
  lastTelegramSentTime: string;
  activeTrackingMatchesCount: number;
  autoSendTelegram: boolean;
  telegramChannelName: string;
  telegramChatId: string;
  telegramBotToken: string;
  telegramBotUsername: string;
  dailyVolume: {
    freePicksPerDay: number;
    vipSignalsCount: number;
    goldenParlaysPerDay: number;
  };
  triggers: {
    morningScan: { enabled: boolean; time: string; description: string; status: 'COMPLETED' | 'WAITING' | 'ACTIVE' };
    goldenParlay: { enabled: boolean; time: string; description: string; status: 'COMPLETED' | 'WAITING' | 'ACTIVE' };
    liveSettlement: { enabled: boolean; description: string; status: 'MONITORING' | 'SETTLING' | 'STANDBY' };
    nightlyAudit: { enabled: boolean; time: string; description: string; status: 'WAITING' | 'COMPLETED' };
  };
  recentLogs: AutoPilotLog[];
}

export interface VIPSubscriber {
  id: string;
  name: string;
  username?: string;
  chatId: string | number;
  planName: string;
  planId: 'semanal' | 'mensual' | 'trimestral';
  planDurationDays: number;
  amountPaid: number;
  currency: 'PEN' | 'USD' | 'USDT';
  operationNumber?: string;
  paymentMethod: 'Yape' | 'Plin' | 'Binance' | 'Transferencia' | 'Manual';
  startDate: string; // ISO string
  expiryDate: string; // ISO string
  daysRemaining: number;
  status: 'active' | 'expiring_soon' | 'expired' | 'revoked';
  inviteLink: string;
  verifiedByAI?: boolean;
  aiConfidenceScore?: number;
  lastReminderSentDate?: string;
  createdAt: string;
  notes?: string;
}

export interface VoucherVerificationResult {
  isValid: boolean;
  confidenceScore: number;
  paymentMethod: 'Yape' | 'Plin' | 'Binance' | 'Transferencia' | 'Otro';
  amount: number;
  currency: 'PEN' | 'USDT' | 'USD';
  operationNumber: string;
  dateStr: string;
  timeStr: string;
  beneficiaryName: string;
  beneficiaryPhoneOrId: string;
  planName: '⚡ Pase Semanal de Prueba (7 Días)' | '👑 Pase Mensual VIP (30 Días)' | '💎 Pase Trimestral (3 Meses / 90 Días)';
  planId: 'semanal' | 'mensual' | 'trimestral';
  planDurationDays: number;
  rejectionReason?: string | null;
  summaryNotes?: string;
  extractedTextPreview?: string;
}

export interface VIPCRMStats {
  totalRevenuePEN: number;
  totalRevenueUSDT: number;
  totalSubscribers: number;
  activeSubscribers: number;
  expiringSoonSubscribers: number;
  expiredSubscribers: number;
  renewalRatePercent: number;
}

// ==========================================
// CICLO MAESTRO DE 4 ETAPAS - TIPSTER IA
// ==========================================

export type MasterCycleStage = 
  | 'ETAPA_1_CARTELERA_NOCTURNA'
  | 'ETAPA_2_RESOLUCION_REALTIME'
  | 'ETAPA_3_CIERRE_JORNADA'
  | 'ETAPA_4_RESUMENES_HISTORICOS';

export interface DailyCarteleraItem {
  id: string;
  sport: SportType;
  sportEmoji: string;
  eventTitle: string;
  league: string;
  kickoffTime: string;
  market: string;
  selection: string;
  minOdds: number;
  modelProb: number;
  edge: number;
  stakeUnits: number;
  isVIP: boolean;
  notes?: string;
}

export interface DailyAuditRecord {
  id: string;
  date: string;          // e.g. "2026-08-23"
  dayName: string;       // e.g. "Domingo", "Sábado"
  totalPicks: number;
  wonPicks: number;
  lostPicks: number;
  pushPicks: number;
  winRate: number;       // e.g. 80.0%
  totalUnitsStaked: number;
  netUnits: number;      // e.g. +4.25
  netSoles: number;      // e.g. +212.50
  yieldRoi: number;      // e.g. +28.3%
  status: 'IN_PROGRESS' | 'COMPLETED';
  closingReportPublishedToTelegram: boolean;
  closingReportTime?: string;
  picksSummaryList: string[];
}

export interface WeeklyAuditRecord {
  id: string;
  weekNumber: number;
  dateRange: string;     // e.g. "17 Ago 2026 - 23 Ago 2026"
  totalDays: number;
  totalPicks: number;
  wonPicks: number;
  lostPicks: number;
  pushPicks: number;
  winRate: number;
  totalUnitsStaked: number;
  netUnits: number;
  netSoles: number;
  yieldRoi: number;
  bestDay: { day: string; netUnits: number };
  dailyBreakdown: { day: string; date: string; netUnits: number; winRate: number }[];
  isSundayBroadcastPublished: boolean;
  publishedAt?: string;
}

export interface MonthlyAuditRecord {
  id: string;
  monthName: string;     // e.g. "Agosto 2026"
  year: number;
  totalPicks: number;
  wonPicks: number;
  lostPicks: number;
  pushPicks: number;
  winRate: number;
  totalUnitsStaked: number;
  netUnits: number;
  netSoles: number;
  cumulativeYieldRoi: number; // e.g. +21.4%
  sportBreakdown: {
    sport: SportType;
    sportName: string;
    picks: number;
    winRate: number;
    netUnits: number;
  }[];
  clvPositivePercentage: number; // e.g. 91.2% CLV Beat
  isOfficialAuditPublished: boolean;
  publishedAt?: string;
}

export interface MasterCycleLog {
  id: string;
  timestamp: string;
  stage: MasterCycleStage;
  stageName: string;
  title: string;
  summary: string;
  telegramStatus: 'SENT' | 'SIMULATED' | 'STANDBY';
  details?: string;
}

export interface MasterCycleState {
  isActive: boolean;
  currentActiveStage: MasterCycleStage;
  serverTime: string;
  // ETAPA 1: Emisión Cartelera Nocturna (00:30 AM)
  stage1Cartelera: {
    scheduledTime: string; // "00:30 AM"
    isScheduledActive: boolean;
    lastIssuedDate?: string;
    totalPicksInBoard: number;
    freePicksCount: number;
    vipPicksCount: number;
    isCarteleraBroadcasted: boolean;
    carteleraItems: DailyCarteleraItem[];
  };
  // ETAPA 2: Resolución en Tiempo Real
  stage2Realtime: {
    isMonitoringActive: boolean;
    totalMatchesToday: number;
    settledMatchesToday: number;
    pendingMatchesToday: number;
    lastSettlementMessage?: string;
    lastSettledMatch?: {
      eventTitle: string;
      selection: string;
      finalScore: string;
      status: 'WON' | 'LOST' | 'PUSH';
      netUnits: number;
      settledAt: string;
    };
  };
  // ETAPA 3: Cierre de Jornada Automático
  stage3CierreJornada: {
    autoTriggerWhen100Percent: boolean;
    dayCompletionPercentage: number; // e.g. 100%
    isDayClosed: boolean;
    closingReportScheduledTime: string; // "23:00 PM o al 100% finalizado"
    lastClosingReport?: DailyAuditRecord;
  };
  // ETAPA 4: Base de Datos y Resúmenes Históricos
  stage4HistoricalDB: {
    totalAuditedDays: number;
    lifetimeNetUnits: number;
    lifetimeWinRate: number;
    lifetimeYield: number;
    dailyAudits: DailyAuditRecord[];
    weeklySummary: WeeklyAuditRecord;
    monthlySummary: MonthlyAuditRecord;
    sundayAutoBroadcastEnabled: boolean;
    monthlyAuditAutoBroadcastEnabled: boolean;
  };
  cycleLogs: MasterCycleLog[];
}

// ==========================================
// MÓDULO DUAL: ANÁLISIS PRE-PARTIDO DÍA SIGUIENTE
// ==========================================
export interface InjuryReportItem {
  team: string;
  player: string;
  position: string;
  status: 'CONFIRMED_OUT' | 'DOUBTFUL' | 'RETURNING';
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface NextDayMatchAnalysis {
  id: string;
  sport: SportType;
  sportEmoji: string;
  eventTitle: string;
  league: string;
  kickoffDate: string; // e.g. "Mañana, 24 Ago"
  kickoffTime: string; // e.g. "14:00"
  confirmedInjuries: InjuryReportItem[];
  openingOdds: {
    home: number;
    draw?: number;
    away: number;
    overUnder?: number;
  };
  fairOdds: {
    home: number;
    draw?: number;
    away: number;
    overUnder?: number;
  };
  bestMarket: string;
  bestSelection: string;
  currentBookieOdds: number;
  fairModelOdds: number;
  edgeEV: number; // e.g. +9.4%
  modelConfidence: number; // e.g. 84%
  tacticalNotes: string;
  isReadyForMidnightCartelera: boolean;
  isVIPCandidate: boolean;
  lastProcessedAt: string;
}

export interface NextDayPipelineStatus {
  isProcessing: boolean;
  itemsScannedCount: number;
  topOpportunitiesCount: number;
  nextMidnightRelease: string; // "00:30 AM"
  scannedMatches: NextDayMatchAnalysis[];
}

// ==========================================
// ESCÁNER DE OPORTUNIDADES EN VIVO (LIVE IN-PLAY)
// ==========================================
export interface LiveInPlayStats {
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  xGHome: number;
  xGAway: number;
  dangerousAttacksHome: number;
  dangerousAttacksAway: number;
  possessionHome: number;
  possessionAway: number;
  cardsHome: number;
  cardsAway: number;
  cornersHome?: number;
  cornersAway?: number;
  foulsHome?: number;
  foulsAway?: number;
}

export interface LiveInPlayMatch {
  id: string;
  sport: SportType;
  sportEmoji: string;
  eventTitle: string;
  league: string;
  currentMinute: number; // e.g. 68
  currentScore: string; // e.g. "0 - 0"
  period: string; // e.g. "2do Tiempo", "3er Cuarto", "2do Set"
  pressureIndex: number; // 0 to 100 (e.g. 88 - Dominio Total)
  stats: LiveInPlayStats;
  liveMarket: string; // e.g. "Más de 0.5 Goles en Vivo"
  liveSelection: string; // e.g. "Over 0.5 Goles FT"
  preMatchOdds: number; // e.g. 1.22
  liveOdds: number; // e.g. 1.88 (Subió por el paso de minutos)
  fairOdds: number; // e.g. 1.45 (Según xG actual y tiros)
  liveEdgeEV: number; // e.g. +14.5% (+EV > 12%)
  urgencyLevel: 'CRÍTICA' | 'ALTA' | 'MEDIA';
  reasonWhyLiveValue: string;
  status: 'SCANNING' | 'SIGNAL_TRIGGERED' | 'SETTLED_WON' | 'SETTLED_LOST';
  telegramBroadcastedAt?: string;
  settledAt?: string;
  netUnitsGained?: number;
  celebrationMessage?: string;
}

// ==========================================
// COMBINADA DE ORO VIP (ALTA PROBABILIDAD)
// ==========================================
export interface GoldenParlayVIP {
  id: string;
  date: string;
  title: string;
  legs: GoldenParlayLeg[];
  combinedOdds: number; // 2.10 to 2.85 (e.g. 2.48)
  jointWinProb: number; // > 68% (e.g. 71.2%)
  recommendedStakeUnits: number; // e.g. 2.5u
  stakeSoles: number; // e.g. S/. 125.00
  potentialReturnSoles: number; // e.g. S/. 310.00
  potentialNetSoles: number; // e.g. S/. 185.00
  status: 'ACTIVE' | 'WON' | 'LOST';
  issuedAt: string;
  settledAt?: string;
  isBroadcastVIP: boolean;
  settlementMessage?: string;
}

