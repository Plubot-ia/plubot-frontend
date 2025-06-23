/**
 * @file generic.worker.js
 * @description Web Worker genérico para ejecutar tareas en segundo plano sin bloquear la UI.
 * Acepta un nombre de tarea y sus argumentos, y devuelve el resultado.
 */

// Un registro de tareas que el worker puede ejecutar.
// Esto es por seguridad, para evitar la ejecución de código arbitrario.
const tasks = {
  // Ejemplo de una tarea que consume CPU
  SIMULATE_HEAVY_CALCULATION: (duration = 1000) => {
    const start = performance.now();
    while (performance.now() - start < duration) {
      // Bloqueo simulado para emular un cálculo pesado
    }
    return { result: `Heavy calculation completed in ${duration}ms` };
  },

  // Aquí se pueden añadir más tareas en el futuro...
  // Por ejemplo: VALIDATE_FLOW, ANALYZE_NODE_DATA, etc.
};

self.onmessage = (e) => {
  const { task, args } = e.data;

  if (tasks[task]) {
    try {
      const result = tasks[task](...args);
      self.postMessage({ status: 'success', task, result });
    } catch (error) {
      self.postMessage({ 
        status: 'error', 
        task, 
        error: { message: error.message, stack: error.stack }
      });
    }
  } else {
    self.postMessage({ 
      status: 'error', 
      task, 
      error: { message: `Task "${task}" not found in worker.` }
    });
  }
};
