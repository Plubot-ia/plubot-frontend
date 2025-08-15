import { v4 as uuidv4 } from 'uuid';

import useAuthStore from '../stores/use-auth-store';

import logger from './loggerService';
import { syncAllPlubots } from './syncService';

/**
 * Lee un archivo como texto
 * @param {File} file - Archivo a leer
 * @returns {Promise<string>} - Contenido del archivo
 */
const readFileAsText = (file) => {
  // Usar el método moderno file.text() que devuelve una promesa
  return file.text().catch((error) => {
    logger.error('Error al leer el archivo:', error);
    // Relanzar el error para que la promesa sea rechazada y el error pueda ser capturado
    throw new Error('Error al leer el archivo');
  });
};

/**
 * Muestra un diálogo para confirmar sobrescritura
 * @param {string} plubotName - Nombre del plubot
 * @returns {Promise<string>} - Acción seleccionada ('overwrite', 'keep-both', 'skip')
 */
const confirmOverwrite = (plubotName) => {
  return new Promise((resolve) => {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'plubot-import-modal';
    modal.innerHTML = `
      <div class="plubot-import-modal-content">
        <h3>Plubot existente</h3>
        <p>Ya existe un Plubot con el nombre "${plubotName}". ¿Qué deseas hacer?</p>
        <div class="plubot-import-modal-actions">
          <button class="btn-overwrite">Sobrescribir</button>
          <button class="btn-keep-both">Mantener ambos</button>
          <button class="btn-skip">Omitir</button>
        </div>
      </div>
    `;

    // Estilos inline para el modal
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';

    const content = modal.querySelector('.plubot-import-modal-content');
    content.style.backgroundColor = 'white';
    content.style.padding = '20px';
    content.style.borderRadius = '8px';
    content.style.maxWidth = '400px';
    content.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';

    const buttons = modal.querySelectorAll('button');
    for (const button of buttons) {
      button.style.padding = '8px 16px';
      button.style.margin = '0 8px';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
    }

    const overwriteButton = modal.querySelector('.btn-overwrite');
    overwriteButton.style.backgroundColor = '#EA4335';
    overwriteButton.style.color = 'white';

    const keepBothButton = modal.querySelector('.btn-keep-both');
    keepBothButton.style.backgroundColor = '#4285F4';
    keepBothButton.style.color = 'white';

    const skipButton = modal.querySelector('.btn-skip');
    skipButton.style.backgroundColor = '#9AA0A6';
    skipButton.style.color = 'white';

    // Añadir al DOM
    document.body.append(modal);

    // Manejar clics
    overwriteButton.addEventListener('click', () => {
      modal.remove();
      resolve('overwrite');
    });

    keepBothButton.addEventListener('click', () => {
      modal.remove();
      resolve('keep-both');
    });

    skipButton.addEventListener('click', () => {
      modal.remove();
      resolve('skip');
    });
  });
};

/**
 * Servicio para exportar e importar plubots como respaldo adicional
 * Permite a los usuarios descargar sus plubots como archivos JSON y restaurarlos
 */

/**
 * Exporta todos los plubots del usuario a un archivo JSON
 * @returns {Promise<Object>} - Resultado de la exportaciu00f3n
 */
export const exportAllPlubots = async () => {
  try {
    // Obtener plubots del usuario
    const { user } = useAuthStore.getState();
    if (!user || !user.plubots || user.plubots.length === 0) {
      return { success: false, message: 'No hay plubots para exportar' };
    }

    // Preparar datos para exportaciu00f3n
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      plubots: user.plubots.map((plubot) => {
        // Crear una copia limpia del plubot sin propiedades temporales
        const cleanPlubot = { ...plubot };

        // Eliminar propiedades que no deben exportarse
        delete cleanPlubot._offlineCreated;
        delete cleanPlubot._recoveryPending;
        delete cleanPlubot._synced;
        delete cleanPlubot._syncedAt;
        delete cleanPlubot._timestamp;
        delete cleanPlubot._localId;

        return cleanPlubot;
      }),
    };

    // Convertir a JSON
    const jsonData = JSON.stringify(exportData, undefined, 2);

    // Crear blob y URL
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Crear elemento de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = `plubots_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();

    // Limpiar
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 100);

    return { success: true, message: 'Plubots exportados correctamente' };
  } catch (error) {
    return { success: false, error: error.message ?? 'Error desconocido' };
  }
};

/**
 * Exporta un plubot especu00edfico a un archivo JSON
 * @param {string} plubotId - ID del plubot a exportar
 * @returns {Promise<Object>} - Resultado de la exportaciu00f3n
 */
export const exportPlubot = async (plubotId) => {
  try {
    // Obtener plubots del usuario
    const { user } = useAuthStore.getState();
    if (!user || !user.plubots) {
      return { success: false, message: 'No hay plubots disponibles' };
    }

    // Encontrar el plubot
    const plubot = user.plubots.find((p) => p.id === plubotId);
    if (!plubot) {
      return { success: false, message: 'Plubot no encontrado' };
    }

    // Preparar datos para exportaciu00f3n
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      plubot: { ...plubot },
    };

    // Eliminar propiedades temporales
    delete exportData.plubot._offlineCreated;
    delete exportData.plubot._recoveryPending;
    delete exportData.plubot._synced;
    delete exportData.plubot._syncedAt;
    delete exportData.plubot._timestamp;
    delete exportData.plubot._localId;

    // Convertir a JSON
    const jsonData = JSON.stringify(exportData, undefined, 2);

    // Crear blob y URL
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Crear elemento de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = `plubot_${plubot.name.replaceAll(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();

    // Limpiar
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 100);

    return {
      success: true,
      message: `Plubot "${plubot.name}" exportado correctamente`,
    };
  } catch (error) {
    return { success: false, error: error.message ?? 'Error desconocido' };
  }
};

// Helper: Validar archivo de importación
async function _validateImportFile(file) {
  // Verificar que sea un archivo JSON
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    return { success: false, message: 'El archivo debe ser de tipo JSON' };
  }

  // Leer el archivo
  const fileContent = await readFileAsText(file);
  const importData = JSON.parse(fileContent);

  // Validar estructura
  if (!importData.version || !importData.timestamp) {
    return { success: false, message: 'Formato de archivo inválido' };
  }

  // Determinar si es un solo plubot o varios
  const plubots = importData.plubots || (importData.plubot ? [importData.plubot] : []);

  if (plubots.length === 0) {
    return {
      success: false,
      message: 'No se encontraron plubots en el archivo',
    };
  }

  return { success: true, plubots };
}

// Helper: Validar autenticación de usuario
function _validateUserAuth() {
  const { user, updateUser } = useAuthStore.getState();
  if (!user) {
    return {
      success: false,
      message: 'Debes iniciar sesión para importar plubots',
    };
  }
  return { success: true, user, updateUser };
}

// Helper: Crear nuevo plubot importado
function _createImportedPlubot(importPlubot, isNew = false) {
  const basePlubot = {
    ...importPlubot,
    _imported: true,
    _importedAt: new Date().toISOString(),
  };

  if (isNew) {
    return {
      ...basePlubot,
      id: `imported-${uuidv4()}`,
      name: `${importPlubot.name} (Importado)`,
    };
  }

  return basePlubot;
}

// Helper: Actualizar plubot existente de forma segura
function _safeUpdatePlubot(updateContext) {
  const { currentPlubots, targetIndex, existingPlubot, updatedPlubot } = updateContext;

  // Verificar que el elemento aún existe en la misma posición
  if (currentPlubots.at(targetIndex) === existingPlubot) {
    if (targetIndex >= 0 && targetIndex < currentPlubots.length) {
      currentPlubots.splice(targetIndex, 1, updatedPlubot);
    }
  } else {
    // Si cambió, buscar nuevamente y actualizar
    const newIndex = currentPlubots.findIndex((p) => p.id === updatedPlubot.id);
    if (newIndex !== -1 && newIndex < currentPlubots.length) {
      currentPlubots.splice(newIndex, 1, updatedPlubot);
    }
  }
}

// Helper: Manejar importación de plubot existente
async function _handleExistingPlubot(context) {
  const { importPlubot, currentPlubots, results, targetIndex, existingPlubot } = context;
  const { importedPlubots, updatedPlubots, skippedPlubots } = results;
  const action = await confirmOverwrite(importPlubot.name);

  switch (action) {
    case 'skip': {
      skippedPlubots.push(importPlubot);
      break;
    }
    case 'overwrite': {
      const updatedPlubot = _createImportedPlubot(importPlubot);
      _safeUpdatePlubot({
        currentPlubots,
        targetIndex,
        existingPlubot,
        updatedPlubot,
      });
      updatedPlubots.push(importPlubot);
      break;
    }
    case 'keep-both': {
      const newPlubot = _createImportedPlubot(importPlubot, true);
      currentPlubots.push(newPlubot);
      importedPlubots.push(newPlubot);
      break;
    }
    // No default
  }
}

// Helper: Procesar importación de un plubot individual
async function _processPlubotImport(importPlubot, currentPlubots, results) {
  const { importedPlubots } = results;

  // Verificar si ya existe
  const existingIndex = currentPlubots.findIndex((p) => p.id === importPlubot.id);

  if (existingIndex === -1) {
    // Si no existe, añadir
    const newPlubot = _createImportedPlubot(importPlubot);
    currentPlubots.push(newPlubot);
    importedPlubots.push(newPlubot);
  } else {
    // Acceso seguro a array con validación explícita
    const existingPlubot = currentPlubots.at(existingIndex);
    if (!existingPlubot) {
      return; // Salir si no encuentra el elemento
    }

    await _handleExistingPlubot({
      importPlubot,
      currentPlubots,
      results,
      targetIndex: existingIndex,
      existingPlubot,
    });
  }
}

// Helper: Actualizar estado del usuario
function _updateUserPlubots(user, updateUser, currentPlubots) {
  updateUser({
    ...user,
    plubots: currentPlubots,
  });
}

// Helper: Manejar respaldo y sincronización
function _handleImportBackup(currentPlubots) {
  // Actualizar respaldo local
  try {
    localStorage.setItem('user_plubots_backup', JSON.stringify(currentPlubots));
  } catch (storageError) {
    logger.error('Error al guardar respaldo en localStorage:', storageError);
    // No se pudo guardar el respaldo, pero no es un error crítico
  }

  // Sincronizar con el servidor
  setTimeout(() => {
    syncAllPlubots();
  }, 1000);
}

/**
 * Importa plubots desde un archivo JSON
 * @param {File} file - Archivo JSON con plubots
 * @returns {Promise<Object>} - Resultado de la importación
 */
export const importPlubots = async (file) => {
  try {
    // Validar archivo de importación
    const fileValidation = await _validateImportFile(file);
    if (!fileValidation.success) {
      return fileValidation;
    }
    const { plubots } = fileValidation;

    // Validar autenticación de usuario
    const userValidation = _validateUserAuth();
    if (!userValidation.success) {
      return userValidation;
    }
    const { user, updateUser } = userValidation;

    // Preparar plubots para importación
    const currentPlubots = user.plubots ?? [];
    const results = {
      importedPlubots: [],
      updatedPlubots: [],
      skippedPlubots: [],
    };

    // Procesar cada plubot
    for (const importPlubot of plubots) {
      // eslint-disable-next-line no-await-in-loop
      await _processPlubotImport(importPlubot, currentPlubots, results);
    }

    // Actualizar el estado del usuario
    _updateUserPlubots(user, updateUser, currentPlubots);

    // Manejar respaldo y sincronización
    _handleImportBackup(currentPlubots);

    const message =
      `Importación completada: ${results.importedPlubots.length} nuevos, ` +
      `${results.updatedPlubots.length} actualizados, ${results.skippedPlubots.length} omitidos`;

    return {
      success: true,
      message,
      imported: results.importedPlubots,
      updated: results.updatedPlubots,
      skipped: results.skippedPlubots,
    };
  } catch (error) {
    return { success: false, error: error.message ?? 'Error desconocido' };
  }
};

const exportImportService = {
  exportAllPlubots,
  exportPlubot,
  importPlubots,
};

export default exportImportService;
