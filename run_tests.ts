import { TestSuite } from './app_web/src/core-engine/TestSuite';

async function main() {
  const results = await TestSuite.runAllTests();
  console.log('====================================================');
  console.log('SUITE DE PRUEBAS AUTOMATIZADAS FIJAS IA (CASOS 1-20)');
  console.log('====================================================');
  let allPassed = true;
  for (const r of results) {
    const badge = r.passed ? 'PASS' : 'FAIL';
    if (!r.passed) allPassed = false;
    console.log(`[${badge}] [${r.caseId}] ${r.title}`);
    console.log(`   Esperado: ${r.expected}`);
    console.log(`   Obtenido: ${r.actual}`);
  }
  console.log('====================================================');
  const passed = results.filter(r => r.passed).length;
  console.log(`RESULTADO FINAL: ${allPassed ? 'TODAS LAS PRUEBAS PASARON EXITOSAMENTE' : 'FALLARON ALGUNAS PRUEBAS'} (${passed}/${results.length})`);
  console.log('====================================================');
  if (!allPassed) {
    process.exit(1);
  }
}

main();
