# Optimizaciones del Editor de Flujos

Este documento describe las optimizaciones implementadas en el editor de flujos para mejorar el
rendimiento y la experiencia del usuario.

## Características Principales

### 1. Gestión de Estado con Zustand

- Estado global centralizado para nodos, aristas y configuración
- Actualizaciones eficientes con inmutabilidad
- Integración con localStorage para persistencia

### 2. Optimizaciones de Rendimiento

- **Modo Ultra Rendimiento**: Reduce la calidad visual para mejorar el rendimiento
- **Lazy Loading**: Carga de componentes bajo demanda
- **Memoización**: Uso intensivo de `React.memo` y `useMemo`
- **Throttling/Debouncing**: Control de la frecuencia de actualizaciones
- **Virtualización**: Renderizado eficiente de elementos visibles

### 3. Historial de Cambios

- Deshacer/Rehacer ilimitado (hasta el límite de memoria)
- Agrupación de cambios relacionados
- Persistencia del historial

### 4. Componentes Optimizados

- **Nodos Ultra Optimizados**: Versiones ligeras de los nodos estándar
- **Aristas Optimizadas**: Renderizado eficiente de conexiones
- **Lazy Loading**: Carga bajo demanda de componentes pesados

## Uso

### Configuración Básica

```jsx
import { FlowEditorWrapper } from './components/onboarding/flow-editor';

function App() {
  return <FlowEditorWrapper>{/* Contenido del editor */}</FlowEditorWrapper>;
}
```

### Personalización

```jsx
<FlowEditorWrapper
  initialNodes={initialNodes}
  initialEdges={initialEdges}
  onSave={handleSave}
  onError={handleError}
>
  {/* Componentes personalizados */}
</FlowEditorWrapper>
```

## API

### FlowEditorWrapper

| Propiedad    | Tipo     | Descripción          |
| ------------ | -------- | -------------------- |
| initialNodes | Array    | Nodos iniciales      |
| initialEdges | Array    | Aristas iniciales    |
| onSave       | Function | Callback al guardar  |
| onError      | Function | Manejador de errores |

### Hooks

#### useFlowOptimization

```js
const { isIdle, isUltraMode, markActivity, toggleUltraMode, runOnNextFrame } =
  useFlowOptimization();
```

## Mejoras de Rendimiento

### Habilitar Modo Ultra Rendimiento

```js
const { toggleUltraMode } = useFlowOptimization();

// Alternar modo
toggleUltraMode();
```

### Uso de runOnNextFrame

Para operaciones costosas que no necesitan ejecutarse en cada render:

```js
const { runOnNextFrame } = useFlowOptimization();

useEffect(() => {
  const cleanup = runOnNextFrame(() => {
    // Código costoso aquí
  });

  return () => cleanup();
}, [runOnNextFrame]);
```

## Próximas Mejoras

1. Soporte para Web Workers para cálculos pesados
2. Mejor manejo de memoria para grafos grandes
3. Optimización de animaciones con WebGL
4. Soporte para renderizado fuera de pantalla (OffscreenCanvas)

## Contribución

1. Haz fork del repositorio
2. Crea una rama para tu característica
3. Envía un pull request

## Licencia

MIT
