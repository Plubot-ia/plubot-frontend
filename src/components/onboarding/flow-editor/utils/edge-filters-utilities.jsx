/**
 * @file edge-filters-utilities.jsx
 * @description Utilidades para filtros SVG de aristas en el editor de flujo
 * Extraído de EdgeFilters.jsx para reducir max-lines-per-function
 */

/**
 * Renderiza filtros SVG para efectos visuales de aristas
 * @returns {JSX.Element} Elementos de filtros SVG
 */
export function renderEdgeFilters() {
  return (
    <>
      {/* Filtro para el resplandor de las aristas */}
      <filter id='elite-edge-glow-filter' x='-50%' y='-50%' width='200%' height='200%'>
        <feGaussianBlur stdDeviation='3' result='blur' />
        <feComposite in='SourceGraphic' in2='blur' operator='over' />
      </filter>

      {/* Filtro para las partículas de flujo energético */}
      <filter id='elite-edge-particle-filter' x='-50%' y='-50%' width='200%' height='200%'>
        <feGaussianBlur stdDeviation='1.5' result='blur' />
        <feComposite in='SourceGraphic' in2='blur' operator='over' />
        <feColorMatrix
          type='matrix'
          values='1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 1.5 0'
        />
      </filter>

      {/* Filtro para el efecto de neón en aristas seleccionadas */}
      <filter id='elite-edge-neon-filter' x='-50%' y='-50%' width='200%' height='200%'>
        <feGaussianBlur stdDeviation='2.5' result='blur' />
        <feComposite in='SourceGraphic' in2='blur' operator='over' />
        <feColorMatrix
          type='matrix'
          values='1 0 0 0 0.2
                  0 1 0 0 0
                  0 0 1 0 0.2
                  0 0 0 1.8 0'
        />
      </filter>

      {/* Filtro para el efecto de desenfoque direccional */}
      <filter id='elite-edge-motion-filter'>
        <feGaussianBlur in='SourceGraphic' stdDeviation='2' />
        <feOffset dx='1' dy='0' />
        <feComposite in='SourceGraphic' operator='over' />
      </filter>
    </>
  );
}

/**
 * Renderiza gradientes SVG para aristas
 * @returns {JSX.Element} Elementos de gradientes SVG
 */
export function renderEdgeGradients() {
  return (
    <>
      {/* Gradiente base para aristas */}
      <linearGradient id='elite-edge-base-gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
        <stop offset='0%' stopColor='#ff00ff' stopOpacity='0.8' />
        <stop offset='50%' stopColor='#ffffff' stopOpacity='0.9' />
        <stop offset='100%' stopColor='#ff00ff' stopOpacity='0.8' />
      </linearGradient>

      {/* Gradiente para aristas seleccionadas */}
      <linearGradient id='elite-edge-selected-gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
        <stop offset='0%' stopColor='#ff40ff' stopOpacity='0.9' />
        <stop offset='50%' stopColor='#ffffff' stopOpacity='1' />
        <stop offset='100%' stopColor='#ff40ff' stopOpacity='0.9' />
      </linearGradient>

      {/* Gradiente para aristas con hover */}
      <linearGradient id='elite-edge-hover-gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
        <stop offset='0%' stopColor='#ff20ff' stopOpacity='0.85' />
        <stop offset='50%' stopColor='#ffffff' stopOpacity='0.95' />
        <stop offset='100%' stopColor='#ff20ff' stopOpacity='0.85' />
      </linearGradient>
    </>
  );
}
