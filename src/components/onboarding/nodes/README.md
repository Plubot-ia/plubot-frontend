# Estructura de Nodos en Plubot

Este directorio contiene todos los nodos utilizados en el editor de flujos de Plubot. La estructura
está organizada de la siguiente manera:

## Organización

Cada tipo de nodo tiene su propia subcarpeta que contiene todos los archivos relacionados con ese
nodo:

- **startnode/** - Nodo de inicio del flujo
- **endnode/** - Nodo de finalización del flujo
- **messagenode/** - Nodo de mensaje
- **optionnode/** - Nodo de opciones
- **decisionnode/** - Nodo de decisión con condiciones
- **actionnode/** - Nodo de acción
- **httprequestnode/** - Nodo de petición HTTP
- **powernode/** - Nodo de poder
- **customedge/** - Componente para conexiones personalizadas

## Estructura de cada subcarpeta

Cada subcarpeta de nodo contiene:

1. El componente principal del nodo (ej. `StartNode.jsx`)
2. Los estilos CSS del nodo (ej. `StartNode.css`)
3. Componentes auxiliares específicos del nodo (ej. `StartNodeControls.jsx`)
4. Un archivo `index.js` que exporta el componente principal para facilitar las importaciones

## Importación de nodos

Para importar un nodo, puedes utilizar:

```jsx
// Importación directa del componente
import StartNode from '../nodes/startnode/StartNode.jsx';

// O usando el archivo index.js
import { EndNode } from '../nodes/endnode';
```

## Modo Ultra Rendimiento

Todos los nodos implementan un modo de "Ultra Rendimiento" que optimiza la visualización y el
rendimiento para trabajar con cientos de nodos sin problemas. Este modo:

- Elimina animaciones y efectos visuales costosos
- Simplifica los estilos y reduce las sombras
- Optimiza las transiciones y efectos hover
- Mantiene toda la funcionalidad mientras prioriza el rendimiento

## Coherencia entre nodos

Todos los nodos mantienen una coherencia estética y funcional, con:

- Estilos compartidos para una experiencia unificada
- Comportamientos consistentes de interacción
- Accesibilidad mejorada en todos los componentes
