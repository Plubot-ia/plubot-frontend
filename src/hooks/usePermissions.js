import { useMemo } from 'react';

export const usePermissions = () => {
  const permissions = useMemo(() => {
    const canEdit = true;
    const canDelete = true;
    const isAdmin = true;

    console.log('Checking permissions', { canEdit, canDelete, isAdmin });

    return { canEdit, canDelete, isAdmin };
  }, []); // Dependencias vacías porque los valores son estáticos

  return permissions;
};