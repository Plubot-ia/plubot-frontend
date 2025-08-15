export const plubotVariants = {
  animate: {
    translateY: [0, -2, 0],
    scale: [1, 1.03, 1],
    transition: {
      translateY: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.5,
      },
      scale: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.5,
      },
    },
  },
  initial: { translateY: 0, scale: 1 },
};

export const glitchCyanPlubotVariants = {
  animate: {
    translateY: [0, -2, 0],
    scale: [1, 1.02, 1],
    transition: {
      translateY: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.6,
      },
      scale: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.6,
      },
    },
  },
  initial: { translateY: 0, scale: 1 },
};

export const glitchMagentaPlubotVariants = {
  animate: {
    translateY: [0, -2, 0],
    scale: [1, 1.01, 1],
    transition: {
      translateY: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.7,
      },
      scale: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.7,
      },
    },
  },
  initial: { translateY: 0, scale: 1 },
};
