/**
 * Helper para renderizar el componente JSX principal del minimapa
 */
export const renderMainMinimapComponent = ({
  containerProps,
  canvasReference,
  width,
  height,
  isExpanded,
  expandedLabelsComponent,
  collapsedIconComponent,
}) => {
  return (
    <div {...containerProps}>
      <canvas ref={canvasReference} width={width} height={height} className='ts-minimap-canvas' />
      {isExpanded && expandedLabelsComponent}
      {!isExpanded && collapsedIconComponent}
    </div>
  );
};
