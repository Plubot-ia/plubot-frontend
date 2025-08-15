import { FiRotateCcw, FiRotateCw } from 'react-icons/fi';

import { useUndoRedo } from '@/stores/selectors';
import './HistoryControls.css';

/**
 * Componente para controles de historial (deshacer/rehacer) en el editor de flujos
 */
const HistoryControls = () => {
  // Obtener funciones y estados del store de Flow
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  return (
    <div className='history-controls'>
      <button
        className='history-control-button'
        onClick={undo}
        disabled={!canUndo}
        title='Deshacer'
      >
        <FiRotateCcw />
      </button>
      <button className='history-control-button' onClick={redo} disabled={!canRedo} title='Rehacer'>
        <FiRotateCw />
      </button>
    </div>
  );
};

export default HistoryControls;
