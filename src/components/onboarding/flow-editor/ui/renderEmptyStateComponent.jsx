/**
 * Helper para renderizar el componente JSX de estado vacío del minimapa
 */
export const renderEmptyStateComponent = ({ emptyStateConfig, hasError, isExpanded }) => {
  return (
    <div
      className={emptyStateConfig.containerClassName}
      onClick={emptyStateConfig.handleToggle}
      onKeyDown={emptyStateConfig.handleKeyDown}
      role='button'
      tabIndex='0'
    >
      <div className='ts-minimap-empty'>
        <p>{hasError ? 'Error en minimapa' : 'Sin nodos'}</p>
        {hasError && isExpanded && (
          <button className='ts-minimap-reset' onClick={emptyStateConfig.handleResetClick}>
            Reiniciar
          </button>
        )}
      </div>
    </div>
  );
};
