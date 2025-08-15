import { spawn } from 'child_process';

// --- CONFIGURACIÓN ---
const RULE_TO_FIND = process.argv[2];
const TARGET_PATH = process.argv[3] || '.';

// --- VALIDACIÓN ---
if (!RULE_TO_FIND) {
  console.error('❌ Error: Debes proporcionar un nombre de regla.');
  console.log('Uso: node lint-by-rule.js <rule-name> [path]');
  process.exit(1);
}

console.log(`🔍 Ejecutando ESLint para la regla: '${RULE_TO_FIND}' en '${TARGET_PATH}'...`);

// --- EJECUCIÓN DE ESLINT ---
// Usamos el formateador JSON, que es fácil de parsear de forma fiable.
const eslintProcess = spawn('npx', ['eslint', TARGET_PATH, '--format', 'json', '--no-cache'], {
  // stdio: 'pipe' es el valor por defecto, pero lo hacemos explícito para mayor claridad.
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
let errorOutput = '';

eslintProcess.stdout.on('data', (data) => {
  output += data.toString();
});

eslintProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

eslintProcess.on('close', (code) => {
  // ESLint devuelve un código de salida distinto de cero si hay errores.
  // Lo ignoramos aquí porque vamos a procesar la salida JSON de todos modos.

  if (errorOutput) {
    console.error('🚨 Ocurrió un error al ejecutar ESLint:');
    console.error(errorOutput);
    // No salimos, intentamos parsear la salida de todos modos, puede que contenga resultados parciales.
  }

  try {
    const results = JSON.parse(output);
    let errorCount = 0;

    console.log('--- Resultados Encontrados ---');

    results.forEach((fileResult) => {
      const relevantMessages = fileResult.messages.filter(
        (message) => message.ruleId === RULE_TO_FIND,
      );

      if (relevantMessages.length > 0) {
        console.log(`
📄 Archivo: ${fileResult.filePath}`);
        relevantMessages.forEach((msg) => {
          errorCount++;
          console.log(`  - [Línea ${msg.line}:${msg.column}] ${msg.message} (${msg.ruleId})`);
        });
      }
    });

    if (errorCount === 0) {
      console.log(`🎉 ¡Excelente! No se encontraron errores para la regla '${RULE_TO_FIND}'.`);
    } else {
      console.log(`
----------------------------------`);
      console.log(`Total de errores encontrados: ${errorCount}`);
    }
  } catch (parseError) {
    console.error('❌ Error: No se pudo parsear la salida JSON de ESLint.');
    console.error(
      'Esto puede ocurrir si ESLint no se ejecuta correctamente o no encuentra archivos para analizar.',
    );
    console.log('Salida recibida de ESLint:', output);
  }
});
