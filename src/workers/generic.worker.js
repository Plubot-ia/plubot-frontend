/**
 * @file generic.worker.js
 * @description Web Worker genérico para ejecutar tareas en segundo plano sin bloquear la UI.
 * Acepta un nombre de tarea y sus argumentos, y devuelve el resultado.
 */

// Un registro de tareas que el worker puede ejecutar usando Map para acceso seguro.
// Esto es por seguridad, para evitar la ejecución de código arbitrario y prototype pollution.
const tasks = new Map([
  // Ejemplo de una tarea que consume CPU
  [
    'SIMULATE_HEAVY_CALCULATION',
    (duration = 1000) => {
      const start = performance.now();
      while (performance.now() - start < duration) {
        // Bloqueo simulado para emular un cálculo pesado
      }
      return { result: `Heavy calculation completed in ${duration}ms` };
    },
  ],

  // Aquí se pueden añadir más tareas en el futuro...
  // Por ejemplo: ['VALIDATE_FLOW', (data) => {...}], ['ANALYZE_NODE_DATA', (nodes) => {...}], etc.
]);

globalThis.addEventListener('message', (event) => {
  const { task, args } = event.data;

  // Se comprueba que la tarea exista en el Map para acceso completamente seguro
  // Map.has() elimina completamente los riesgos de prototype pollution
  if (tasks.has(task)) {
    try {
      // Acceso seguro usando Map.get() - sin riesgos de security warnings
      const taskFunction = tasks.get(task);
      const result = taskFunction(...args);
      self.postMessage({ status: 'success', task, result });
    } catch (error) {
      self.postMessage({
        status: 'error',
        task,
        error: { message: error.message, stack: error.stack },
      });
    }
  } else {
    self.postMessage({
      status: 'error',
      task,
      error: { message: `Task "${task}" not found in worker.` },
    });
  }
});
