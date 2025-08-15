/**
 * Componente EdgeFilters
 * Define filtros SVG avanzados para efectos visuales de élite en aristas
 * Estos filtros proporcionan efectos de resplandor, partículas y gradientes
 * según estándares de visualización de datos de 2025
 *
 * @version 2.0.0
 * @author Cascade AI
 */
import { renderEdgeFilters, renderEdgeGradients } from '../utils/edge-filters-utilities';

const EdgeFilters = () => {
  return (
    <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden='true' focusable='false'>
      <defs>
        {/* Filtros SVG extraídos a utilidades */}
        {renderEdgeFilters()}

        {/* Gradientes SVG extraídos a utilidades */}
        {renderEdgeGradients()}
      </defs>
    </svg>
  );
};

export default EdgeFilters;
