/**
 * @file FlowEditorRenderer.jsx
 * @description Componente de renderizado para FlowEditor
 * Extraído de FlowEditor.jsx para reducir max-lines-per-function
 */

import PropTypes from 'prop-types';
import React from 'react';

import EpicHeader from '../../common/EpicHeader';
import StatusBubble from '../../common/StatusBubble';
import { MIN_ZOOM, NODE_EXTENT, TRANSLATE_EXTENT } from '../utils/flow-extents';

import EmergencyRecovery from './EmergencyRecovery';
import FlowMain from './FlowMain';

// Componente helper para la sección de estado y controles
const StatusSection = ({ showSaveStatus, saveStatus, saveMessage, ultraModeController }) => (
  <>
    {showSaveStatus && (
      <StatusBubble
        status={saveStatus}
        message={saveMessage}
        onClose={() => {
          /* El hook se encarga de ocultarlo */
        }}
      />
    )}
    {ultraModeController}
  </>
);

// PropTypes para StatusSection
StatusSection.propTypes = {
  showSaveStatus: PropTypes.bool,
  saveStatus: PropTypes.string,
  saveMessage: PropTypes.string,
  ultraModeController: PropTypes.node,
};

// Componente helper para FlowMain con sus props
const FlowMainWrapper = ({
  reactFlowInstance,
  setReactFlowInstance,
  nodes,
  edges,
  onNodesChangeOptimized,
  onEdgesChangeOptimized,
  onConnectNodes,
  isValidConnection,
  plubotId,
  flowName,
  name,
  saveFlowHandler,
  onDragOver,
  onDrop,
  onSelectionDragStop,
  onEdgeUpdate,
  onEdgeUpdateStart,
  onEdgeUpdateEnd,
  isUltraMode,
  openModal,
  closeModal,
  hideContextMenu,
}) => (
  <FlowMain
    reactFlowInstance={reactFlowInstance}
    setReactFlowInstance={setReactFlowInstance}
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChangeOptimized}
    onEdgesChange={onEdgesChangeOptimized}
    onConnect={onConnectNodes}
    isValidConnection={isValidConnection}
    project={{ id: plubotId, name: flowName || name }}
    onSave={saveFlowHandler}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onSelectionDragStop={onSelectionDragStop}
    onEdgeUpdate={onEdgeUpdate}
    onEdgeUpdateStart={onEdgeUpdateStart}
    onEdgeUpdateEnd={onEdgeUpdateEnd}
    isUltraMode={isUltraMode}
    openModal={openModal}
    closeModal={closeModal}
    nodeExtent={NODE_EXTENT}
    translateExtent={TRANSLATE_EXTENT}
    minZoom={MIN_ZOOM}
    onPaneClick={hideContextMenu}
  />
);

// PropTypes para FlowMainWrapper
FlowMainWrapper.propTypes = {
  reactFlowInstance: PropTypes.object,
  setReactFlowInstance: PropTypes.func.isRequired,
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  onNodesChangeOptimized: PropTypes.func.isRequired,
  onEdgesChangeOptimized: PropTypes.func.isRequired,
  onConnectNodes: PropTypes.func.isRequired,
  isValidConnection: PropTypes.func.isRequired,
  plubotId: PropTypes.string.isRequired,
  flowName: PropTypes.string,
  name: PropTypes.string.isRequired,
  saveFlowHandler: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onSelectionDragStop: PropTypes.func.isRequired,
  onEdgeUpdate: PropTypes.func.isRequired,
  onEdgeUpdateStart: PropTypes.func.isRequired,
  onEdgeUpdateEnd: PropTypes.func.isRequired,
  isUltraMode: PropTypes.bool,
  openModal: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  hideContextMenu: PropTypes.func.isRequired,
};

// Componente helper para EmergencyRecovery con sus props
const EmergencyRecoveryWrapper = ({
  isRecoveryOpen,
  handleRecover,
  handleDismiss,
  backupExists,
}) => (
  <EmergencyRecovery
    isOpen={isRecoveryOpen}
    onRecover={handleRecover}
    onDismiss={handleDismiss}
    hasBackup={backupExists}
  />
);

// PropTypes para EmergencyRecoveryWrapper
EmergencyRecoveryWrapper.propTypes = {
  isRecoveryOpen: PropTypes.bool.isRequired,
  handleRecover: PropTypes.func.isRequired,
  handleDismiss: PropTypes.func.isRequired,
  backupExists: PropTypes.bool.isRequired,
};

// Componente helper para EpicHeader con sus props
const EpicHeaderWrapper = ({
  flowName,
  setLocalFlowName,
  saveFlowHandler,
  lastSaved,
  openModal,
}) => (
  <EpicHeader
    title={flowName || 'Flujo sin título'}
    setTitle={setLocalFlowName}
    showChangeLog={false}
    onSave={saveFlowHandler}
    lastSaved={lastSaved}
    showTemplateSelector={() => openModal('templateSelector')}
    showEmbedModal={() => openModal('embedModal')}
    showOptionsModal={() => openModal('importExportModal')}
    showSimulateModal={() => openModal('simulationModal')}
  />
);

// PropTypes para EpicHeaderWrapper
EpicHeaderWrapper.propTypes = {
  flowName: PropTypes.string,
  setLocalFlowName: PropTypes.func.isRequired,
  saveFlowHandler: PropTypes.func.isRequired,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
  openModal: PropTypes.func.isRequired,
};

/**
 * Componente de renderizado principal para FlowEditor
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} Renderizado del FlowEditor
 */
const FlowEditorRenderer = ({
  // Props del header
  flowName,
  setLocalFlowName,
  saveFlowHandler,
  lastSaved,
  openModal,

  // Props del status
  showSaveStatus,
  saveStatus,
  saveMessage,

  // Props de recovery
  isRecoveryOpen,
  handleRecover,
  handleDismiss,
  backupExists,

  // Props del flujo principal
  reactFlowInstance,
  setReactFlowInstance,
  reactFlowWrapperReference,
  nodes,
  edges,
  onNodesChangeOptimized,
  onEdgesChangeOptimized,
  onConnectNodes,
  isValidConnection,
  plubotId,
  name,
  onDragOver,
  onDrop,
  onSelectionDragStop,
  onEdgeUpdate,
  onEdgeUpdateStart,
  onEdgeUpdateEnd,
  isUltraMode,
  closeModal,
  hideContextMenu,

  // Controladores especiales
  ultraModeController,
}) => {
  return (
    <div className='flow-editor-container'>
      <EpicHeaderWrapper
        flowName={flowName}
        setLocalFlowName={setLocalFlowName}
        saveFlowHandler={saveFlowHandler}
        lastSaved={lastSaved}
        openModal={openModal}
      />

      <StatusSection
        showSaveStatus={showSaveStatus}
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        ultraModeController={ultraModeController}
      />

      <div className='flow-main-wrapper' ref={reactFlowWrapperReference}>
        <EmergencyRecoveryWrapper
          isRecoveryOpen={isRecoveryOpen}
          handleRecover={handleRecover}
          handleDismiss={handleDismiss}
          backupExists={backupExists}
        />
        <FlowMainWrapper
          reactFlowInstance={reactFlowInstance}
          setReactFlowInstance={setReactFlowInstance}
          nodes={nodes}
          edges={edges}
          onNodesChangeOptimized={onNodesChangeOptimized}
          onEdgesChangeOptimized={onEdgesChangeOptimized}
          onConnectNodes={onConnectNodes}
          isValidConnection={isValidConnection}
          plubotId={plubotId}
          flowName={flowName}
          name={name}
          saveFlowHandler={saveFlowHandler}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onSelectionDragStop={onSelectionDragStop}
          onEdgeUpdate={onEdgeUpdate}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          isUltraMode={isUltraMode}
          openModal={openModal}
          closeModal={closeModal}
          hideContextMenu={hideContextMenu}
        />
      </div>
    </div>
  );
};

FlowEditorRenderer.propTypes = {
  // Props del header
  flowName: PropTypes.string,
  setLocalFlowName: PropTypes.func.isRequired,
  saveFlowHandler: PropTypes.func.isRequired,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date), PropTypes.number]),
  openModal: PropTypes.func.isRequired,

  // Props del status
  showSaveStatus: PropTypes.bool,
  saveStatus: PropTypes.string,
  saveMessage: PropTypes.string,

  // Props de recovery
  isRecoveryOpen: PropTypes.bool,
  handleRecover: PropTypes.func.isRequired,
  handleDismiss: PropTypes.func.isRequired,
  backupExists: PropTypes.bool,

  // Props del flujo principal
  reactFlowInstance: PropTypes.object,
  setReactFlowInstance: PropTypes.func.isRequired,
  reactFlowWrapperReference: PropTypes.object.isRequired,
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  onNodesChangeOptimized: PropTypes.func.isRequired,
  onEdgesChangeOptimized: PropTypes.func.isRequired,
  onConnectNodes: PropTypes.func.isRequired,
  isValidConnection: PropTypes.func.isRequired,
  plubotId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onSelectionDragStop: PropTypes.func.isRequired,
  onEdgeUpdate: PropTypes.func.isRequired,
  onEdgeUpdateStart: PropTypes.func.isRequired,
  onEdgeUpdateEnd: PropTypes.func.isRequired,
  isUltraMode: PropTypes.bool,
  closeModal: PropTypes.func.isRequired,
  hideContextMenu: PropTypes.func.isRequired,

  // Controladores especiales
  ultraModeController: PropTypes.node,
};

export default FlowEditorRenderer;
