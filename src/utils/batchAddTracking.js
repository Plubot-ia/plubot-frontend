#!/usr/bin/env node
/**
 * batchAddTracking.js - Script para agregar tracking a múltiples nodos automáticamente
 * Este script procesa múltiples nodos y agrega el hook useRenderTracker donde sea necesario
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de nodos a procesar
const NODES_TO_PROCESS = [
  {
    name: 'DecisionNode',
    dir: 'decisionnode',
    files: ['DecisionNode.tsx', 'DecisionNode.jsx'],
    category: 'FLOW_NODES',
  },
  {
    name: 'ConditionNode',
    dir: 'conditionnode',
    files: ['ConditionNode.tsx', 'ConditionNode.jsx'],
    category: 'FLOW_NODES',
  },
  {
    name: 'InputNode',
    dir: 'inputnode',
    files: ['InputNode.tsx', 'InputNode.jsx'],
    category: 'FLOW_NODES',
  },
  {
    name: 'AiNode',
    dir: 'ainode',
    files: ['AiNode.tsx', 'AiNode.jsx'],
    category: 'AI_NODES',
  },
  {
    name: 'AiNodePro',
    dir: 'ainodepro',
    files: ['AiNodePro.tsx', 'AiNodePro.jsx'],
    category: 'AI_NODES',
  },
  {
    name: 'PowerNode',
    dir: 'powernode',
    files: ['PowerNode.tsx', 'PowerNode.jsx'],
    category: 'AI_NODES',
  },
  {
    name: 'ActionNode',
    dir: 'actionnode',
    files: ['ActionNode.tsx', 'ActionNode.jsx'],
    category: 'MEDIA_NODES',
  },
  {
    name: 'HttpRequestNode',
    dir: 'httprequestnode',
    files: ['HttpRequestNode.tsx', 'HttpRequestNode.jsx'],
    category: 'INTEGRATION_NODES',
  },
  {
    name: 'WebhookNode',
    dir: 'webhooknode',
    files: ['WebhookNode.tsx', 'WebhookNode.jsx'],
    category: 'INTEGRATION_NODES',
  },
  {
    name: 'DatabaseNode',
    dir: 'databasenode',
    files: ['DatabaseNode.tsx', 'DatabaseNode.jsx'],
    category: 'INTEGRATION_NODES',
  },
  {
    name: 'DiscordNode',
    dir: 'discordnode',
    files: ['DiscordNode.tsx', 'DiscordNode.jsx'],
    category: 'INTEGRATION_NODES',
  },
  {
    name: 'EmotionDetectionNode',
    dir: 'emotiondetectionnode',
    files: ['EmotionDetectionNode.tsx', 'EmotionDetectionNode.jsx'],
    category: 'AI_NODES',
  },
];

// Base path para los nodos
const BASE_PATH = path.join(__dirname, '../../components/onboarding/nodes');

// Función para verificar si un archivo ya tiene tracking
function hasTracking(filePath) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('useRenderTracker');
  } catch {
    return false;
  }
}

// Función para encontrar el archivo principal del nodo
function findNodeFile(nodeDirectory, possibleFiles) {
  for (const file of possibleFiles) {
    const filePath = path.join(BASE_PATH, nodeDirectory, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
}

// Función para agregar el import de useRenderTracker
function addTrackingImport(content) {
  // Buscar si ya existe el import
  if (content.includes('import { useRenderTracker }')) {
    return content;
  }

  // Buscar donde agregar el import (después de otros imports de @/utils)
  const renderTrackerImportRegex = /import.*from\s+['"]@\/utils\/renderTracker['"]/;
  const match = content.match(renderTrackerImportRegex);

  if (match) {
    // Agregar después del import de renderTracker
    const insertPos = content.indexOf(match[0]) + match[0].length;
    return `${content.slice(
      0,
      insertPos,
    )}\nimport { useRenderTracker } from '@/utils/renderTracker';${content.slice(insertPos)}`;
  }

  // Si no encuentra renderTracker, buscar cualquier import de @/utils
  const utilitiesImportRegex = /import.*from\s+['"]@\/utils\//;
  const utilitiesMatch = content.match(utilitiesImportRegex);

  if (utilitiesMatch) {
    const insertPos = content.indexOf(utilitiesMatch[0]) + utilitiesMatch[0].length;
    return `${content.slice(
      0,
      insertPos,
    )}\nimport { useRenderTracker } from '@/utils/renderTracker';${content.slice(insertPos)}`;
  }

  // Si no encuentra imports de utils, agregar después del último import
  const lastImportRegex = /import[^;]+;/g;
  const imports = content.match(lastImportRegex);
  if (imports && imports.length > 0) {
    const lastImport = imports.at(-1);
    const insertPos = content.lastIndexOf(lastImport) + lastImport.length;
    return `${content.slice(
      0,
      insertPos,
    )}\nimport { useRenderTracker } from '@/utils/renderTracker';${content.slice(insertPos)}`;
  }

  return content;
}

// Función para agregar el hook useRenderTracker
function addTrackingHook(content, nodeName) {
  // Buscar el componente principal
  // Escapar caracteres especiales para uso seguro en RegExp
  const escapedNodeName = nodeName.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const regexPattern = String.raw`const\s+${escapedNodeName}(?:Component)?[\s:=]`;
  // eslint-disable-next-line security/detect-non-literal-regexp
  const componentRegex = new RegExp(regexPattern, 'i');
  const componentMatch = content.match(componentRegex);

  if (!componentMatch) {
    return content;
  }

  // Buscar donde agregar el hook (después de la declaración del componente)
  const componentStart = content.indexOf(componentMatch[0]);
  const afterComponent = content.indexOf('{', componentStart) + 1;

  // Verificar si ya tiene tracking manual
  const manualTrackingRegex = /renderTracker\.track\([^)]+\)/;
  const hasManualTracking = content
    .slice(afterComponent, afterComponent + 500)
    .match(manualTrackingRegex);

  if (hasManualTracking) {
    // Reemplazar tracking manual con hook
    const trackingStart = content.indexOf(hasManualTracking[0], afterComponent);
    const trackingEnd = trackingStart + hasManualTracking[0].length;

    // Buscar si está dentro de un useEffect
    const beforeTracking = content.slice(Math.max(0, trackingStart - 100), trackingStart);
    const afterTracking = content.slice(trackingEnd, Math.min(content.length, trackingEnd + 50));

    if (beforeTracking.includes('useEffect') && afterTracking.includes(');')) {
      // Está dentro de un useEffect, actualizar el useEffect completo
      const effectStart = content.lastIndexOf('useEffect', trackingStart);
      const effectEnd = content.indexOf('});', trackingEnd) + 3;

      return `${content.slice(
        0,
        effectStart,
      )}useRenderTracker('${nodeName}', [id, data]);${content.slice(effectEnd)}`;
    } else {
      // Solo reemplazar la línea de tracking
      return `${content.slice(
        0,
        trackingStart,
      )}useRenderTracker('${nodeName}', [id, data])${content.slice(trackingEnd)}`;
    }
  } else {
    // Agregar nuevo hook después de la apertura del componente
    const indent = '  '; // Asumiendo indentación de 2 espacios

    return `${content.slice(0, afterComponent)}\n${indent}// 🔄 RENDER TRACKING\n${indent}useRenderTracker('${nodeName}', [id, data]);\n${content.slice(afterComponent)}`;
  }
}

// Función principal para procesar un nodo
function processNode(nodeConfig) {
  const filePath = findNodeFile(nodeConfig.dir, nodeConfig.files);

  if (!filePath) {
    return false;
  }

  if (hasTracking(filePath)) {
    return true;
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    let content = fs.readFileSync(filePath, 'utf8');

    // Agregar import
    content = addTrackingImport(content);

    // Agregar hook
    content = addTrackingHook(content, nodeConfig.name);

    // Guardar el archivo
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(filePath, content, 'utf8');

    return true;
  } catch {
    return false;
  }
}

// Función principal - renombrada para evitar warning de variable no usada
async function _main() {
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (const node of NODES_TO_PROCESS) {
    const result = processNode(node);
    if (result === true) {
      successful++;
    } else if (result === false) {
      failed++;
    } else {
      skipped++;
    }
  }

  return { successful, failed, skipped, total: NODES_TO_PROCESS.length };
}

// Exportar para uso como módulo
export {
  processNode,
  NODES_TO_PROCESS,
  hasTracking,
  findNodeFile,
  addTrackingImport,
  addTrackingHook,
};

// Script de desarrollo - ejecución directa comentada para frontend
// if (import.meta.url === `file://${process.argv[1]}`) {
//   _main();
// }
