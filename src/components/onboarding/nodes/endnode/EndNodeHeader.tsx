import cn from 'classnames'; // For conditional class names
import { Flag, ChevronDown, ChevronRight, MoreVertical, Check, X, Edit3 } from 'lucide-react';
import React, { useEffect, ChangeEvent } from 'react';

import Tooltip from '../../ui/ToolTip'; // Adjust path if needed

interface EndNodeHeaderProperties {
  label: string;
  status?: string;
  customIcon?: React.ReactNode;
  isCollapsed: boolean;
  isEditingLabel: boolean;
  editingLabelValue: string;
  labelInputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onToggleCollapse: () => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onStartEditingLabel: () => void;
  onLabelChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onLabelSubmit: () => void;
  onLabelCancel: () => void;
  onLabelKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  canEdit?: boolean;
}

const EndNodeHeader: React.FC<EndNodeHeaderProperties> = ({
  label,
  status,
  customIcon,
  isCollapsed,
  isEditingLabel,
  editingLabelValue,
  labelInputRef,
  onToggleCollapse,
  onMenuClick,
  onStartEditingLabel,
  onLabelChange,
  onLabelSubmit,
  onLabelCancel,
  onLabelKeyDown,
  canEdit = true, // Default to true if not provided
}) => {
  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel, labelInputRef]);

  const handleLabelDoubleClick = () => {
    if (!isEditingLabel && canEdit) {
      onStartEditingLabel();
    }
  };

  return (
    <div className={cn('end-node-header', { 'editing-label': isEditingLabel })}>
      <button
        onClick={onToggleCollapse}
        className='end-node-collapse-button'
        aria-label={isCollapsed ? 'Expandir nodo' : 'Colapsar nodo'}
        title={isCollapsed ? 'Expandir nodo' : 'Colapsar nodo'}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
      </button>

      <div
        className='flex items-center flex-grow mr-2 overflow-hidden'
        onDoubleClick={canEdit ? onStartEditingLabel : undefined}
      >
        {customIcon ?? <Flag size={16} />}
      </div>

      <div className='end-node-title-container' onDoubleClick={handleLabelDoubleClick}>
        {isEditingLabel ? (
          <div className='end-node-label-edit-container'>
            <input
              ref={labelInputRef as React.RefObject<HTMLInputElement>} // Cast if primarily input
              type='text'
              value={editingLabelValue}
              onChange={onLabelChange}
              onKeyDown={onLabelKeyDown} // Handles Enter/Escape
              onBlur={onLabelSubmit} // Submit on blur as a common pattern
              className='end-node-label-input'
              aria-label='Editar etiqueta del nodo'
            />
            <button
              onClick={onLabelSubmit}
              className='end-node-label-edit-button submit'
              aria-label='Confirmar etiqueta'
            >
              <Check size={16} />
            </button>
            <button
              onClick={onLabelCancel}
              className='end-node-label-edit-button cancel'
              aria-label='Cancelar edición'
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <h3 className='end-node-title' title={label}>
            {label.length > 25 ? `${label.slice(0, 22)}...` : label}
            {canEdit && (
              <Tooltip content='Editar nombre del nodo'>
                <button
                  type='button'
                  onClick={onStartEditingLabel}
                  className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md w-6 h-6 flex items-center justify-center'
                  disabled={!canEdit}
                  aria-label='Editar nombre del nodo'
                >
                  <Edit3 size={14} />
                </button>
              </Tooltip>
            )}
          </h3>
        )}
        {status && !isEditingLabel && (
          <Tooltip content={`Estado: ${status}`} position='top'>
            <span className={`end-node-status-badge status-${status.toLowerCase()}`}>{status}</span>
          </Tooltip>
        )}
      </div>

      <button
        onClick={onMenuClick}
        className='end-node-menu-button'
        aria-label='Abrir menú contextual'
        title='Más opciones'
      >
        <MoreVertical size={18} />
      </button>
    </div>
  );
};

export default EndNodeHeader;
