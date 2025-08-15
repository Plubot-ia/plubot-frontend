#!/usr/bin/env node

/**
 * Script para agregar hooks faltantes a componentes que tienen el import
 * pero no el hook useRenderTracker
 */

import fs from 'node:fs';
import path from 'node:path';

// Componentes que necesitan el hook agregado
const COMPONENTS_TO_FIX = [
  {
    name: 'FlowMain',
    path: '/src/components/onboarding/flow-editor/components/FlowMain.jsx',
    componentPattern: /const\s+FlowMainComponent\s*=\s*\([^)]*\)\s*=>\s*{/,
    hookToAdd: "  // 🔄 RENDER TRACKING\n  useRenderTracker('FlowMain');\n",
  },
  {
    name: 'CustomMiniMap',
    path: '/src/components/onboarding/flow-editor/ui/CustomMiniMap.jsx',
    componentPattern: /const\s+CustomMiniMap\s*=\s*\([^)]*\)\s*=>\s*{/,
    hookToAdd: "  // 🔄 RENDER TRACKING\n  useRenderTracker('CustomMiniMap');\n",
  },
  {
    name: 'EpicHeader',
    path: '/src/components/onboarding/common/EpicHeader.jsx',
    componentPattern: /const\s+EpicHeader\s*=\s*\([^)]*\)\s*=>\s*{/,
    hookToAdd: "  // 🔄 RENDER TRACKING\n  useRenderTracker('EpicHeader');\n",
  },
];

// Función para agregar hook al componente
function addRenderTrackerHook(content, component) {
  const match = component.componentPattern.exec(content);

  if (!match) {
    return content;
  }

  // Verificar si ya existe el hook
  if (content.includes(`useRenderTracker('${component.name}'`)) {
    return content;
  }

  // Insertar el hook después de la apertura del componente
  const insertPosition = match.index + match[0].length;
  const before = content.slice(0, Math.max(0, insertPosition));
  const after = content.slice(Math.max(0, insertPosition));

  return `${before}\n${component.hookToAdd}${after}`;
}

// Función para agregar import si no existe
function addImportIfNotExists(content) {
  if (content.includes("import { useRenderTracker } from '@/utils/renderTracker';")) {
    return content;
  }

  // Buscar donde agregar el import
  const lines = content.split('\n');
  let insertIndex = -1;

  for (const [index, line] of lines.entries()) {
    if (line.startsWith('import ')) {
      insertIndex = index + 1;
    }
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, "import { useRenderTracker } from '@/utils/renderTracker';");
    return lines.join('\n');
  }

  return content;
}

// Función principal para procesar un componente
async function processComponent(component) {
  // Script de desarrollo - process.cwd() no disponible en frontend
  const fullPath = path.join('.', component.path);

  try {
    // Verificar si el archivo existe
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(fullPath)) {
      return false;
    }

    // Leer contenido actual
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Agregar import si no existe
    content = addImportIfNotExists(content);

    // 2. Agregar hook de tracking
    content = addRenderTrackerHook(content, component);

    // 3. Escribir archivo actualizado
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
    const success = await processComponent(component);
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

export { COMPONENTS_TO_FIX, processComponent };
