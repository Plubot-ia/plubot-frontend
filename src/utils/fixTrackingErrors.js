#!/usr/bin/env node

/**
 * Script para corregir errores en los hooks de tracking
 * causados por dependencias inexistentes
 */

import fs from 'node:fs';
import path from 'node:path';

// Componentes que necesitan corrección de dependencias
const COMPONENTS_TO_FIX = [
  {
    name: 'ByteAssistant',
    path: '/src/components/onboarding/common/ByteAssistant.jsx',
    correctDependencies: [], // Sin dependencias por ahora
  },
  {
    name: 'EpicHeader',
    path: '/src/components/onboarding/common/EpicHeader.jsx',
    correctDependencies: [], // Sin dependencias por ahora
  },
  {
    name: 'FlowMain',
    path: '/src/components/onboarding/flow-editor/components/FlowMain.jsx',
    correctDependencies: [], // Sin dependencias por ahora
  },
  {
    name: 'ActionNode',
    path: '/src/components/onboarding/nodes/actionnode/ActionNode.jsx',
    correctDependencies: [], // Sin dependencias por ahora
  },
  {
    name: 'EliteEdge',
    path: '/src/components/onboarding/flow-editor/ui/EliteEdge.jsx',
    correctDependencies: [], // Sin dependencias por ahora
  },
  {
    name: 'CustomMiniMap',
    path: '/src/components/onboarding/flow-editor/ui/CustomMiniMap.jsx',
    correctDependencies: [], // Sin dependencias por ahora
  },
];

// Función para corregir dependencias del hook
function fixRenderTrackerHook(content, componentName, correctDependencies = []) {
  // Buscar el hook problemático
  // Escapar caracteres especiales para uso seguro en RegExp
  const escapedComponentName = componentName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const regexPattern = String.raw`useRenderTracker\('${escapedComponentName}'[^)]*\);`;
  // eslint-disable-next-line security/detect-non-literal-regexp
  const hookRegex = new RegExp(regexPattern, 'g');

  const correctHook =
    correctDependencies.length > 0
      ? `useRenderTracker('${componentName}', [${correctDependencies.join(', ')}]);`
      : `useRenderTracker('${componentName}');`;

  const updatedContent = content.replace(hookRegex, correctHook);

  if (updatedContent !== content) {
    return updatedContent;
  }

  return content;
}

// Función principal para corregir un componente
async function fixComponent(component) {
  // Script de desarrollo - process.cwd() no disponible en frontend
  const fullPath = path.join('.', component.path);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(fullPath)) {
      return false;
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    let content = fs.readFileSync(fullPath, 'utf8');

    // Corregir hook de tracking
    content = fixRenderTrackerHook(content, component.name, component.correctDependencies);

    // Escribir archivo actualizado
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(fullPath, content, 'utf8');

    return true;
  } catch {
    return false;
  }
}

// Función principal - renombrada para evitar warning de variable no usada
async function _main() {
  let successful = 0;
  let failed = 0;

  for (const component of COMPONENTS_TO_FIX) {
    // eslint-disable-next-line no-await-in-loop -- Procesamiento secuencial intencional para evitar sobrecarga del sistema de archivos
    const success = await fixComponent(component);
    if (success) {
      successful++;
    } else {
      failed++;
    }
  }

  return { successful, failed, total: COMPONENTS_TO_FIX.length };
}

// Script de desarrollo - ejecución directa comentada para frontend
// if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
//   await _main();
// }

export { COMPONENTS_TO_FIX, fixComponent };
