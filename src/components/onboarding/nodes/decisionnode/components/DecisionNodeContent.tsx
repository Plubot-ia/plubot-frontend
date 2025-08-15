/**
 * @file DecisionNodeContent.tsx
 * @description Componente de contenido para el nodo de decisión
 */

import React from 'react';

import type { DecisionCondition, DecisionNodeData } from '../DecisionNode.types';

// Lazy imports
const DecisionNodeQuestion = React.lazy(async () => import('./DecisionNodeQuestion'));
const DecisionNodeConditions = React.lazy(async () => import('./DecisionNodeConditions'));
const DecisionNodeOptions = React.lazy(async () => import('./DecisionNodeOptions'));

interface DecisionNodeContentProps {
  isEditing: boolean;
  currentQuestion: string;
  setCurrentQuestion: (question: string) => void;
  startEditing: () => void;
  finishEditing: () => void;
  cancelEditing: () => void;
  currentConditions: DecisionCondition[];
  addCondition: () => void;
  handleConditionTextChange: (conditionId: string, newText: string) => void;
  handleDeleteCondition: (conditionId: string) => void;
  isUltraMode: boolean;
  question: string;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  isSaving: boolean;
  id: string;
  updateNodeData: (id: string, data: Partial<DecisionNodeData>) => void;
  enableMarkdown: boolean;
  enableVariables: boolean;
}

const DecisionNodeContent: React.FC<DecisionNodeContentProps> = ({
  isEditing,
  currentQuestion,
  setCurrentQuestion,
  startEditing,
  finishEditing,
  cancelEditing,
  currentConditions,
  addCondition,
  handleConditionTextChange,
  handleDeleteCondition,
  isUltraMode,
  question,
  handleKeyDown,
  isSaving,
  id,
  updateNodeData,
  enableMarkdown,
  enableVariables,
}) => (
  <>
    <div className='decision-node__content'>
      {isEditing ? (
        <>
          <DecisionNodeQuestion
            question={currentQuestion}
            onQuestionChange={setCurrentQuestion}
            isEditing={isEditing}
            onStartEditing={startEditing}
            onSave={finishEditing}
            onCancel={cancelEditing}
            isSaving={isSaving ?? false}
            enableMarkdown={enableMarkdown ?? false}
            enableVariables={enableVariables ?? false}
            isUltraPerformanceMode={isUltraMode}
          />
          <DecisionNodeConditions
            conditions={currentConditions}
            onAddCondition={addCondition}
            onConditionChange={handleConditionTextChange}
            onDeleteCondition={handleDeleteCondition}
            onMoveCondition={() => {
              // Placeholder
            }}
            isUltraPerformanceMode={isUltraMode}
            isEditing={isEditing}
            activeConditionId={undefined}
            setActiveConditionId={() => {
              // Placeholder
            }}
            disableAdd={(currentConditions?.length ?? 0) >= 5}
            maxConditions={5}
          />
        </>
      ) : (
        <div
          className='decision-node__question-preview'
          onClick={startEditing}
          onKeyDown={handleKeyDown}
          role='button'
          tabIndex={0}
        >
          {question || 'Haz clic para editar la pregunta...'}
        </div>
      )}
    </div>

    <div className='decision-node__footer'>
      {isEditing ? (
        <div className='decision-node__edit-actions'>
          <button
            onClick={cancelEditing}
            className='decision-node__button decision-node__button--secondary'
          >
            Cancelar
          </button>
          <button
            onClick={finishEditing}
            className='decision-node__button decision-node__button--primary'
          >
            Guardar
          </button>
        </div>
      ) : (
        <DecisionNodeOptions
          isUltraPerformanceMode={false}
          onToggleMarkdown={() => updateNodeData(id, { enableMarkdown: !enableMarkdown })}
          enableMarkdown={enableMarkdown ?? false}
          onToggleVariables={() => updateNodeData(id, { enableVariables: !enableVariables })}
          enableVariables={enableVariables ?? false}
          onToggleLogic={() => updateNodeData(id, { enableLogic: false })}
          enableLogic={false}
        />
      )}
    </div>
  </>
);

export default DecisionNodeContent;
