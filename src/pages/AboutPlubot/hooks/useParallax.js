import { useScroll, useTransform } from 'framer-motion';

const useParallax = (ref) => {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return imageY;
};

export default useParallax;
