/**
 * @file GenericNodeIcon.jsx
 * @description Componente de ícono genérico para todos los tipos de nodos del flow.
 *              Utiliza un mapeo para seleccionar un ícono de `lucide-react` basado en el tipo de nodo.
 * @author PLUBOT Team
 * @version 1.0.0
 */

import {
  Play, // StartNode
  StopCircle, // EndNode
  MessageSquare, // MessageNode (default)
  GitMerge, // DecisionNode
  Zap, // ActionNode
  ListTree, // OptionNode
  Server, // HttpRequestNode
  Cpu, // PowerNode
  MessageCircle, // DiscordNode
  BrainCircuit, // AiNode
  Smile, // EmotionDetectionNode
  Puzzle, // Default
} from 'lucide-react';
import PropTypes from 'prop-types';
import { memo } from 'react';

const iconMap = {
  start: Play,
  end: StopCircle,
  message: MessageSquare,
  decision: GitMerge,
  action: Zap,
  option: ListTree,
  httpRequest: Server,
  power: Cpu,
  discord: MessageCircle,
  ai: BrainCircuit,
  emotionDetection: Smile,
};

const GenericNodeIcon = memo(({ nodeType, size = 16, strokeWidth = 2, className = '' }) => {
  const IconComponent = Object.prototype.hasOwnProperty.call(iconMap, nodeType)
    ? // eslint-disable-next-line security/detect-object-injection -- nodeType from controlled predefined types
      iconMap[nodeType]
    : Puzzle;

  const iconProperties = {
    size,
    strokeWidth,
    className,
    'aria-hidden': 'true',
  };

  return <IconComponent {...iconProperties} />;
});

GenericNodeIcon.displayName = 'GenericNodeIcon';

GenericNodeIcon.propTypes = {
  nodeType: PropTypes.string.isRequired,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  className: PropTypes.string,
};

export default GenericNodeIcon;
