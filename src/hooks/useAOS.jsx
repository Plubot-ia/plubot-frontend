import { useEffect } from 'react';

const useAOS = () => {
  useEffect(() => {
    import('aos')
      .then((AOS) => {
        import('aos/dist/aos.css');
        AOS.default.init();
        // Satisfy promise/always-return by explicitly returning.
      })
      .catch(() => {
        /* AOS es visual, los errores de inicialización pueden ser ignorados. */
      });

    return () => {
      import('aos')
        .then((AOS) => {
          AOS.default.refresh();
        })
        .catch(() => {
          /* AOS es visual, los errores de refresco pueden ser ignorados. */
        });
    };
  }, []);
};

export default useAOS;
