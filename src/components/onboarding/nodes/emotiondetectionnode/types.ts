/**
 * types.ts
 *
 * Define las interfaces de TypeScript para el EmotionDetectionNode.
 * Esto asegura un tipado fuerte para las props y los datos del nodo.
 */

// Define la estructura de los datos que se almacenan en el nodo
export interface EmotionDetectionNodeData {
  id: string; // ID único del nodo
  label: string; // Etiqueta que se muestra en el nodo
  inputText?: string; // Texto a analizar, puede venir de otro nodo
  outputVariable?: string; // Nombre de la variable donde se guardará la emoción detectada
  detectedEmotion?: string; // La emoción detectada por la IA (ej: 'happy', 'sad')
  isCollapsed?: boolean; // Estado de la UI para colapsar el nodo
  ultraMode?: boolean; // Flag para el modo de alto rendimiento sin animaciones
  lodLevel?: string; // Nivel de detalle inyectado por el Flow
}

// Define las props que recibe el componente del nodo desde React Flow
export interface EmotionDetectionNodeProperties {
  id: string;
  data: EmotionDetectionNodeData;
  isConnectable: boolean;
  selected: boolean;
}
