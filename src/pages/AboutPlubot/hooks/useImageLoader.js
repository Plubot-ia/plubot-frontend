import { useState, useEffect } from 'react';

const useImageLoader = (source) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = source;

    const handleLoad = () => setIsLoaded(true);

    img.addEventListener('load', handleLoad);

    return () => {
      img.removeEventListener('load', handleLoad);
    };
  }, [source]);

  return isLoaded;
};

export default useImageLoader;
