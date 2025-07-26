import { useMemo } from 'react';

/**
 * @typedef {object} Permissions
 * @property {boolean} canEdit - Indica si el usuario puede editar.
 * @property {boolean} canDelete - Indica si el usuario puede eliminar.
 * @property {boolean} isAdmin - Indica si el usuario es administrador.
 * @property {boolean} canExecute - Indica si el usuario puede ejecutar acciones.
 */

/**
 * Hook para gestionar los permisos del usuario.
 * Actualmente, los permisos son estáticos.
 * @returns {Permissions} Un objeto con los permisos del usuario.
 */
export const usePermissions = () => {
  const permissions = useMemo(() => {
    const canEdit = true;
    const canDelete = true;
    const isAdmin = true;
    const canExecute = isAdmin || canEdit; // Lógica para canExecute

    return { canEdit, canDelete, isAdmin, canExecute };
  }, []); // Dependencias vacías porque los valores son estáticos

  return permissions;
};
