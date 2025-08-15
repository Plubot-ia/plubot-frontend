import { renderEmptyStateComponent } from './renderEmptyStateComponent';
import { renderMainMinimapComponent } from './renderMainMinimapComponent';

/**
 * Helper para renderizado condicional del minimapa
 * Elimina bloque condicional de CustomMiniMap.jsx para reducir líneas
 */
export const renderConditionalMinimap = ({
  shouldShowEmptyState,
  emptyStateConfig,
  hasError,
  isExpanded,
  containerProps,
  canvasReference,
  width,
  height,
  expandedLabelsComponent,
  collapsedIconComponent,
}) => {
  // Si debe mostrar estado vacío, usar helper externo
  if (shouldShowEmptyState) {
    return renderEmptyStateComponent({
      emptyStateConfig,
      hasError,
      isExpanded,
    });
  }

  // Usar helper externo para main JSX return
  return renderMainMinimapComponent({
    containerProps,
    canvasReference,
    width,
    height,
    isExpanded,
    expandedLabelsComponent,
    collapsedIconComponent,
  });
};
