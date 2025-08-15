#!/usr/bin/env node

/**
 * Script para migrar todos los componentes del sistema de tracking anterior
 * al nuevo sistema avanzado (enhancedRenderTracker)
 */

import fs from 'node:fs';
import path from 'node:path';

// Componentes identificados que necesitan migración
const COMPONENTS_TO_MIGRATE = [
  {
    name: 'ByteAssistant',
    path: '/src/components/onboarding/common/ByteAssistant.jsx',
    category: 'UI_COMPONENTS',
    dependencies: ['simulationMode'],
  },
  {
    name: 'NodePalette',
    path: '/src/components/onboarding/common/NodePalette.jsx',
    category: 'UI_COMPONENTS',
    dependencies: ['isOpen', 'searchTerm'],
  },
  {
    name: 'EpicHeader',
    path: '/src/components/onboarding/common/EpicHeader.jsx',
    category: 'UI_COMPONENTS',
    dependencies: ['title', 'isVisible'],
  },
  {
    name: 'FlowMain',
    path: '/src/components/onboarding/flow-editor/components/FlowMain.jsx',
    category: 'FLOW_COMPONENTS',
    dependencies: ['nodes', 'edges', 'viewport'],
  },
  {
    name: 'ActionNode',
    path: '/src/components/onboarding/nodes/actionnode/ActionNode.jsx',
    category: 'FLOW_NODES',
    dependencies: ['id', 'selected', 'data'],
  },
  {
    name: 'EliteEdge',
    path: '/src/components/onboarding/flow-editor/ui/EliteEdge.jsx',
    category: 'CONNECTIONS',
    dependencies: ['id', 'source', 'target', 'selected'],
  },
  {
    name: 'CustomMiniMap',
    path: '/src/components/onboarding/flow-editor/ui/CustomMiniMap.jsx',
    category: 'UI_COMPONENTS',
    dependencies: ['nodes', 'viewport'],
  },
  {
    name: 'BackgroundScene',
    path: '/src/components/onboarding/flow-editor/ui/BackgroundScene.jsx',
    category: 'UI_COMPONENTS',
    dependencies: ['theme', 'animated'],
  },
];

// Función para agregar import si no existe
function addImportIfNotExists(content, importStatement) {
  if (content.includes(importStatement)) {
    return content;
  }

  // Buscar la línea donde agregar el import (después de otros imports de renderTracker)
  const lines = content.split('\n');
  let insertIndex = -1;

  for (const [index, line] of lines.entries()) {
    if (line.includes("import renderTracker from '@/utils/renderTracker'")) {
      insertIndex = index + 1;
      break;
    }
    if (line.includes('import') && line.includes('renderTracker')) {
      insertIndex = index + 1;
      break;
    }
  }

  if (insertIndex === -1) {
    // Si no encontramos renderTracker, buscar el último import
    for (const [index, line] of lines.entries()) {
      if (line.startsWith('import ')) {
        insertIndex = index + 1;
      }
    }
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }

  return content;
}

// Función para agregar hook al componente
function addRenderTrackerHook(content, componentName, dependencies = []) {
  // Buscar el inicio del componente funcional
  // Escapar caracteres especiales para uso seguro en RegExp
  const escapedComponentName = componentName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const regexPattern = String.raw`const\s+${escapedComponentName}\s*=\s*\([^)]*\)\s*=>\s*{`;
  // eslint-disable-next-line security/detect-non-literal-regexp
  const componentRegex = new RegExp(regexPattern, 'g');
  const match = componentRegex.exec(content);

  if (!match) {
    return content;
  }

  const hookStatement =
    dependencies.length > 0
      ? `  // 🔄 RENDER TRACKING\n  useRenderTracker('${componentName}', [${dependencies.join(', ')}]);\n`
      : `  // 🔄 RENDER TRACKING\n  useRenderTracker('${componentName}');\n`;

  // Insertar el hook después de la apertura del componente
  const insertPosition = match.index + match[0].length;
  const before = content.slice(0, Math.max(0, insertPosition));
  const after = content.slice(Math.max(0, insertPosition));

  // Verificar si ya existe el hook
  if (content.includes(`useRenderTracker('${componentName}'`)) {
    return content;
  }

  return `${before}\n${hookStatement}${after}`;
}

// Función para remover tracking manual
function removeManualTracking(content, componentName) {
  // Remover líneas que contengan renderTracker.track para este componente
  const lines = content.split('\n');
  const filteredLines = lines.filter((line) => {
    const isManualTracking =
      line.includes('renderTracker.track') && line.includes(`'${componentName}'`);
    return !isManualTracking;
  });

  return filteredLines.join('\n');
}

// Función principal para migrar un componente
async function migrateComponent(component) {
  // Script de desarrollo - process.cwd() no disponible en frontend
  const fullPath = path.join('.', component.path);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(fullPath)) {
      return false;
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Agregar import de useRenderTracker
    content = addImportIfNotExists(
      content,
      "import { useRenderTracker } from '@/utils/renderTracker';",
    );

    // 2. Agregar hook de tracking
    content = addRenderTrackerHook(content, component.name, component.dependencies);

    // 3. Remover tracking manual
    content = removeManualTracking(content, component.name);

    // 4. Escribir archivo actualizado
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

  for (const component of COMPONENTS_TO_MIGRATE) {
    // eslint-disable-next-line no-await-in-loop -- Procesamiento secuencial intencional para evitar sobrecarga del sistema de archivos
    const success = await migrateComponent(component);
    if (success) {
      successful++;
    } else {
      failed++;
    }
  }

  return { successful, failed, total: COMPONENTS_TO_MIGRATE.length };
}

// Script de desarrollo - ejecución directa comentada para frontend
// if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
//   await _main();
// }

export { COMPONENTS_TO_MIGRATE, migrateComponent };
