import useAuthStore from '../stores/useAuthStore';

import { syncAllPlubots } from './syncService';

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
      plubots: user.plubots.map(plubot => {
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
    const jsonData = JSON.stringify(exportData, null, 2);

    // Crear blob y URL
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Crear elemento de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = `plubots_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();

    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    return { success: true, message: 'Plubots exportados correctamente' };
  } catch (error) {
    return { success: false, error: error.message || 'Error desconocido' };
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
    const plubot = user.plubots.find(p => p.id === plubotId);
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
    const jsonData = JSON.stringify(exportData, null, 2);

    // Crear blob y URL
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Crear elemento de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = `plubot_${plubot.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();

    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    return { success: true, message: `Plubot "${plubot.name}" exportado correctamente` };
  } catch (error) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
};

/**
 * Importa plubots desde un archivo JSON
 * @param {File} file - Archivo JSON con plubots
 * @returns {Promise<Object>} - Resultado de la importaciu00f3n
 */
export const importPlubots = async (file) => {
  try {
    // Verificar que sea un archivo JSON
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      return { success: false, message: 'El archivo debe ser de tipo JSON' };
    }

    // Leer el archivo
    const fileContent = await readFileAsText(file);
    const importData = JSON.parse(fileContent);

    // Validar estructura
    if (!importData.version || !importData.timestamp) {
      return { success: false, message: 'Formato de archivo invu00e1lido' };
    }

    // Determinar si es un solo plubot o varios
    const plubots = importData.plubots || (importData.plubot ? [importData.plubot] : []);

    if (plubots.length === 0) {
      return { success: false, message: 'No se encontraron plubots en el archivo' };
    }

    // Obtener estado actual
    const { user, updateUser } = useAuthStore.getState();
    if (!user) {
      return { success: false, message: 'Debes iniciar sesiu00f3n para importar plubots' };
    }

    // Preparar plubots para importaciu00f3n
    const currentPlubots = user.plubots || [];
    const importedPlubots = [];
    const updatedPlubots = [];
    const skippedPlubots = [];

    // Procesar cada plubot
    for (const importPlubot of plubots) {
      // Verificar si ya existe
      const existingIndex = currentPlubots.findIndex(p => p.id === importPlubot.id);

      if (existingIndex >= 0) {
        // Si existe, preguntar si desea sobrescribir o mantener ambos
        const action = await confirmOverwrite(importPlubot.name);

        if (action === 'skip') {
          skippedPlubots.push(importPlubot);
          continue;
        } else if (action === 'overwrite') {
          // Sobrescribir
          currentPlubots[existingIndex] = {
            ...importPlubot,
            _imported: true,
            _importedAt: new Date().toISOString(),
          };
          updatedPlubots.push(importPlubot);
        } else if (action === 'keep-both') {
          // Mantener ambos (crear copia)
          const newPlubot = {
            ...importPlubot,
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${importPlubot.name} (Importado)`,
            _imported: true,
            _importedAt: new Date().toISOString(),
          };
          currentPlubots.push(newPlubot);
          importedPlubots.push(newPlubot);
        }
      } else {
        // Si no existe, au00f1adir
        const newPlubot = {
          ...importPlubot,
          _imported: true,
          _importedAt: new Date().toISOString(),
        };
        currentPlubots.push(newPlubot);
        importedPlubots.push(newPlubot);
      }
    }

    // Actualizar el estado del usuario
    updateUser({
      ...user,
      plubots: currentPlubots,
    });

    // Actualizar respaldo local
    try {
      localStorage.setItem('user_plubots_backup', JSON.stringify(currentPlubots));
    } catch (storageError) {
      console.error('Error al guardar respaldo en localStorage:', storageError);
      // No se pudo guardar el respaldo, pero no es un error crítico
    }

    // Sincronizar con el servidor
    setTimeout(() => {
      syncAllPlubots();
    }, 1000);

    return {
      success: true,
      message: `Importaciu00f3n completada: ${importedPlubots.length} nuevos, ${updatedPlubots.length} actualizados, ${skippedPlubots.length} omitidos`,
      imported: importedPlubots,
      updated: updatedPlubots,
      skipped: skippedPlubots,
    };
  } catch (error) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
};

/**
 * Lee un archivo como texto
 * @param {File} file - Archivo a leer
 * @returns {Promise<string>} - Contenido del archivo
 */
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => {
      console.error('Error en FileReader:', e);
      reject(new Error('Error al leer el archivo'));
    };
    reader.readAsText(file);
  });
};

/**
 * Muestra un diu00e1logo para confirmar sobrescritura
 * @param {string} plubotName - Nombre del plubot
 * @returns {Promise<string>} - Acciu00f3n seleccionada ('overwrite', 'keep-both', 'skip')
 */
const confirmOverwrite = (plubotName) => {
  return new Promise((resolve) => {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'plubot-import-modal';
    modal.innerHTML = `
      <div class="plubot-import-modal-content">
        <h3>Plubot existente</h3>
        <p>Ya existe un Plubot con el nombre "${plubotName}". u00bfQuu00e9 deseas hacer?</p>
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
    buttons.forEach(btn => {
      btn.style.padding = '8px 16px';
      btn.style.margin = '0 8px';
      btn.style.border = 'none';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
    });

    const overwriteBtn = modal.querySelector('.btn-overwrite');
    overwriteBtn.style.backgroundColor = '#EA4335';
    overwriteBtn.style.color = 'white';

    const keepBothBtn = modal.querySelector('.btn-keep-both');
    keepBothBtn.style.backgroundColor = '#4285F4';
    keepBothBtn.style.color = 'white';

    const skipBtn = modal.querySelector('.btn-skip');
    skipBtn.style.backgroundColor = '#9AA0A6';
    skipBtn.style.color = 'white';

    // Au00f1adir al DOM
    document.body.appendChild(modal);

    // Manejar clics
    overwriteBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve('overwrite');
    });

    keepBothBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve('keep-both');
    });

    skipBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve('skip');
    });
  });
};

export default {
  exportAllPlubots,
  exportPlubot,
  importPlubots,
};
