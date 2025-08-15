import { useEffect, useRef } from 'react';

const TOAST_CONTAINER_ID = 'toast-container';
const TOAST_STYLES_ID = 'toast-styles';

const TOAST_ANIMATIONS = `
  @keyframes toast-in {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes toast-out {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-20px); opacity: 0; }
  }
`;

const createContainer = () => {
  const container = document.createElement('div');
  container.id = TOAST_CONTAINER_ID;
  Object.assign(container.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '9999',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  });
  document.body.append(container);
  return container;
};

const injectStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.id = TOAST_STYLES_ID;
  styleElement.textContent = TOAST_ANIMATIONS;
  document.head.append(styleElement);
};

export const useToastContainerManager = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current = document.querySelector(`#${TOAST_CONTAINER_ID}`) || createContainer();

    if (!document.querySelector(`#${TOAST_STYLES_ID}`)) {
      injectStyles();
    }
  }, []);

  return containerRef;
};
