/**
 * Sistema de validación simple e independiente para confirmar renders reales
 * NO usa hooks ni efectos, solo console.count directo
 */

// Mapa global para contar renders por componente
if (globalThis.window !== undefined) {
  globalThis.__SIMPLE_RENDER_COUNTER__ = globalThis.__SIMPLE_RENDER_COUNTER__ ?? {};
  globalThis.__SIMPLE_RENDER_START__ = globalThis.__SIMPLE_RENDER_START__ || Date.now();
}

export const validateRender = (componentName) => {
  if (globalThis.window === undefined) return;

  // Incrementar contador de forma segura
  const counter = globalThis.__SIMPLE_RENDER_COUNTER__;
  const currentCount = Object.getOwnPropertyDescriptor(counter, componentName)?.value ?? 0;
  Object.defineProperty(counter, componentName, {
    value: currentCount + 1,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  // Tracking silencioso - sin logs para evitar spam en consola
  const newCount = Object.getOwnPropertyDescriptor(counter, componentName)?.value ?? 0;
  if (globalThis.window !== undefined && globalThis.window.location) {
    Object.getOwnPropertyDescriptor(globalThis.window.location, 'href');
  }
  if (newCount % 100 === 0) {
    // Validación silenciosa completada
  }
};

// Función para obtener reporte
export const getValidationReport = () => {
  if (globalThis.window === undefined) return {};

  const elapsed = (Date.now() - globalThis.__SIMPLE_RENDER_START__) / 1000;
  const report = {};

  for (const component of Object.keys(globalThis.__SIMPLE_RENDER_COUNTER__)) {
    const count =
      Object.getOwnPropertyDescriptor(globalThis.__SIMPLE_RENDER_COUNTER__, component)?.value ?? 0;
    Object.defineProperty(report, component, {
      value: {
        total: count,
        rate: `${(count / elapsed).toFixed(2)}/s`,
      },
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  // Reporte generado - usar return para acceder a datos
  return report;
};

// Exponer globalmente para debugging
if (globalThis.window !== undefined) {
  globalThis.getValidationReport = getValidationReport;
}
