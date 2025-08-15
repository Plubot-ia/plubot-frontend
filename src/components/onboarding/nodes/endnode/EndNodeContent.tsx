import React from 'react';

import type { Variable } from '../../ui/VariableEditor';
import VariableEditor from '../../ui/VariableEditor'; // Import VariableEditor

// Props for VariableEditor
interface EndNodeContentProperties {
  variables: Variable[];
  onAddVariable: (newVariable: { name: string; value: string }) => void;
  onUpdateVariable: (index: number, updatedFields: Partial<Omit<Variable, 'id'>>) => void;
  onDeleteVariable: (index: number) => void;
  variableEditorReadOnly?: boolean;
  maxVariables?: number; // Added to pass through to VariableEditor
}

const EndNodeContent: React.FC<EndNodeContentProperties> = ({
  variables,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
  variableEditorReadOnly = false,
  maxVariables, // Destructure
}) => {
  return (
    <div className='end-node-content'>
      <div className='end-node-variables-section'>
        <VariableEditor
          variables={variables}
          onAddVariable={onAddVariable}
          onUpdateVariable={onUpdateVariable}
          onDeleteVariable={onDeleteVariable}
          readOnly={variableEditorReadOnly}
          maxVariables={maxVariables} // Pass through
        />
      </div>
    </div>
  );
};

export default EndNodeContent;
