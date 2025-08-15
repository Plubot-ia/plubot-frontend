# React Flow Overrides – Mapa de Dependencias

> _Última actualización: 2025-06-11_
>
> Este archivo traza **dónde** se utilizan las clases, IDs o elementos que cada parche CSS afecta.
> Nos permite saber qué partes del código dependen implícitamente de esos estilos antes de intentar
> cualquier consolidación o eliminación.

---

## 1. `fix-node-visibility.css`

| Selector / Regla                                                                  | Aparece en                                 | Notas                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| `.react-flow__node` (varias variantes)                                            | Generadas por **React Flow 11** en runtime | Necesario para forzar visibilidad y z-index. |
| `.react-flow__handle`                                                             | React Flow runtime                         |                                              |
| `.react-flow__controls`, `.react-flow__attribution`                               | React Flow runtime                         | Se oculta la marca de agua.                  |
| Contenedores `.react-flow`, `.react-flow__viewport`, `.flow-editor-wrapper`, etc. | Varios componentes CSS locales             | Se aseguran de no recortar nodos.            |

> **Riesgo:** Depende fuertemente de nombres internos de React Flow. Cualquier upgrade de la
> librería puede romper estos selectores.

---

## 2. `fix-overlay.css`

| Selector                  | Referencias encontradas                                  | Componentes                         |
| ------------------------- | -------------------------------------------------------- | ----------------------------------- |
| `.loading-overlay`        | `fix-global.css` (genérico)                              | Overlays de carga globales.         |
| `.data-loading-indicator` | (solo en este parche)                                    | Indicador de carga de datos.        |
| `.global-state-loading`   | (solo en este parche)                                    | Loader que cubre toda la app.       |
| `.byte-notification`      | `fix-global.css`, `ByteAssistant`                        | Notificaciones de Byte.             |
| `.status-bubble`          | `StatusBubble.jsx`, `StatusBubble.css`, `SyncButton.jsx` | Notificaciones de estado flotantes. |
| `.ts-loading`, `.loading` | varios loaders legacy                                    |                                     |

---

## 3. `fix-transform-override.css`

| Selector                                          | Referencias encontradas | Notas                             |
| ------------------------------------------------- | ----------------------- | --------------------------------- |
| `.react-flow__pane`, `.react-flow__viewport`      | React Flow runtime      | No anular `transform`.            |
| `.react-flow__edge`, `.react-flow__selectionpane` | Runtime                 |                                   |
| `.react-flow__node`                               | Runtime                 | Se ajusta posición y visibilidad. |

> **Importante:** Si otro parche o CSS (p.ej. `reset-transform.css`) cambia estos mismos selectores,
> debemos validar conflictos de especificidad.

---

## 5. `forcePatch.css`

| Selector                                                       | Referencias encontradas   | Componentes                                            |
| -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------ |
| `.flow-editor-container .layout > footer`, `.quantum-footer`   | Layout global             | Oculta footer solo dentro del editor y TrainingScreen. |
| `.react-flow__edge`, `.react-flow__node`, `.react-flow__panel` | React Flow runtime        | Re-define jerarquía de capas (z-index).                |
| `.ts-background-scene-container`                               | JSX `BackgroundScene.jsx` | Fondo animado.                                         |

---

## Conclusiones

1. Existen **múltiples dependencias internas** (JSX y otros CSS) que asumen la presencia de estas
   reglas. Cualquier consolidación debe mantener la **especificidad y orden**.
2. Particularmente peligrosos:
   - `.react-flow__*` selecciones – ligadas a la versión exacta de React Flow.
   - `.ts-byte-assistant` y `.status-bubble` – usadas globalmente fuera del editor.
3. Antes de fusionar, se recomienda crear un build de staging con las reglas concatenadas,
   asegurando:
   - Repetir el orden actual de importación.
   - Añadir pruebas visuales (Playwright o snapshots) de nodos, overlays y layout.

---

_Si encuentras nuevas dependencias, documenta aquí antes de modificar los parches._
