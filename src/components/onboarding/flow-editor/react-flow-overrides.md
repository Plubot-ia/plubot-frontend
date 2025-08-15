# React Flow Overrides – Auditoría de Parches CSS

Este documento describe **por qué** cada archivo de parche CSS es crítico para el editor de flujos y
**qué** reglas principales contiene. _No modifiques ni elimines estos archivos sin verificar
exhaustivamente su impacto visual y funcional._

---

## 1. `fix-node-visibility.css`

**Propósito:** Garantizar que **todos los nodos y handles** sean visibles y clicables. Corrige casos
donde ciertos contenedores o transformaciones ocultan los nodos.

**Reglas clave:**

- Selección de `.react-flow__node` con altísima especificidad y `!important`.
- `visibility: visible`, `opacity: 1`, `position: absolute`, `z-index: 9999`.
- Fuerza `overflow: visible` en múltiples contenedores (`.react-flow`, `.react-flow__viewport`,
  etc.).
- Quita marca de agua de React Flow.

**Consecuencias de removerlo:** Nodos invisibles o imposibles de seleccionar.

---

## 2. `fix-overlay.css`

**Propósito:** Normaliza overlays y loaders para que no cubran ni distorsionen nodos; evita reglas
destructivas que oscurecían toda la UI.

**Reglas clave:**

- Estiliza selectivamente `.loading-overlay`, `.data-loading-indicator`, `.global-state-loading`.
- Ajusta `.byte-notification`, `.status-bubble` con `z-index: 9999` pero sin bloquear puntero.
- Elimina antiguo selector genérico que aplicaba a "fondos oscuros".

**Consecuencias de removerlo:** Overlays opacos o estilo roto sobre el canvas.

---

## 3. `fix-transform-override.css`

**Propósito:** Soluciona el _apilamiento de nodos en la esquina superior izquierda_ causado por
reglas que anulaban `transform` del viewport.

**Reglas clave:**

- **No** anula `transform` de `.react-flow__viewport`.
- Define `transform-origin`, z-index correctos y limpia animaciones innecesarias.
- Asegura visibilidad e interacción de `.react-flow__node`, `.react-flow__handle`,
  `.react-flow__edge`.

**Consecuencias de removerlo:** Todos los nodos colapsarían en (0,0) y el pane no se movería.

---

## 5. `forcePatch.css`

**Propósito:** Parche "paraguas" que unifica múltiples fixes: jerarquía de capas, eliminación de
footer dentro del editor, visibilidad de nodos/edges y optimizaciones de rendimiento.

**Reglas clave:**

- Crea **sistema de capas (z-index)** desde fondo (-10) hasta UI (1000).
- Oculta el footer (`.quantum-footer`, `.layout > footer`) sólo dentro de `.flow-editor-container` y
  `.training-screen`.
- Establece `will-change: transform` y `contain: layout style` en nodos para mejorar rendimiento.

**Consecuencias de removerlo:** Footer visible sobre canvas, capas incorrectas, posibles glitches en
drag-and-drop.

---

## Recomendaciones futuras

1. **No fusionar** estos archivos hasta poder replicar su comportamiento en un entorno de staging;
   el orden de importación y la especificidad son críticas.
2. Mantener esta documentación actualizada cuando se cambie una regla.
3. Al consolidar, respetar el orden: `fix-node-visibility` → `fix-transform-override` →
   `fix-overflow` → `fix-overlay` → `forcePatch`.
