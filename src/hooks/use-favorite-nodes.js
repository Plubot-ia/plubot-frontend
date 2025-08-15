import { useState, useEffect } from 'react';

const useFavoriteNodes = () => {
  const [favoriteNodes, setFavoriteNodes] = useState(() => {
    try {
      const savedFavorites = localStorage.getItem('favoriteNodes');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al leer favoritos del localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('favoriteNodes', JSON.stringify(favoriteNodes));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al guardar favoritos en localStorage:', error);
    }
  }, [favoriteNodes]);

  return { favoriteNodes, setFavoriteNodes };
};

export default useFavoriteNodes;
