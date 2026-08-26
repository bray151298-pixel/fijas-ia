import { TestSuite } from './app_web/src/core-engine/TestSuite';

const results = TestSuite.runAllTests();
console.log('====================================================');
console.log('SUITE DE PRUEBAS AUTOMATIZADAS — FIJAS IA (CASOS 1-8)');
console.log('====================================================');
let allPassed = true;
for (const r of results) {
  const badge = r.passed ? '✅ PASS' : '❌ FAIL';
  if (!r.passed) allPassed = false;
  console.log(badge + ' [' + r.caseId + '] ' + r.title);
  console.log('   • Esperado: ' + r.expected);
  console.log('   • Obtenido: ' + r.actual);
}
console.log('====================================================');
console.log('RESULTADO FINAL:', allPassed ? 'TODAS LAS PRUEBAS PASARON EXITOSAMENTE (8/8)' : 'FALLARON ALGUNAS PRUEBAS');
console.log('====================================================');

if (!allPassed) {
  process.exit(1);
}
