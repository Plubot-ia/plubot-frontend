import { useEffect } from 'react';

const useAOS = () => {
  useEffect(() => {
    import('aos').then((AOS) => {
      import('aos/dist/aos.css');
      AOS.default.init();
    });
    return () => {
      import('aos').then((AOS) => AOS.default.refresh());
    };
  }, []);
};

export default useAOS;