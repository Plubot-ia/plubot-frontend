import { memo } from 'react';

/**
 * Componente para el fondo estático del modo Ultra Rendimiento
 */
const UltraBackground = () => (
  <div className='ultra-mode-background'>
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.96)',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(ellipse at 80% 15%, rgba(227, 23, 227, 0.12) 0%, rgba(227, 23, 227, 0.05) 20%, rgba(0, 0, 0, 0) 50%),
          linear-gradient(to right, rgba(227, 23, 227, 0.03) 0%, rgba(0, 0, 0, 0) 15%),
          radial-gradient(circle at 5% 95%, rgba(227, 23, 227, 0.07) 0%, rgba(0, 0, 0, 0) 25%),
          radial-gradient(ellipse at 50% 100%, rgba(227, 23, 227, 0.04) 0%, rgba(0, 0, 0, 0) 40%),
          radial-gradient(circle at 20% 30%, rgba(227, 23, 227, 0.08) 0%, rgba(227, 23, 227, 0) 1%),
          radial-gradient(circle at 70% 65%, rgba(227, 23, 227, 0.06) 0%, rgba(227, 23, 227, 0) 1%),
          radial-gradient(circle at 90% 90%, rgba(227, 23, 227, 0.07) 0%, rgba(227, 23, 227, 0) 1%),
          radial-gradient(circle at 30% 80%, rgba(227, 23, 227, 0.05) 0%, rgba(227, 23, 227, 0) 1%),
          radial-gradient(circle at 85% 40%, rgba(227, 23, 227, 0.06) 0%, rgba(227, 23, 227, 0) 1%)
        `,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  </div>
);

export default memo(UltraBackground);
