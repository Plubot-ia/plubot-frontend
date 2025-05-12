import React, { useState, useEffect, useCallback } from 'react';
import { Handle } from 'reactflow';
import { Plug, ChevronDown, CheckCircle, AlertCircle, Settings, Zap, RefreshCw } from 'lucide-react';
import { powers } from '@/data/powers';
import { POWER_CATEGORIES } from '@/utils/nodeConfig';
import useAPI from '@/hooks/useAPI';
import { v4 as uuidv4 } from 'uuid';
import './PowerNode.css';

const PowerNode = ({ id, data, isConnectable, selected }) => {
  const { request } = useAPI();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPowerSelector, setShowPowerSelector] = useState(false);
  const [powerCategoryFilter, setPowerCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Inicializar el nodo con datos predeterminados si no existen
  useEffect(() => {
    if (!data.initialized) {
      updateNodeData({
        initialized: true,
        powerId: data.powerId || '',
        powerTitle: data.powerTitle || 'Poder',
        powerIcon: data.powerIcon || 'zap',
        powerCategory: data.powerCategory || '',
        operations: data.operations || [],
        selectedOperation: data.selectedOperation || '',
        authConfig: data.authConfig || {
          type: 'api_key', // Por defecto: api_key, oauth, basic_auth
          credentials: {}
        },
        configParams: data.configParams || {},
        inputMapping: data.inputMapping || [
          { id: uuidv4(), plubot_var: '', power_param: '' }
        ],
        outputMapping: data.outputMapping || [
          { id: uuidv4(), power_result: '', plubot_var: '' }
        ],
        isConfigured: data.isConfigured || false,
        status: data.status || { 
          state: 'pending', 
          message: 'Selecciona un poder para comenzar' 
        },
        testResult: data.testResult || null
      });
    }
  }, []);

  // Filtrar poderes según la categoría y la búsqueda
  const filteredPowers = powers
    .filter(power => !powerCategoryFilter || power.category === powerCategoryFilter)
    .filter(power => 
      !searchTerm || 
      power.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      power.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  const selectedPower = powers.find(p => p.id === data.powerId);
  
  // Actualizar datos del nodo
  const updateNodeData = useCallback((updatedData) => {
    if (data.updateNodeData) {
      data.updateNodeData(id, {
        ...data,
        ...updatedData
      });
    }
  }, [id, data]);
  
  // Seleccionar un poder
  const handleSelectPower = (power) => {
    updateNodeData({
      powerId: power.id,
      powerTitle: power.title,
      powerIcon: power.icon,
      powerCategory: power.category,
      label: `${power.title}`,
      isConfigured: false,
      status: { state: 'configuring', message: 'Poder seleccionado. Requiere configuración.' }
    });
    setShowPowerSelector(false);
    setIsExpanded(true);
    setIsConfiguring(true);
  };
  
  // Generar operaciones basadas en el poder seleccionado
  useEffect(() => {
    if (data.powerId && !data.operations.length) {
      // Aquí generaríamos operaciones basadas en el tipo de poder
      // Por ejemplo, para Notion podría ser "createPage", "updatePage", etc.
      const generatedOperations = generateOperationsForPower(data.powerId);
      
      updateNodeData({
        operations: generatedOperations,
        selectedOperation: generatedOperations.length > 0 ? generatedOperations[0].id : ''
      });
    }
  }, [data.powerId, data.operations, updateNodeData]);
  
  // Función para generar operaciones basadas en el poder seleccionado
  const generateOperationsForPower = (powerId) => {
    // Esta función generaría dinámicamente las operaciones disponibles para cada poder
    // A modo de ejemplo, proporcionamos algunas operaciones predefinidas para ciertos poderes
    const operationsByPower = {
      'notion': [
        { id: 'getPage', name: 'Obtener página', description: 'Obtiene una página por su ID' },
        { id: 'createPage', name: 'Crear página', description: 'Crea una nueva página en una base de datos' },
        { id: 'updatePage', name: 'Actualizar página', description: 'Actualiza los campos de una página existente' }
      ],
      'slack': [
        { id: 'sendMessage', name: 'Enviar mensaje', description: 'Envía un mensaje a un canal' },
        { id: 'createChannel', name: 'Crear canal', description: 'Crea un nuevo canal en el espacio de trabajo' }
      ],
      'google-sheets': [
        { id: 'readRow', name: 'Leer fila', description: 'Lee datos de una fila específica' },
        { id: 'appendRow', name: 'Añadir fila', description: 'Añade una nueva fila con datos' },
        { id: 'updateRow', name: 'Actualizar fila', description: 'Actualiza los datos de una fila existente' }
      ],
      'openai': [
        { id: 'generateText', name: 'Generar texto', description: 'Genera texto con IA basado en un prompt' },
        { id: 'analyzeText', name: 'Analizar texto', description: 'Analiza el contenido de un texto' }
      ],
      'google-calendar': [
        { id: 'createEvent', name: 'Crear evento', description: 'Crea un nuevo evento en el calendario' },
        { id: 'listEvents', name: 'Listar eventos', description: 'Lista los próximos eventos' }
      ]
    };
    
    // Operaciones predeterminadas para cualquier poder que no tenga operaciones específicas
    const defaultOperations = [
      { id: 'connect', name: 'Conectar', description: 'Establece una conexión con el servicio' },
      { id: 'getData', name: 'Obtener datos', description: 'Obtiene datos del servicio' },
      { id: 'sendData', name: 'Enviar datos', description: 'Envía datos al servicio' }
    ];
    
    return operationsByPower[powerId] || defaultOperations;
  };
  
  // Manejar la selección de operación
  const handleSelectOperation = (operationId) => {
    const selectedOp = data.operations.find(op => op.id === operationId);
    updateNodeData({
      selectedOperation: operationId,
      // Resetear mapeos cuando se cambia la operación
      inputMapping: [{ id: uuidv4(), plubot_var: '', power_param: '' }],
      outputMapping: [{ id: uuidv4(), power_result: '', plubot_var: '' }]
    });
  };
  
  // Añadir un nuevo mapeo de entrada
  const handleAddInputMapping = () => {
    updateNodeData({
      inputMapping: [
        ...data.inputMapping,
        { id: uuidv4(), plubot_var: '', power_param: '' }
      ]
    });
  };
  
  // Añadir un nuevo mapeo de salida
  const handleAddOutputMapping = () => {
    updateNodeData({
      outputMapping: [
        ...data.outputMapping,
        { id: uuidv4(), power_result: '', plubot_var: '' }
      ]
    });
  };
  
  // Actualizar un mapeo de entrada
  const handleUpdateInputMapping = (id, field, value) => {
    updateNodeData({
      inputMapping: data.inputMapping.map(mapping => 
        mapping.id === id ? { ...mapping, [field]: value } : mapping
      )
    });
  };
  
  // Actualizar un mapeo de salida
  const handleUpdateOutputMapping = (id, field, value) => {
    updateNodeData({
      outputMapping: data.outputMapping.map(mapping => 
        mapping.id === id ? { ...mapping, [field]: value } : mapping
      )
    });
  };
  
  // Eliminar un mapeo de entrada
  const handleRemoveInputMapping = (id) => {
    updateNodeData({
      inputMapping: data.inputMapping.filter(mapping => mapping.id !== id)
    });
  };
  
  // Eliminar un mapeo de salida
  const handleRemoveOutputMapping = (id) => {
    updateNodeData({
      outputMapping: data.outputMapping.filter(mapping => mapping.id !== id)
    });
  };
  
  // Configurar el poder (conexión con la API externa)
  const handleConfigurePower = async () => {
    setIsConfiguring(true);
    
    try {
      // Aquí simularíamos la configuración del poder con el backend
      // En una implementación real, esto podría abrir un flujo OAuth o solicitar una API key
      
      // Simulamos una petición al backend para configurar el poder
      /*
      const response = await request('POST', '/api/powers/configure', {
        powerId: data.powerId,
        authConfig: data.authConfig,
        configParams: data.configParams
      });
      */
      
      // Simulamos una respuesta exitosa
      const fakeResponse = {
        status: 'success',
        data: {
          isConfigured: true,
          authToken: 'fake-auth-token-' + uuidv4().slice(0, 8)
        }
      };
      
      // Actualizamos los datos del nodo con la configuración
      updateNodeData({
        isConfigured: true,
        authConfig: {
          ...data.authConfig,
          credentials: {
            ...data.authConfig.credentials,
            token: fakeResponse.data.authToken
          }
        },
        status: { state: 'configured', message: 'Poder configurado correctamente.' }
      });
      
    } catch (error) {
      console.error('Error al configurar el poder:', error);
      updateNodeData({
        status: { 
          state: 'error', 
          message: error.message || 'Error al configurar el poder.'
        }
      });
    } finally {
      setIsConfiguring(false);
    }
  };
  
  // Probar la conexión con el poder
  const handleTestPower = async () => {
    if (!data.isConfigured) {
      updateNodeData({
        status: { state: 'error', message: 'El poder debe ser configurado antes de probarlo.' }
      });
      return;
    }
    
    setIsTesting(true);
    updateNodeData({
      status: { state: 'testing', message: 'Probando conexión con el poder...' }
    });
    
    try {
      // Aquí simularíamos una prueba de conexión con el backend
      /*
      const response = await request('POST', '/api/powers/test', {
        powerId: data.powerId,
        authConfig: data.authConfig,
        operation: data.selectedOperation,
        inputMapping: data.inputMapping
      });
      */
      
      // Simulamos una respuesta exitosa con un pequeño retraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fakeResult = {
        status: 'success',
        data: {
          message: `Conexión exitosa con ${data.powerTitle}`,
          sampleData: { key1: 'valor1', key2: 'valor2' }
        }
      };
      
      updateNodeData({
        testResult: fakeResult.data,
        status: { state: 'success', message: 'Prueba exitosa.' }
      });
      
    } catch (error) {
      console.error('Error al probar el poder:', error);
      updateNodeData({
        testResult: { error: error.message },
        status: { 
          state: 'error', 
          message: error.message || 'Error al probar la conexión.'
        }
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  // Renderizar los campos de configuración específicos del poder
  const renderPowerConfigFields = () => {
    // Cada poder podría tener campos de configuración específicos
    switch (data.powerId) {
      case 'notion':
        return (
          <div className="power-config-fields">
            <div className="config-field">
              <label>Nombre de Base de Datos</label>
              <input 
                type="text" 
                placeholder="Ej. Tareas, Proyectos, etc."
                value={data.configParams.databaseName || ''}
                onChange={(e) => updateNodeData({
                  configParams: { ...data.configParams, databaseName: e.target.value }
                })}
              />
            </div>
          </div>
        );
        
      case 'slack':
        return (
          <div className="power-config-fields">
            <div className="config-field">
              <label>Canal Predeterminado</label>
              <input 
                type="text" 
                placeholder="Ej. #general"
                value={data.configParams.defaultChannel || ''}
                onChange={(e) => updateNodeData({
                  configParams: { ...data.configParams, defaultChannel: e.target.value }
                })}
              />
            </div>
          </div>
        );
        
      case 'google-sheets':
        return (
          <div className="power-config-fields">
            <div className="config-field">
              <label>ID de Hoja de Cálculo</label>
              <input 
                type="text"
                placeholder="ID de la hoja de Google Sheets"
                value={data.configParams.spreadsheetId || ''}
                onChange={(e) => updateNodeData({
                  configParams: { ...data.configParams, spreadsheetId: e.target.value }
                })}
              />
            </div>
            <div className="config-field">
              <label>Nombre de Hoja</label>
              <input 
                type="text"
                placeholder="Ej. Hoja1"
                value={data.configParams.sheetName || ''}
                onChange={(e) => updateNodeData({
                  configParams: { ...data.configParams, sheetName: e.target.value }
                })}
              />
            </div>
          </div>
        );
        
      // Campos para otros poderes...
        
      default:
        return null;
    }
  };
  
  // Determinar el color y el estado del nodo
  const getStatusColor = () => {
    switch (data.status.state) {
      case 'configured':
      case 'success':
        return '#00ff9d'; // Verde
      case 'error':
        return '#ff2e5b'; // Rojo
      case 'testing':
      case 'configuring':
        return '#ffb700'; // Amarillo
      default:
        return '#00e0ff'; // Azul por defecto
    }
  };
  
  // Obtener un icono basado en el estado
  const getStatusIcon = () => {
    switch (data.status.state) {
      case 'configured':
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      case 'testing':
      case 'configuring':
        return <RefreshCw size={16} className="spin-animation" />;
      default:
        return <Settings size={16} />;
    }
  };

  // Modificar la sección de operación para incluir la prueba
  const PowerOperation = () => (
    <div className="power-operation">
      <div className="operation-selector">
        <label>Operación</label>
        <select 
          value={data.selectedOperation} 
          onChange={(e) => handleSelectOperation(e.target.value)}
          disabled={!data.isConfigured}
        >
          <option value="">Seleccionar operación</option>
          {data.operations.map(op => (
            <option key={op.id} value={op.id}>{op.name}</option>
          ))}
        </select>
      </div>

      {data.selectedOperation && (
        <>
          <div className="mapping-section">
            <h4>Mapeo de Entrada</h4>
            {data.inputMapping.map((mapping, index) => (
              <div key={mapping.id} className="mapping-entry">
                <input 
                  type="text" 
                  placeholder="Variable de origen" 
                  value={mapping.plubot_var}
                  onChange={(e) => handleUpdateInputMapping(mapping.id, 'plubot_var', e.target.value)}
                />
                <span className="mapping-arrow">→</span>
                <input 
                  type="text" 
                  placeholder="Campo destino" 
                  value={mapping.power_param}
                  onChange={(e) => handleUpdateInputMapping(mapping.id, 'power_param', e.target.value)}
                />
                <button 
                  className="remove-mapping-button"
                  onClick={() => handleRemoveInputMapping(mapping.id)}
                >
                  ×
                </button>
              </div>
            ))}
            <button className="add-mapping-button" onClick={handleAddInputMapping}>
              + Añadir mapeo de entrada
            </button>
          </div>

          <div className="mapping-section">
            <h4>Mapeo de Salida</h4>
            {data.outputMapping.map((mapping, index) => (
              <div key={mapping.id} className="mapping-entry">
                <input 
                  type="text" 
                  placeholder="Campo de origen" 
                  value={mapping.power_result}
                  onChange={(e) => handleUpdateOutputMapping(mapping.id, 'power_result', e.target.value)}
                />
                <span className="mapping-arrow">→</span>
                <input 
                  type="text" 
                  placeholder="Variable destino" 
                  value={mapping.plubot_var}
                  onChange={(e) => handleUpdateOutputMapping(mapping.id, 'plubot_var', e.target.value)}
                />
                <button 
                  className="remove-mapping-button"
                  onClick={() => handleRemoveOutputMapping(mapping.id)}
                >
                  ×
                </button>
              </div>
            ))}
            <button className="add-mapping-button" onClick={handleAddOutputMapping}>
              + Añadir mapeo de salida
            </button>
          </div>

          <button 
            className="test-power-button"
            onClick={handleTestPower}
            disabled={isTesting || !data.selectedOperation}
          >
            {isTesting ? (
              <>
                <span className="spin-animation">⟳</span> Probando...
              </>
            ) : "Probar integración"}
          </button>

          {data.testResult && (
            <div className={`test-result ${data.testResult.success ? 'success' : 'error'}`}>
              <h4>{data.testResult.success ? "Prueba exitosa" : "Error en la prueba"}</h4>
              {data.testResult.success ? (
                <div>
                  <p>La integración funciona correctamente.</p>
                  {data.testResult.data && (
                    <pre>{JSON.stringify(data.testResult.data.outputData, null, 2)}</pre>
                  )}
                </div>
              ) : (
                <div>
                  <p>Error: {data.testResult.error}</p>
                  <p>Revisa la configuración e inténtalo de nuevo.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={`power-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
      
      <div className="power-node-content">
        <div 
          className="power-node-header"
          style={{ backgroundColor: data.powerId ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 100, 255, 0.1)' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="power-node-title">
            {data.powerId ? (
              <>
                <span className="power-icon">{selectedPower?.icon || data.powerIcon}</span>
                <span className="power-title">{data.label || data.powerTitle || 'Poder sin configurar'}</span>
              </>
            ) : (
              <>
                <Plug size={20} />
                <span>Poder</span>
              </>
            )}
          </div>
          
          {data.status.state !== 'idle' && (
            <div 
              className="power-status"
              style={{ color: getStatusColor() }}
              title={data.status.message}
            >
              {getStatusIcon()}
            </div>
          )}
          
          <div className="power-expand-toggle">
            <ChevronDown size={16} className={isExpanded ? 'expanded' : ''} />
          </div>
        </div>
        
        {isExpanded && (
          <div className="power-node-body">
            {!data.powerId ? (
              <div className="power-selection">
                <button 
                  className="select-power-button"
                  onClick={() => setShowPowerSelector(!showPowerSelector)}
                >
                  <Zap size={16} />
                  Seleccionar Poder
                </button>
                
                {showPowerSelector && (
                  <div className="power-selector">
                    <div className="power-search">
                      <input 
                        type="text"
                        placeholder="Buscar poder..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="power-categories">
                      <button 
                        className={`category-filter ${!powerCategoryFilter ? 'active' : ''}`}
                        onClick={() => setPowerCategoryFilter('')}
                      >
                        Todos
                      </button>
                      {POWER_CATEGORIES.map(category => (
                        <button 
                          key={category.id}
                          className={`category-filter ${powerCategoryFilter === category.id ? 'active' : ''}`}
                          onClick={() => setPowerCategoryFilter(category.id)}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                    
                    <div className="power-list">
                      {filteredPowers.map(power => (
                        <div 
                          key={power.id}
                          className="power-item"
                          onClick={() => handleSelectPower(power)}
                        >
                          <div className="power-item-icon">{power.icon}</div>
                          <div className="power-item-info">
                            <div className="power-item-title">{power.title}</div>
                            <div className="power-item-desc">{power.description}</div>
                          </div>
                        </div>
                      ))}
                      
                      {filteredPowers.length === 0 && (
                        <div className="no-powers-found">
                          No se encontraron poderes que coincidan con la búsqueda
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="power-configuration">
                {!data.isConfigured ? (
                  <div className="power-setup">
                    <div className="power-auth-config">
                      <h4>Configuración de Autenticación</h4>
                      <div className="auth-type-selector">
                        <label>Tipo de Autenticación:</label>
                        <select
                          value={data.authConfig.type}
                          onChange={(e) => updateNodeData({
                            authConfig: { ...data.authConfig, type: e.target.value }
                          })}
                        >
                          <option value="none">Ninguna</option>
                          <option value="api_key">API Key</option>
                          <option value="oauth">OAuth</option>
                          <option value="basic">Básica (Usuario/Contraseña)</option>
                        </select>
                      </div>
                      
                      {data.authConfig.type === 'api_key' && (
                        <div className="auth-fields">
                          <input 
                            type="text"
                            placeholder="API Key"
                            value={data.authConfig.credentials.apiKey || ''}
                            onChange={(e) => updateNodeData({
                              authConfig: { 
                                ...data.authConfig, 
                                credentials: { ...data.authConfig.credentials, apiKey: e.target.value }
                              }
                            })}
                          />
                        </div>
                      )}
                      
                      {data.authConfig.type === 'basic' && (
                        <div className="auth-fields">
                          <input 
                            type="text"
                            placeholder="Usuario"
                            value={data.authConfig.credentials.username || ''}
                            onChange={(e) => updateNodeData({
                              authConfig: { 
                                ...data.authConfig, 
                                credentials: { ...data.authConfig.credentials, username: e.target.value }
                              }
                            })}
                          />
                          <input 
                            type="password"
                            placeholder="Contraseña"
                            value={data.authConfig.credentials.password || ''}
                            onChange={(e) => updateNodeData({
                              authConfig: { 
                                ...data.authConfig, 
                                credentials: { ...data.authConfig.credentials, password: e.target.value }
                              }
                            })}
                          />
                        </div>
                      )}
                    </div>
                    
                    {renderPowerConfigFields()}
                    
                    <button 
                      className="configure-power-button"
                      onClick={handleConfigurePower}
                      disabled={isConfiguring}
                    >
                      {isConfiguring ? 'Configurando...' : 'Configurar Poder'}
                    </button>
                  </div>
                ) : (
                  <div className="power-operation">
                    <PowerOperation />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position="right"
        id="success"
        style={{ top: '30%', background: '#00ff9d' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position="right"
        id="error"
        style={{ top: '70%', background: '#ff2e5b' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default PowerNode;
