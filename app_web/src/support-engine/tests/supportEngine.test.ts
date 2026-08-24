/**
 * FIJAS IA SUPPORT ENGINE — UNIT TESTS SUITE
 */
import { VIP_PLANS_CATALOG, getPlanById, getAllActivePlans } from '../catalog/plansCatalog';
import { classifyUserIntent } from '../intents/intentClassifier';
import { evaluatePaymentFraud, calculateImageHash } from '../payments/fraudDetector';
import { getOrCreateCustomer, updateCustomer } from '../crm/customerMemory';

export function runSupportEngineTests() {
  console.log('=== INICIANDO PRUEBAS DE FIJAS IA SUPPORT ENGINE ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Catalog Tests
  const activePlans = getAllActivePlans();
  assert(activePlans.length === 3, 'El catálogo contiene exactamente 3 planes activos');
  assert(getPlanById('mensual')?.pricePEN === 39.90, 'Plan Mensual tiene precio oficial S/ 39.90');
  assert(getPlanById('semanal')?.pricePEN === 19.90, 'Plan Semanal tiene precio oficial S/ 19.90');

  // 2. Intent Classifier Tests
  const intent1 = classifyUserIntent('Hola buenas tardes');
  assert(intent1.intent === 'GREETING', 'Detecta saludo GREETING con alta confianza');

  const intent2 = classifyUserIntent('Cuánto cuesta el VIP mensual?');
  assert(intent2.intent === 'PRICE', 'Detecta consulta de precio PRICE');

  const intent3 = classifyUserIntent('Tienen Yape o Plin para pagar?');
  assert(intent3.intent === 'PAYMENT_METHOD', 'Detecta métodos de pago PAYMENT_METHOD');

  const intent4 = classifyUserIntent('Garantizan las ganancias al 100%?');
  assert(intent4.intent === 'OBJECTION_GUARANTEE', 'Detecta objeción de garantía OBJECTION_GUARANTEE');

  const intent5 = classifyUserIntent('', true);
  assert(intent5.intent === 'RECEIPT_SENT', 'Detecta adjunto de imagen como RECEIPT_SENT');

  // 3. Fraud Detection Tests
  const hash1 = calculateImageHash(Buffer.from('test_voucher_data_1'));
  const fraud1 = evaluatePaymentFraud(hash1, 'OP123456', 39.90, 39.90, false);
  assert(fraud1.fraudScore === 0 && fraud1.riskLevel === 'LOW', 'Comprobante nuevo limpio tiene score 0 (LOW RISK)');

  // 4. Customer Memory Tests
  const customer = getOrCreateCustomer('5261686165', 'Bray Yusman', '@brayyusman');
  assert(customer.chatId === '5261686165', 'Crea ficha de cliente correctamente');
  
  updateCustomer('5261686165', { leadStatus: 'VIP_ACTIVE' });
  const updated = getOrCreateCustomer('5261686165', 'Bray Yusman');
  assert(updated.leadStatus === 'VIP_ACTIVE', 'Actualiza estado del cliente a VIP_ACTIVE');

  console.log(`=== RESULTADO DE PRUEBAS: ${passed} APROBADAS, ${failed} FALLIDAS ===`);
  return { passed, failed };
}
