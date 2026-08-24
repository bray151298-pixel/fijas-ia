import { 
  Match, 
  EVSignal, 
  AlgorithmKPIs, 
  SportDefinition, 
  SportType, 
  LeagueId, 
  TrackedPick, 
  AuditPerformance, 
  AIAutoLearningState 
} from '../types';

export const INITIAL_KPIS: AlgorithmKPIs = {
  winRate: 69.2,
  roiYield: 17.4,
  matchesAnalyzedToday: 48,
  evSignalsDetected: 14,
  engineStatus: 'Multi-Deporte Activo (Algoritmo Cuantitativo Propietario FIJAS IA)',
};

export const SPORTS_LIST: SportDefinition[] = [
  {
    id: 'football',
    name: 'Fútbol',
    emoji: '⚽',
    iconName: 'Trophy',
    leagues: [
      { id: 'liga1-peru', name: 'Liga 1 Perú', flag: '🇵🇪' },
      { id: 'premier-league', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { id: 'la-liga', name: 'La Liga EA Sports', flag: '🇪🇸' },
      { id: 'champions-league', name: 'UEFA Champions League', flag: '🇪🇺' },
      { id: 'copa-libertadores', name: 'Copa Libertadores', flag: '🏆' },
    ],
    marketLabels: {
      primary: '1X2 (Ganador)',
      secondary: 'Ambos Anotan (BTTS)',
      totals: 'Over/Under 2.5 Goles',
      handicap: 'Hándicap Asiático (-1.5)'
    }
  },
  {
    id: 'basketball',
    name: 'Básquetbol NBA',
    emoji: '🏀',
    iconName: 'Flame',
    leagues: [
      { id: 'nba-basketball', name: 'NBA Regular / Playoffs', flag: '🇺🇸' }
    ],
    marketLabels: {
      primary: 'Línea de Dinero (Moneyline)',
      secondary: 'Hándicap de Puntos (Spread)',
      totals: 'Total Puntos Over/Under',
      handicap: 'Spread Línea (-6.5)'
    }
  },
  {
    id: 'tennis',
    name: 'Tenis ATP / WTA',
    emoji: '🎾',
    iconName: 'Activity',
    leagues: [
      { id: 'tennis-atp-wta', name: 'Grand Slam / ATP Masters 1000', flag: '🎾' }
    ],
    marketLabels: {
      primary: 'Ganador de Partido (ML)',
      secondary: 'Hándicap de Juegos',
      totals: 'Total Juegos Over/Under',
      handicap: 'Hándicap Sets (-1.5)'
    }
  },
  {
    id: 'baseball',
    name: 'Béisbol MLB',
    emoji: '⚾',
    iconName: 'Sparkles',
    leagues: [
      { id: 'mlb-baseball', name: 'MLB Major League', flag: '🇺🇸' }
    ],
    marketLabels: {
      primary: 'Moneyline (Ganador)',
      secondary: 'Run Line (-1.5)',
      totals: 'Total Carreras Over/Under',
      handicap: 'Run Line (-1.5)'
    }
  },
  {
    id: 'mma',
    name: 'UFC / MMA',
    emoji: '🥊',
    iconName: 'Zap',
    leagues: [
      { id: 'ufc-mma', name: 'UFC Main Card / Fight Night', flag: '🥊' }
    ],
    marketLabels: {
      primary: 'Ganador de Combate',
      secondary: 'Método (KO/Sub/Dec)',
      totals: 'Total Asaltos Over/Under',
      handicap: 'No va a la Decisión'
    }
  }
];

export const LEAGUES_LIST = [
  { id: 'all' as const, name: 'Todos los Torneos', flag: '🌐', sport: 'all' },
  { id: 'liga1-peru' as const, name: 'Liga 1 Perú', flag: '🇵🇪', sport: 'football' },
  { id: 'premier-league' as const, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', sport: 'football' },
  { id: 'la-liga' as const, name: 'La Liga EA Sports', flag: '🇪🇸', sport: 'football' },
  { id: 'champions-league' as const, name: 'Champions League', flag: '🇪🇺', sport: 'football' },
  { id: 'copa-libertadores' as const, name: 'Copa Libertadores', flag: '🏆', sport: 'football' },
  { id: 'nba-basketball' as const, name: 'NBA Básquetbol', flag: '🏀', sport: 'basketball' },
  { id: 'tennis-atp-wta' as const, name: 'Tenis ATP/WTA', flag: '🎾', sport: 'tennis' },
  { id: 'mlb-baseball' as const, name: 'Béisbol MLB', flag: '⚾', sport: 'baseball' },
  { id: 'ufc-mma' as const, name: 'UFC / MMA', flag: '🥊', sport: 'mma' },
];

export const EV_SIGNALS_LIST: EVSignal[] = [
  // 1. Fútbol - Liga 1 Perú
  {
    id: 'ev-1',
    sport: 'football',
    matchId: 'match-u-chankas',
    matchTitle: 'Universitario vs Los Chankas',
    league: 'Liga 1 Perú (Torneo Clausura)',
    market: 'Hándicap de Goles (-1.5)',
    selection: 'Universitario gana por 2 o más goles (Hándicap -1.5)',
    plainMarket: 'Hándicap Asiático (-1.5)',
    plainSelection: 'Universitario -1.5 (Gana por 2+ goles)',
    odds: 1.92,
    fairOdds: 1.68,
    modelProb: 76.5,
    impliedProb: 52.1,
    edge: 13.6,
    stake: '+2.0u',
    confidence: 95,
    urgency: 'ALTA',
    rationale: 'Fortaleza en el Monumental (14 triunfos seguidos y 2.45 xG promedio). Los Chankas tienen suspendido a su central titular y bajan 38% su rendimiento en el llano de Lima.',
    tacticalReason: 'Universitario suma 14 triunfos consecutivos en el Monumental promediando 2.45 goles esperados (xG) y resolviendo sus duelos por 2 o más goles.',
    injuriesContext: 'Los Chankas tienen a su defensa central titular (E. Rostaing) suspendido y bajan un 38% su efectividad jugando a nivel del mar en Lima.',
    timeToKickoff: 'Hoy 18:30 (6:30 p.m. Lima)',
    apuestaTotalMarketCode: 'AT-L1-AH-902',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: true
  },
  // 2. Fútbol - La Liga EA Sports
  {
    id: 'ev-2',
    sport: 'football',
    matchId: 'match-elche-barca',
    matchTitle: 'Elche vs Barcelona',
    league: 'La Liga EA Sports (España)',
    market: 'Ganador y Total de Goles (Crear Apuesta)',
    selection: 'Gana Barcelona y Más de 1.5 Goles',
    plainMarket: 'Victoria + Más de 1.5 Goles',
    plainSelection: 'Gana Barcelona + Más de 1.5 Goles',
    odds: 1.58,
    fairOdds: 1.41,
    modelProb: 78.0,
    impliedProb: 63.2,
    edge: 12.4,
    stake: '+2.0u',
    confidence: 93,
    urgency: 'ALTA',
    rationale: 'Barcelona promedia 2.70 xG en sus últimas jornadas con 68% de posesión dominante; Elche sufre en el repliegue defensivo.',
    tacticalReason: 'Barcelona registra 2.70 goles esperados (xG) y genera más de 7 ocasiones claras por partido frente a defensas en bloque bajo.',
    injuriesContext: 'Elche tiene ausente a su contención titular por sanción disciplinaria.',
    timeToKickoff: 'Hoy 14:30 (2:30 p.m. Lima)',
    apuestaTotalMarketCode: 'AT-LL-CA-441',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: false
  },
  // 3. Fútbol - Liga 1 Perú (Arequipa)
  {
    id: 'ev-3',
    sport: 'football',
    matchId: 'match-melgar-alianza',
    matchTitle: 'FBC Melgar vs Alianza Lima',
    league: 'Liga 1 Perú (Torneo Clausura)',
    market: 'Doble Oportunidad & Goles',
    selection: 'Melgar Gana o Empata (1X) y Más de 1.5 Goles',
    plainMarket: '1X + Más de 1.5 Goles',
    plainSelection: 'Melgar 1X + Over 1.5',
    odds: 1.70,
    fairOdds: 1.54,
    modelProb: 73.0,
    impliedProb: 58.8,
    edge: 11.2,
    stake: '+2.0u',
    confidence: 91,
    urgency: 'ALTA',
    rationale: 'Melgar invicto en el Monumental de la UNSA en la altura de Arequipa (2,335 m) donde promedia 2.15 xG; Alianza llega con rotación defensiva.',
    tacticalReason: 'Factor altura decisivo en los últimos 30 minutos donde Melgar incrementa su presión un 28%.',
    injuriesContext: 'Alianza Lima con dosificación de mediocampistas tras seguidilla de partidos.',
    timeToKickoff: 'Hoy 15:30 (3:30 p.m. Lima)',
    apuestaTotalMarketCode: 'AT-L1-1X-301',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: true
  },
  // 4. Béisbol MLB
  {
    id: 'ev-mlb-1',
    sport: 'baseball',
    matchId: 'match-dodgers-pirates',
    matchTitle: 'LA Dodgers vs Pittsburgh Pirates',
    league: 'MLB Grandes Ligas',
    market: 'Línea de Dinero (Moneyline)',
    selection: 'Los Angeles Dodgers Ganador (ML)',
    plainMarket: 'Moneyline (Ganador)',
    plainSelection: 'LA Dodgers Ganador ML',
    odds: 1.55,
    fairOdds: 1.40,
    modelProb: 75.0,
    impliedProb: 64.5,
    edge: 10.7,
    stake: '+2.0u',
    confidence: 92,
    urgency: 'ALTA',
    rationale: 'Lanzador abridor con ERA de 2.85 y wOBA ofensivo de Dodgers de .348 frente a diestros.',
    tacticalReason: 'Métricas Statcast indican ventaja de contacto duro del 44.2% para Dodgers en Dodger Stadium.',
    injuriesContext: 'Bullpen de Pirates fatigado tras serie exigente de visita.',
    timeToKickoff: 'Hoy 15:10 (3:10 p.m. Lima)',
    apuestaTotalMarketCode: 'AT-MLB-ML-102',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: false
  },
  // 3. Básquetbol NBA
  {
    id: 'ev-nba-1',
    sport: 'basketball',
    matchId: 'match-celtics-heat',
    matchTitle: 'Boston Celtics vs Miami Heat',
    league: 'NBA Basketball',
    market: 'Hándicap de Puntos (-6.5)',
    selection: 'Boston Celtics -6.5 Hándicap (Cubre línea)',
    plainMarket: 'Spread Hándicap (-6.5)',
    plainSelection: 'Boston Celtics -6.5 Puntos',
    odds: 1.90,
    fairOdds: 1.70,
    modelProb: 58.8,
    impliedProb: 52.6,
    edge: 11.8,
    stake: '+2.0u',
    confidence: 92,
    urgency: 'ALTA',
    rationale: 'Boston promedia 121.4 puntos por cada 100 posesiones en el TD Garden. Miami llega en back-to-back tras tiempo extra anoche con minutos altos en sus titulares.',
    tacticalReason: 'Rating ofensivo de Boston de 121.4 en casa frente a defensa perimetral mermada de Miami en su segundo juego en 24 horas.',
    injuriesContext: 'Miami Heat tiene en duda a Tyler Herro y Jimmy Butler con restricción de minutos por fatiga tras 42 min jugados ayer.',
    timeToKickoff: 'Hoy, 19:30 UTC-5',
    apuestaTotalMarketCode: 'AT-NBA-SP-101',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: true
  },
  // 4. Tenis ATP Masters
  {
    id: 'ev-ten-1',
    sport: 'tennis',
    matchId: 'match-alcaraz-sinner',
    matchTitle: 'Carlos Alcaraz vs Jannik Sinner',
    league: 'ATP Masters 1000 (Pista Rápida)',
    market: 'Total de Juegos en el Partido',
    selection: 'Más de 22.5 Juegos Totales',
    plainMarket: 'Over 22.5 Juegos',
    plainSelection: 'Más de 22.5 Juegos (Partido Largo a 3 sets)',
    odds: 1.95,
    fairOdds: 1.72,
    modelProb: 58.1,
    impliedProb: 51.3,
    edge: 13.3,
    stake: '+1.5u',
    confidence: 89,
    urgency: 'ALTA',
    rationale: 'En 6 de sus 8 choques directos se ha llegado al set definitivo o al menos a un tiebreak. Ambos sostienen su servicio por encima del 88% en pista dura.',
    tacticalReason: 'Porcentaje de retención de saque superior al 88% en ambos tenistas con índice de tiebreak del 45% en sus duelos previos.',
    injuriesContext: 'Condiciones físicas al 100% en ambos jugadores tras 2 días de descanso completo.',
    timeToKickoff: 'Mañana, 16:00 UTC-5',
    apuestaTotalMarketCode: 'AT-TEN-OU-554',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: false
  },
  // 5. Béisbol MLB
  {
    id: 'ev-mlb-2',
    sport: 'baseball',
    matchId: 'match-yankees-redsox',
    matchTitle: 'NY Yankees vs Boston Red Sox',
    league: 'MLB Béisbol',
    market: 'Total de Carreras (Over/Under)',
    selection: 'Más de 8.5 Carreras Totales',
    plainMarket: 'Over 8.5 Carreras',
    plainSelection: 'Más de 8.5 Carreras en el Juego',
    odds: 1.91,
    fairOdds: 1.71,
    modelProb: 58.5,
    impliedProb: 52.3,
    edge: 11.9,
    stake: '+1.5u',
    confidence: 88,
    urgency: 'MEDIA',
    rationale: 'Viento a favor de 14 mph soplando hacia el jardín derecho en el Yankee Stadium. Ambos abridores vienen con efectividad ERA superior a 4.60 en sus últimas 3 salidas.',
    tacticalReason: 'Métricas Statcast indican wOBA proyectado de .355 contra lanzadores con alto porcentaje de batazos elevados (flyballs) y viento favorable.',
    injuriesContext: 'Bullpen de Red Sox utilizó a sus cerradores principales en los dos juegos previos de la serie.',
    timeToKickoff: 'Hoy, 18:05 UTC-5',
    apuestaTotalMarketCode: 'AT-MLB-OU-302',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: false
  },
  // 6. UFC / MMA
  {
    id: 'ev-ufc-1',
    sport: 'mma',
    matchId: 'match-makhachev-tsarukyan',
    matchTitle: 'Islam Makhachev vs Arman Tsarukyan',
    league: 'UFC Campeonato Peso Ligero',
    market: 'Total de Asaltos (Over/Under 2.5)',
    selection: 'Más de 2.5 Asaltos (Pasa del round 3)',
    plainMarket: 'Over 2.5 Asaltos',
    plainSelection: 'El combate dura más de 2.5 rounds (12m 30s)',
    odds: 1.78,
    fairOdds: 1.58,
    modelProb: 63.3,
    impliedProb: 56.2,
    edge: 12.6,
    stake: '+2.0u',
    confidence: 93,
    urgency: 'ALTA',
    rationale: 'Defensa de derribo de Tsarukyan es del 84%, lo que neutralizará la sumisión temprana de Islam. En su primer combate llegaron a la decisión de 3 rounds con ritmo controlado.',
    tacticalReason: 'Estilo de presión cautelosa en peleas titulares a 5 asaltos; ambos peleadores minimizan riesgos en los primeros 10 minutos.',
    injuriesContext: 'Ambos superaron el corte de peso sin incidentes y registran 5 asaltos de cardio comprobado.',
    timeToKickoff: 'Sábado, 22:30 UTC-5',
    apuestaTotalMarketCode: 'AT-UFC-RD-881',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: true
  },
  // 7. Fútbol - La Liga
  {
    id: 'ev-7-rma-bet',
    sport: 'football',
    matchId: 'match-rma-bet',
    matchTitle: 'Real Madrid vs Real Betis',
    league: 'La Liga EA Sports',
    market: '¿Ambos Equipos Anotan?',
    selection: 'Ambos Equipos Marcan (Sí)',
    plainMarket: 'Ambos Marcan (Sí)',
    plainSelection: 'Ambos Equipos Marcan (Sí)',
    odds: 1.95,
    fairOdds: 1.75,
    modelProb: 57.1,
    impliedProb: 51.3,
    edge: 11.3,
    stake: '+1.5u',
    confidence: 88,
    urgency: 'MEDIA',
    rationale: 'Real Madrid ha recibido gol en 7 de sus últimos 8 partidos con rotaciones defensivas. Betis promedia 1.4 goles de visitante y llega con su ataque completo.',
    tacticalReason: 'Real Madrid juega con bloque muy adelantado y ha recibido al menos un gol en 7 de sus últimos 8 partidos ligueros post-competencia internacional.',
    injuriesContext: 'Betis cuenta con todo su tridente titular disponible y el Madrid rota en la zaga central por sobrecarga.',
    timeToKickoff: 'Mañana, 14:30 UTC-5',
    apuestaTotalMarketCode: 'AT-LL-BTTS-109',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: false
  },
  // 8. Básquetbol NBA - Over Puntos
  {
    id: 'ev-nba-2',
    sport: 'basketball',
    matchId: 'match-lakers-warriors',
    matchTitle: 'LA Lakers vs Golden State Warriors',
    league: 'NBA Basketball',
    market: 'Total de Puntos Over/Under 228.5',
    selection: 'Más de 228.5 Puntos Totales',
    plainMarket: 'Over 228.5 Puntos',
    plainSelection: 'Más de 228.5 Puntos en el Partido',
    odds: 1.92,
    fairOdds: 1.72,
    modelProb: 58.1,
    impliedProb: 52.1,
    edge: 11.5,
    stake: '+1.5u',
    confidence: 89,
    urgency: 'ALTA',
    rationale: 'Pace proyectado de 103.2 posesiones por 48 minutos. Ambos equipos están en el top 5 de tiros de 3 puntos y juego en transición rápida.',
    tacticalReason: 'Warriors y Lakers promedian 234.8 puntos combinados en sus últimos 5 enfrentamientos directos en Los Ángeles.',
    injuriesContext: 'Planteles completos en rotación exterior (Curry, Thompson, LeBron, Davis sin restricciones).',
    timeToKickoff: 'Hoy, 22:00 UTC-5',
    apuestaTotalMarketCode: 'AT-NBA-OU-772',
    apuestaTotalDeepLink: 'https://www.apuestatotal.com/apuestas-deportivas/',
    apuestaTotalSpecialBoost: false
  }
];

export const MATCHES_DATA: Match[] = [
  // 1. Universitario vs Los Chankas (Fútbol Liga 1)
  {
    id: 'match-u-chankas',
    sport: 'football',
    leagueId: 'liga1-peru',
    league: 'Liga 1 Perú',
    leagueFlag: '🇵🇪',
    homeTeam: 'Universitario',
    awayTeam: 'Los Chankas CYC',
    homeLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
    date: '2026-08-23',
    time: '20:00',
    stadium: 'Estadio Monumental U Marathon',
    city: 'Lima, Perú',
    referee: 'Kevin Ortega',
    temperature: '19°C (Humedad 84%)',
    status: 'SCHEDULED',
    odds: {
      home: 1.30,
      draw: 5.20,
      away: 9.50,
      over25: 1.75,
      under25: 2.05,
      bttsYes: 2.10,
      bttsNo: 1.68,
      doubleChance1X: 1.05,
      doubleChanceX2: 3.40,
      doubleChance12: 1.15
    },
    probabilities: {
      home: 76.5,
      draw: 15.5,
      away: 8.0,
      over15: 84.2,
      over25: 61.8,
      under25: 38.2,
      bttsYes: 44.5,
      bttsNo: 55.5,
      cleanSheetHome: 56.0,
      cleanSheetAway: 11.2
    },
    form: {
      home: ['W', 'W', 'W', 'D', 'W'],
      away: ['L', 'D', 'L', 'W', 'L']
    },
    statsComparison: {
      homeXG: 2.45,
      awayXG: 0.72,
      homePossession: 62.4,
      awayPossession: 37.6,
      homeShotsOnTarget: 7.2,
      awayShotsOnTarget: 2.4
    },
    sportStats: {
      homeXG: 2.45,
      awayXG: 0.72,
      homePossession: 62.4,
      awayPossession: 37.6
    },
    absences: [
      { team: 'Los Chankas', player: 'E. Rostaing', position: 'Defensa Central', reason: 'Acumulación de amarillas', impactLevel: 'alto' },
      { team: 'Los Chankas', player: 'M. Palomino', position: 'Mediocampista', reason: 'Distensión muscular', impactLevel: 'medio' },
      { team: 'Universitario', player: 'R. Ureña', position: 'Pivote defensivo', reason: 'En duda por golpe', impactLevel: 'medio' }
    ],
    h2h: [
      { date: '2025-05-18', homeTeam: 'Los Chankas', awayTeam: 'Universitario', score: '0 - 1', homeXG: 0.85, awayXG: 1.62, winner: 'away', competition: 'Liga 1 Apertura' },
      { date: '2024-11-03', homeTeam: 'Los Chankas', awayTeam: 'Universitario', score: '0 - 0', homeXG: 0.91, awayXG: 1.15, winner: 'draw', competition: 'Liga 1 Clausura' },
      { date: '2024-05-25', homeTeam: 'Universitario', awayTeam: 'Los Chankas', score: '4 - 0', homeXG: 3.40, awayXG: 0.45, winner: 'home', competition: 'Liga 1 Apertura' }
    ],
    evSignal: EV_SIGNALS_LIST[0]
  },

  // 2. Boston Celtics vs Miami Heat (NBA Básquetbol)
  {
    id: 'match-celtics-heat',
    sport: 'basketball',
    leagueId: 'nba-basketball',
    league: 'NBA Basketball',
    leagueFlag: '🏀',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Miami Heat',
    homeLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=100&auto=format&fit=crop&q=80',
    date: '2026-08-23',
    time: '19:30',
    stadium: 'TD Garden',
    city: 'Boston, Massachusetts',
    referee: 'Scott Foster (Crew Chief)',
    temperature: 'Clima controlado (Indoor 21°C)',
    status: 'SCHEDULED',
    odds: {
      home: 1.38,
      away: 3.15,
      spreadHandicapHome: 1.90, // -6.5
      spreadHandicapAway: 1.90, // +6.5
      spreadPoints: -6.5,
      totalOverUnderPoints: 224.5,
      totalOverOdds: 1.90,
      totalUnderOdds: 1.90
    },
    probabilities: {
      home: 72.4,
      away: 27.6,
      spreadCoverProb: 58.8,
      totalOverProb: 54.2,
      totalUnderProb: 45.8
    },
    form: {
      home: ['W', 'W', 'W', 'W', 'L'],
      away: ['L', 'W', 'L', 'W', 'L']
    },
    statsComparison: {
      homeXG: 118.5,
      awayXG: 106.2,
      homePossession: 52.0,
      awayPossession: 48.0,
      homeShotsOnTarget: 48.2,
      awayShotsOnTarget: 42.1
    },
    sportStats: {
      homePointsPerGame: 120.8,
      awayPointsPerGame: 110.2,
      homePace: 99.4,
      awayPace: 96.8,
      homeOffensiveRating: 121.4,
      awayDefensiveRating: 113.8
    },
    absences: [
      { team: 'Miami Heat', player: 'Tyler Herro', position: 'Escolta', reason: 'Fatiga / Molestia en tobillo', impactLevel: 'alto' },
      { team: 'Miami Heat', player: 'Josh Richardson', position: 'Alero', reason: 'Baja confirmada', impactLevel: 'medio' }
    ],
    h2h: [
      { date: '2026-04-12', homeTeam: 'Miami Heat', awayTeam: 'Boston Celtics', score: '102 - 114', winner: 'away', competition: 'NBA' },
      { date: '2026-02-18', homeTeam: 'Boston Celtics', awayTeam: 'Miami Heat', score: '119 - 108', winner: 'home', competition: 'NBA' }
    ],
    evSignal: EV_SIGNALS_LIST[2]
  },

  // 3. Carlos Alcaraz vs Jannik Sinner (Tenis ATP)
  {
    id: 'match-alcaraz-sinner',
    sport: 'tennis',
    leagueId: 'tennis-atp-wta',
    league: 'ATP Masters 1000',
    leagueFlag: '🎾',
    homeTeam: 'Carlos Alcaraz',
    awayTeam: 'Jannik Sinner',
    homeLogo: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=100&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=100&auto=format&fit=crop&q=80',
    date: '2026-08-24',
    time: '16:00',
    stadium: 'Estadio Arthur Ashe (Pista Central)',
    city: 'Nueva York, Estados Unidos',
    referee: 'Fergus Murphy (Juez de Silla)',
    temperature: '24°C (Pista Rápida)',
    status: 'SCHEDULED',
    odds: {
      home: 1.85,
      away: 1.95,
      spreadHandicapHome: 1.90, // -1.5 Games
      spreadHandicapAway: 1.90,
      totalOverUnderPoints: 22.5,
      totalOverOdds: 1.95,
      totalUnderOdds: 1.82
    },
    probabilities: {
      home: 54.0,
      away: 46.0,
      totalOverProb: 58.1,
      totalUnderProb: 41.9
    },
    form: {
      home: ['W', 'W', 'W', 'W', 'W'],
      away: ['W', 'W', 'W', 'W', 'W']
    },
    statsComparison: {
      homeXG: 6.4,
      awayXG: 6.2,
      homePossession: 51.0,
      awayPossession: 49.0,
      homeShotsOnTarget: 34.0,
      awayShotsOnTarget: 32.0
    },
    sportStats: {
      firstServePercentageHome: 68.5,
      firstServePercentageAway: 66.0,
      acesPerMatchHome: 8.2,
      breakPointConversionHome: 44.0,
      surfaceType: 'Dura'
    },
    h2h: [
      { date: '2026-06-07', homeTeam: 'Carlos Alcaraz', awayTeam: 'Jannik Sinner', score: '3 - 2 (Sets)', winner: 'home', competition: 'Roland Garros Final' },
      { date: '2026-03-17', homeTeam: 'Jannik Sinner', awayTeam: 'Carlos Alcaraz', score: '2 - 1 (Sets)', winner: 'home', competition: 'Indian Wells' }
    ],
    evSignal: EV_SIGNALS_LIST[3]
  },

  // 4. NY Yankees vs Boston Red Sox (Béisbol MLB)
  {
    id: 'match-yankees-redsox',
    sport: 'baseball',
    leagueId: 'mlb-baseball',
    league: 'MLB Béisbol',
    leagueFlag: '⚾',
    homeTeam: 'NY Yankees',
    awayTeam: 'Boston Red Sox',
    homeLogo: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=100&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1516731415730-0c607149933a?w=100&auto=format&fit=crop&q=80',
    date: '2026-08-23',
    time: '18:05',
    stadium: 'Yankee Stadium',
    city: 'Bronx, New York',
    referee: 'Laz Diaz (Home Plate Umpire)',
    temperature: '26°C (Viento hacia jardín derecho 14 mph)',
    status: 'SCHEDULED',
    odds: {
      home: 1.72,
      away: 2.18,
      spreadHandicapHome: 2.15, // Run line -1.5
      spreadHandicapAway: 1.70, // +1.5
      totalOverUnderPoints: 8.5,
      totalOverOdds: 1.91,
      totalUnderOdds: 1.91
    },
    probabilities: {
      home: 58.2,
      away: 41.8,
      totalOverProb: 58.5,
      totalUnderProb: 41.5
    },
    form: {
      home: ['W', 'L', 'W', 'W', 'L'],
      away: ['L', 'W', 'L', 'L', 'W']
    },
    statsComparison: {
      homeXG: 5.6,
      awayXG: 4.8,
      homePossession: 50.0,
      awayPossession: 50.0,
      homeShotsOnTarget: 9.4,
      awayShotsOnTarget: 8.1
    },
    sportStats: {
      startingPitcherHome: 'Gerrit Cole (RHP)',
      startingPitcherAway: 'Brayan Bello (RHP)',
      eraPitcherHome: 3.45,
      eraPitcherAway: 4.68,
      whipHome: 1.12,
      whipAway: 1.38
    },
    h2h: [
      { date: '2026-07-28', homeTeam: 'Boston Red Sox', awayTeam: 'NY Yankees', score: '6 - 7', winner: 'away', competition: 'MLB' },
      { date: '2026-06-14', homeTeam: 'NY Yankees', awayTeam: 'Boston Red Sox', score: '8 - 4', winner: 'home', competition: 'MLB' }
    ],
    evSignal: EV_SIGNALS_LIST[4]
  },

  // 5. Islam Makhachev vs Arman Tsarukyan (UFC / MMA)
  {
    id: 'match-makhachev-tsarukyan',
    sport: 'mma',
    leagueId: 'ufc-mma',
    league: 'UFC Campeonato Peso Ligero',
    leagueFlag: '🥊',
    homeTeam: 'Islam Makhachev',
    awayTeam: 'Arman Tsarukyan',
    homeLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100&auto=format&fit=crop&q=80',
    date: '2026-08-29',
    time: '22:30',
    stadium: 'T-Mobile Arena',
    city: 'Las Vegas, Nevada',
    referee: 'Herb Dean',
    temperature: 'Indoor Arena Climatizada',
    status: 'SCHEDULED',
    odds: {
      home: 1.38,
      away: 3.20,
      totalOverUnderPoints: 2.5,
      totalOverOdds: 1.78,
      totalUnderOdds: 2.05,
      propMethodKO: 4.50,
      propMethodSub: 2.25,
      propMethodDec: 2.40
    },
    probabilities: {
      home: 72.0,
      away: 28.0,
      totalOverProb: 63.3,
      totalUnderProb: 36.7
    },
    form: {
      home: ['W', 'W', 'W', 'W', 'W'],
      away: ['W', 'W', 'W', 'W', 'W']
    },
    statsComparison: {
      homeXG: 4.8,
      awayXG: 3.2,
      homePossession: 60.0,
      awayPossession: 40.0,
      homeShotsOnTarget: 78.0,
      awayShotsOnTarget: 62.0
    },
    sportStats: {
      fighter1Record: '26-1-0 (11 Sub, 5 KO)',
      fighter2Record: '22-3-0 (9 KO, 5 Sub)',
      fighter1SigStrikesPerMin: 2.46,
      fighter2SigStrikesPerMin: 3.84,
      fighter1TakedownAvg: 3.17,
      fighter2TakedownAvg: 3.42
    },
    h2h: [
      { date: '2019-04-20', homeTeam: 'Islam Makhachev', awayTeam: 'Arman Tsarukyan', score: 'Decisión Unánime (30-27, 30-27, 29-28)', winner: 'home', competition: 'UFC Fight Night' }
    ],
    evSignal: EV_SIGNALS_LIST[5]
  },

  // 6. Elche vs Barcelona (Fútbol La Liga EA Sports)
  {
    id: 'match-elche-barca',
    sport: 'football',
    leagueId: 'la-liga',
    league: 'La Liga EA Sports',
    leagueFlag: '🇪🇸',
    homeTeam: 'Elche',
    awayTeam: 'Barcelona',
    homeLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80',
    date: '2026-08-23',
    time: '14:30',
    stadium: 'Estadio Martínez Valero',
    city: 'Elche, España',
    referee: 'Mateu Lahoz',
    temperature: '24°C (Despejado)',
    status: 'SCHEDULED',
    odds: {
      home: 6.50,
      draw: 4.80,
      away: 1.38,
      over25: 1.55,
      under25: 2.45,
      bttsYes: 1.82,
      bttsNo: 1.95
    },
    probabilities: {
      home: 11.5,
      draw: 15.5,
      away: 73.0,
      over15: 86.0,
      over25: 64.0,
      under25: 36.0,
      bttsYes: 48.0,
      bttsNo: 52.0
    },
    form: {
      home: ['L', 'D', 'L', 'W', 'L'],
      away: ['W', 'W', 'W', 'W', 'D']
    },
    statsComparison: {
      homeXG: 0.72,
      awayXG: 2.70,
      homePossession: 32.0,
      awayPossession: 68.0,
      homeShotsOnTarget: 2.4,
      awayShotsOnTarget: 7.8
    },
    sportStats: {
      homeXG: 0.72,
      awayXG: 2.70,
      homePossession: 32.0,
      awayPossession: 68.0
    },
    h2h: [
      { date: '2025-01-15', homeTeam: 'Barcelona', awayTeam: 'Elche', score: '3 - 0', homeXG: 3.10, awayXG: 0.40, winner: 'home', competition: 'La Liga' }
    ],
    evSignal: EV_SIGNALS_LIST[1]
  },

  // 7. LA Lakers vs Golden State Warriors (Básquetbol NBA)
  {
    id: 'match-lakers-warriors',
    sport: 'basketball',
    leagueId: 'nba-basketball',
    league: 'NBA Basketball',
    leagueFlag: '🏀',
    homeTeam: 'LA Lakers',
    awayTeam: 'Golden State Warriors',
    homeLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=100&auto=format&fit=crop&q=80',
    date: '2026-08-23',
    time: '22:00',
    stadium: 'Crypto.com Arena',
    city: 'Los Angeles, California',
    referee: 'Tony Brothers',
    temperature: 'Indoor 21°C',
    status: 'SCHEDULED',
    odds: {
      home: 1.75,
      away: 2.15,
      spreadHandicapHome: 1.90, // -2.5
      spreadHandicapAway: 1.90, // +2.5
      totalOverUnderPoints: 228.5,
      totalOverOdds: 1.92,
      totalUnderOdds: 1.88
    },
    probabilities: {
      home: 57.5,
      away: 42.5,
      totalOverProb: 58.1,
      totalUnderProb: 41.9
    },
    form: {
      home: ['W', 'L', 'W', 'W', 'W'],
      away: ['W', 'W', 'L', 'W', 'L']
    },
    statsComparison: {
      homeXG: 116.8,
      awayXG: 114.5,
      homePossession: 50.0,
      awayPossession: 50.0,
      homeShotsOnTarget: 47.0,
      awayShotsOnTarget: 46.5
    },
    sportStats: {
      homePointsPerGame: 117.4,
      awayPointsPerGame: 116.8,
      homePace: 102.8,
      awayPace: 101.4,
      homeOffensiveRating: 118.2,
      awayDefensiveRating: 115.0
    },
    h2h: [
      { date: '2026-03-16', homeTeam: 'LA Lakers', awayTeam: 'Golden State Warriors', score: '128 - 121', winner: 'home', competition: 'NBA' }
    ],
    evSignal: EV_SIGNALS_LIST[7]
  },

  // 8. Real Madrid vs Real Betis (Fútbol La Liga)
  {
    id: 'match-rma-bet',
    sport: 'football',
    leagueId: 'la-liga',
    league: 'La Liga EA Sports',
    leagueFlag: '🇪🇸',
    homeTeam: 'Real Madrid',
    awayTeam: 'Real Betis',
    homeLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
    awayLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80',
    date: '2026-08-24',
    time: '14:30',
    stadium: 'Estadio Santiago Bernabéu',
    city: 'Madrid, España',
    referee: 'Gil Manzano',
    temperature: '25°C',
    status: 'SCHEDULED',
    odds: {
      home: 1.35,
      draw: 5.50,
      away: 8.50,
      over25: 1.55,
      under25: 2.45,
      bttsYes: 1.95,
      bttsNo: 1.82
    },
    probabilities: {
      home: 74.0,
      draw: 16.0,
      away: 10.0,
      over15: 86.0,
      over25: 64.0,
      under25: 36.0,
      bttsYes: 57.1,
      bttsNo: 42.9
    },
    form: {
      home: ['W', 'W', 'D', 'W', 'W'],
      away: ['W', 'L', 'W', 'D', 'W']
    },
    statsComparison: {
      homeXG: 2.60,
      awayXG: 1.15,
      homePossession: 64.0,
      awayPossession: 36.0,
      homeShotsOnTarget: 7.8,
      awayShotsOnTarget: 3.4
    },
    h2h: [
      { date: '2025-05-25', homeTeam: 'Real Madrid', awayTeam: 'Real Betis', score: '2 - 1', homeXG: 2.10, awayXG: 1.20, winner: 'home', competition: 'La Liga' }
    ],
    evSignal: EV_SIGNALS_LIST[6]
  }
];

// Initial Tracked Picks Database for Audited Tracking & Performance
export const INITIAL_TRACKED_PICKS: TrackedPick[] = [
  {
    id: 'tp-101',
    sport: 'football',
    eventTitle: 'Fulham vs Chelsea',
    league: 'Premier League',
    market: 'Ganador & Goles (+1.5)',
    selection: 'Chelsea Ganador & Más de 1.5 Goles',
    odds: 1.85,
    modelProb: 76.5,
    impliedProb: 54.0,
    edge: 15.2,
    stakeUnits: 2.0,
    stakeSoles: 100.0,
    timestamp: '2026-08-24T15:00:00Z',
    status: 'WON',
    finalScore: '2 - 3 (FINAL)',
    netUnits: 1.70,
    netProfitSoles: 85.0,
    settledAt: '2026-08-24T17:05:00Z',
    telegramNotified: true,
    settlementNotes: 'Chelsea se impuso 3-2 en Craven Cottage. Over 1.5 y victoria cobrados.',
    clvPercent: 5.4
  },
  {
    id: 'tp-100',
    sport: 'football',
    eventTitle: 'Levante vs Osasuna',
    league: 'La Liga EA Sports',
    market: 'Doble Oportunidad (1X)',
    selection: 'Osasuna 1X (Gana o Empata) & Menos 3.5 Goles',
    odds: 1.75,
    modelProb: 74.0,
    impliedProb: 57.1,
    edge: 12.4,
    stakeUnits: 2.0,
    stakeSoles: 100.0,
    timestamp: '2026-08-24T15:30:00Z',
    status: 'WON',
    finalScore: '0 - 0 (FINAL)',
    netUnits: 1.50,
    netProfitSoles: 75.0,
    settledAt: '2026-08-24T17:35:00Z',
    telegramNotified: true,
    settlementNotes: 'Defensa sólida de Osasuna en El Sadar con 0-0 final. 1X y Under 3.5 acertados.',
    clvPercent: 4.8
  },
  {
    id: 'tp-099',
    sport: 'football',
    eventTitle: 'Central Córdoba vs Tigre',
    league: 'Liga Profesional Argentina',
    market: 'Doble Oportunidad (1X2)',
    selection: 'Tigre Ganador o Empate (1X)',
    odds: 1.65,
    modelProb: 72.0,
    impliedProb: 60.6,
    edge: 11.4,
    stakeUnits: 2.0,
    stakeSoles: 100.0,
    timestamp: '2026-08-24T19:00:00Z',
    status: 'WON',
    finalScore: '0 - 2 (FINAL)',
    netUnits: 1.30,
    netProfitSoles: 65.0,
    settledAt: '2026-08-24T21:05:00Z',
    telegramNotified: true,
    settlementNotes: 'Tigre ganó de visita con solidez táctica.',
    clvPercent: 4.2
  },
  {
    id: 'tp-098',
    sport: 'baseball',
    eventTitle: 'Boston Red Sox vs Miami Marlins',
    league: 'MLB Grandes Ligas',
    market: 'Línea de Dinero (Moneyline)',
    selection: 'Boston Red Sox Ganador Directo',
    odds: 1.70,
    modelProb: 71.5,
    impliedProb: 58.8,
    edge: 12.7,
    stakeUnits: 2.0,
    stakeSoles: 100.0,
    timestamp: '2026-08-24T20:10:00Z',
    status: 'PENDING',
    finalScore: 'Por Jugar',
    netUnits: 0,
    netProfitSoles: 0,
    settledAt: undefined,
    telegramNotified: true,
    settlementNotes: 'Abridor con ERA 2.90 y bateo dominante frente a zurdos.',
    clvPercent: 3.5
  },
  {
    id: 'tp-097',
    sport: 'basketball',
    eventTitle: 'Minnesota Lynx vs Golden State Valkyries',
    league: 'WNBA / Básquetbol',
    market: 'Hándicap de Puntos (-6.5)',
    selection: 'Minnesota Lynx -6.5 Puntos',
    odds: 1.90,
    modelProb: 68.0,
    impliedProb: 52.6,
    edge: 15.4,
    stakeUnits: 1.5,
    stakeSoles: 75.0,
    timestamp: '2026-08-24T21:00:00Z',
    status: 'PENDING',
    finalScore: 'Por Jugar',
    netUnits: 0,
    netProfitSoles: 0,
    settledAt: undefined,
    telegramNotified: true,
    settlementNotes: 'Lynx líder en eficiencia neta y rebotes defensivos.',
    clvPercent: 4.1
  }
];

export const INITIAL_AUDIT_PERFORMANCE: AuditPerformance = {
  totalPicks: 11,
  pendingPicks: 5,
  wonPicks: 5,
  lostPicks: 1,
  pushPicks: 0,
  winRate: 83.3, // on settled
  totalUnitsStaked: 19.0,
  netUnitsProfit: 5.86,
  yieldRoi: 29.3,
  netProfitSoles: 293.0,
  historyChartData: [
    { pickNumber: 1, date: '18 Ago', event: 'UFC O\'Malley vs Merab', sport: 'mma', result: 'WON', unitsWon: 1.28, cumulativeUnits: 1.28, yieldProgress: 17.1, winRateProgress: 100 },
    { pickNumber: 2, date: '19 Ago', event: 'MLB Dodgers vs Padres', sport: 'baseball', result: 'WON', unitsWon: 1.42, cumulativeUnits: 2.70, yieldProgress: 20.8, winRateProgress: 100 },
    { pickNumber: 3, date: '20 Ago', event: 'ATP Djokovic vs Zverev', sport: 'tennis', result: 'LOST', unitsWon: -2.0, cumulativeUnits: 0.70, yieldProgress: 6.4, winRateProgress: 66.7 },
    { pickNumber: 4, date: '21 Ago', event: 'Premier Man City vs BOU', sport: 'football', result: 'WON', unitsWon: 1.56, cumulativeUnits: 2.26, yieldProgress: 16.1, winRateProgress: 75.0 },
    { pickNumber: 5, date: '22 Ago', event: 'NBA Nuggets vs Mavs', sport: 'basketball', result: 'WON', unitsWon: 1.38, cumulativeUnits: 3.64, yieldProgress: 20.2, winRateProgress: 80.0 },
    { pickNumber: 6, date: '22 Ago', event: 'Liga 1 Alianza vs Cienciano', sport: 'football', result: 'WON', unitsWon: 2.20, cumulativeUnits: 5.84, yieldProgress: 29.2, winRateProgress: 83.3 },
  ]
};

// Initial AI Auto-Learning & Feedback Loop State
export const INITIAL_AUTO_LEARNING_STATE: AIAutoLearningState = {
  isActive: true,
  totalAnalysesProcessed: 148,
  accuracyOptimizedPercent: 5.4,
  lastCalibrationDate: 'Hoy, 06:00 AM',
  activeWeights: {
    homeAdvantageFactor: 1.14,
    recentFormXGWeight: 0.38,
    keyInjuriesImpactWeight: 0.32,
    marketInefficiencyEdge: 0.25,
    weatherFatigueAdjustment: 0.18
  },
  recentErrorDiagnostics: [
    {
      id: 'err-1',
      date: '20 Ago 2026',
      eventTitle: 'Novak Djokovic vs Alexander Zverev',
      sport: 'tennis',
      failedMarket: 'Ganador de Partido',
      pickSelection: 'Gana Novak Djokovic (@1.68)',
      rootCause: 'alta_varianza',
      rootCauseLabel: 'Rendimiento de Saque Anómalo (22 Aces)',
      aiExplanation: 'Zverev conectó un 82% de primeros saques (media histórica 64%), neutralizando el diferencial en intercambios largos de fondo.',
      recalibrationAction: 'Incremento del peso asignado a la efectividad de saque en pista rápida dura (+0.08) y reducción de peso de H2H histórico.',
      weightAdjusted: 'Peso Saque Potente: 0.24 ➔ 0.32'
    },
    {
      id: 'err-2',
      date: '17 Ago 2026',
      eventTitle: 'Milwaukee Bucks vs Indiana Pacers',
      sport: 'basketball',
      failedMarket: 'Total Puntos Over 232.5',
      pickSelection: 'Más de 232.5 Puntos (@1.90)',
      rootCause: 'tiempo_extra_fatiga',
      rootCauseLabel: 'Pace Colapsado en 4to Cuarto por Faltas',
      aiExplanation: 'Exceso de faltas tácticas y bajo acierto de 3 puntos (24%) en el tramo final redujo el pace proyectado de 104 a 94.',
      recalibrationAction: 'Ajuste del factor de regresión para partidos con alta carga de faltas en back-to-back.',
      weightAdjusted: 'Filtro de Varianza de Pace: 0.12 ➔ 0.18'
    },
    {
      id: 'err-3',
      date: '15 Ago 2026',
      eventTitle: 'Houston Astros vs Seattle Mariners',
      sport: 'baseball',
      failedMarket: 'Moneyline Astros',
      pickSelection: 'Gana Houston Astros (@1.75)',
      rootCause: 'colapso_bullpen',
      rootCauseLabel: 'Colapso de Relevistas en 8va Entrada',
      aiExplanation: 'El abridor completó 7 innings permitiendo solo 1 carrera, pero el bullpen de 2do orden concedió 4 carreras consecutivas por sobreuso en días previos.',
      recalibrationAction: 'Inclusión obligatoria del indicador de fatiga del bullpen en las últimas 72 horas para proyecciones de Moneyline MLB.',
      weightAdjusted: 'Peso Fatiga Bullpen: 0.15 ➔ 0.28'
    }
  ],
  calibrationLogs: [
    {
      id: 'cal-1',
      timestamp: 'Hoy, 06:00:12 AM',
      trigger: 'Jornada Nocturna MLB & NBA',
      optimizationDelta: '+0.6% Precisión Proyectada',
      notes: 'Calibración automática de coeficientes de posesión y fatiga de lanzadores abridores.'
    },
    {
      id: 'cal-2',
      timestamp: 'Ayer, 23:30:00 PM',
      trigger: 'Cierre Post-Partido Liga 1 Perú',
      optimizationDelta: '+0.8% Precisión en Hándicap',
      notes: 'Ajuste fino de la ventaja de localía en altura (Cusco/Huancayo) vs llano (Lima).'
    },
    {
      id: 'cal-3',
      timestamp: '21 Ago, 18:00:00 PM',
      trigger: 'Auditoría Premier League',
      optimizationDelta: '+0.5% Calibración Over 2.5',
      notes: 'Matriz cuantitativa multivariable ajustada con datos xG actualizados de fechas 1 a 3.'
    }
  ]
};
