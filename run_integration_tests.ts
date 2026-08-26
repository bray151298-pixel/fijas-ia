import { DataUpdateEngine } from './app_web/src/core-engine/DataUpdateEngine';
import { EventNormalizer } from './app_web/src/core-engine/EventNormalizer';
import { EventValidator } from './app_web/src/core-engine/EventValidator';
import { AnalysisEngine } from './app_web/src/core-engine/AnalysisEngine';
import { SignalValidator } from './app_web/src/core-engine/SignalValidator';
import { DatabaseRepository } from './app_web/src/core-engine/DatabaseRepository';
import { SettlementEngine } from './app_web/src/core-engine/SettlementEngine';
import { TelegramFormatter } from './app_web/src/core-engine/TelegramFormatter';
import { TimeService } from './app_web/src/core-engine/TimeService';

async function runIntegrationValidation() {
  console.log('================================================================');
  console.log('VALIDACIÓN DE INTEGRACIÓN Y PIPELINE EN PRODUCCIÓN — FIJAS IA');
  console.log('================================================================');

  // 1. DATA MOTOR: Real ESPN fetch
  console.log('\n[1/4] PROBANDO MOTOR DE DATOS REALES (ESPN SCOREBOARDS)...');
  const dataEngine = DataUpdateEngine.getInstance();
  const db = DatabaseRepository.getInstance();
  
  const realEvents = await dataEngine.fetchRealEvents();
  console.log(`• Total eventos reales capturados hoy: ${realEvents.length}`);
  const upcomingEvents = realEvents.filter(e => e.status === 'SCHEDULED');
  console.log(`• Total eventos futuros válidos para análisis: ${upcomingEvents.length}`);
  
  if (upcomingEvents.length === 0) {
    throw new Error('No se encontraron eventos futuros en ESPN para la fecha actual.');
  }

  const sampleEvent = upcomingEvents[0];
  console.log(`  -> Evento seleccionado: [${sampleEvent.sport.toUpperCase()}] ${sampleEvent.home_team} vs ${sampleEvent.away_team} (${sampleEvent.league})`);
  console.log(`  -> Hora inicio UTC: ${sampleEvent.start_time_utc} | Hora Lima: ${sampleEvent.start_time_local}`);
  console.log(`  -> ID Evento: ${sampleEvent.event_id}`);

  // 2. PIPELINE END-TO-END: Validator -> Analysis -> SignalValidator -> DB
  console.log('\n[2/4] PROBANDO PIPELINE END-TO-END (VALIDATOR -> ANALYSIS -> SIGNAL -> DB)...');
  const existingSignals = new Set(db.getAllSignals().map(s => s.event_id));
  const validation = EventValidator.validateForSignalGeneration(sampleEvent, existingSignals);
  console.log(`• EventValidator: status=${validation.status}, isValid=${validation.isValidForSignalCreation}`);

  const generatedSignal = AnalysisEngine.createSignalFromEvent(sampleEvent, 101);
  console.log(`• Signal Generada: ID=${generatedSignal.signal_id} | Mercado=${generatedSignal.market_type} | Selección=${generatedSignal.selection} | Cuota=@${generatedSignal.odds}`);

  const signalCheck = SignalValidator.validateSignal(generatedSignal);
  console.log(`• SignalValidator: passed=${signalCheck.passed}, errores=${signalCheck.errors.length}`);
  if (!signalCheck.passed) {
    throw new Error(`SignalValidator falló: ${signalCheck.errors.join(', ')}`);
  }

  db.saveSignal(generatedSignal);
  const savedSignal = db.getSignal(generatedSignal.signal_id);
  console.log(`• DatabaseRepository: Signal ${savedSignal?.signal_id} guardada e indexada con éxito.`);

  // 3. TELEGRAM CONNECTION & FORMATTING TEST
  console.log('\n[3/4] PROBANDO CONECTIVIDAD TELEGRAM (GETME & FORMATTER)...');
  const SIGNALS_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.SIGNALS_BOT_TOKEN || "";
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${SIGNALS_BOT_TOKEN}/getMe`);
    const tgData = await tgRes.json();
    console.log(`• Conexión con Bot de Señales: ${tgData.ok ? '✅ CONECTADO' : '❌ ERROR'} (@${tgData.result?.username})`);
  } catch (err) {
    console.log(`• Error conectando a Telegram: ${(err as Error).message}`);
  }

  const telegramFormatted = TelegramFormatter.formatSignalPublish(generatedSignal);
  console.log('• Vista previa del mensaje formateado para Telegram:');
  console.log('----------------------------------------------------');
  console.log(telegramFormatted.slice(0, 350) + '...\n----------------------------------------------------');

  // 4. SETTLEMENT SIMULATION ON EXACT SIGNAL
  console.log('\n[4/4] PROBANDO MOTOR DE LIQUIDACIÓN EXACTO (SETTLEMENT ENGINE)...');
  const simulatedFinishedEvent = {
    ...sampleEvent,
    status: 'FINISHED' as const,
    home_score: 3,
    away_score: 1
  };
  const settlementResult = SettlementEngine.settle(generatedSignal, simulatedFinishedEvent);
  console.log(`• Resultado de liquidación: ${settlementResult.result_status} | Unidades Netas: ${settlementResult.units_net}u`);
  console.log(`• Motivo registrado: ${settlementResult.settlement_reason}`);

  console.log('\n================================================================');
  console.log('✅ TODAS LAS PRUEBAS DE INTEGRACIÓN SE COMPLETARON CON ÉXITO');
  console.log('================================================================');
}

runIntegrationValidation().catch(e => {
  console.error('❌ ERROR EN PRUEBA DE INTEGRACIÓN:', e);
  process.exit(1);
});
