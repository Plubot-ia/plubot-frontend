import React, { memo, useState, useCallback, useEffect } from 'react';
import type { NodeProps, Node } from 'reactflow';
import { Handle, Position, useReactFlow } from 'reactflow';

import instance from '../../../../utils/axios-config.js'; // Usar ruta relativa
import './DiscordNode.css';
import Tooltip from '../../ui/ToolTip.jsx'; // Importar el componente Tooltip con extensión .jsx

export interface DiscordNodeData {
  label?: string;
  icon?: string;
  discordToken?: string;
  channelId?: string;
  messageContent?: string;
  lodLevel?: string;
}

// Interfaces para el tipado de la API de Discord
interface DiscordIntegration {
  id: string;
  status: string;
  bot_token?: string;
  token_error?: string;
}

interface IntegrationsApiResponse {
  integrations: DiscordIntegration[];
}

const DiscordNode: React.FC<NodeProps<DiscordNodeData>> = ({
  id,
  data,
  selected,
  isConnectable,
}) => {
  // Contenido para los tooltips
  const tokenTooltipContent = (
    <>
      El token de bot es una clave secreta que permite a Plubot interactuar con
      tu servidor de Discord en nombre de tu bot.
      <br />
      <button
        className='discord-node__tooltip-button'
        onClick={() => window.open('/tutoriales/discord', '_blank')}
        style={{ marginTop: '8px' }}
      >
        Ver Tutorial de Token
      </button>
    </>
  );

  const channelTooltipContent = (
    <>
      Es el identificador único del canal de Discord donde se enviará el
      mensaje.
      <br />
      Para obtenerlo, activa el Modo Desarrollador en Discord (Ajustes de
      Usuario &gt; Avanzado), luego haz clic derecho en el canal y selecciona
      &apos;Copiar ID&apos;.
      <br />
      <button
        className='discord-node__tooltip-button'
        onClick={() => window.open('/tutoriales/discord/channel-id', '_blank')} // Asumiendo una URL para este tutorial específico
        style={{ marginTop: '8px' }}
      >
        Ver Tutorial de ID de Canal
      </button>
    </>
  );
  // isConnectable prop from React Flow is important for Handles
  const { setNodes } = useReactFlow(); // Hook to update node data

  // Initialize state from data, providing defaults
  const [discordToken, setDiscordToken] = useState(data.discordToken ?? '');
  const [channelId, setChannelId] = useState(data.channelId ?? '');
  const [messageContent, setMessageContent] = useState(
    data.messageContent ?? '',
  );
  const [isLoadingProfileToken, setIsLoadingProfileToken] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Efecto para cargar el token del perfil
  useEffect(() => {
    const fetchProfileToken = async () => {
      if (data.discordToken) return; // Si ya hay un token en data, no hacer nada

      setIsLoadingProfileToken(true);
      try {
        // 1. Obtener la lista de integraciones
        const listResponse = await instance.get<IntegrationsApiResponse>(
          'discord-integrations/',
        );
        if (
          listResponse.data?.integrations &&
          listResponse.data.integrations.length > 0
        ) {
          // 2. Buscar la primera integración activa
          const activeIntegration = listResponse.data.integrations.find(
            (integration) => integration.status === 'active',
          );

          if (activeIntegration?.id) {
            // 3. Si se encuentra una activa, obtener sus detalles (que ahora incluyen el token)
            try {
              const detailResponse = await instance.get<DiscordIntegration>(
                `/discord-integrations/${activeIntegration.id}`,
              );
              if (detailResponse.data?.bot_token) {
                setDiscordToken(detailResponse.data.bot_token);
              } else if (detailResponse.data?.token_error) {
                // Opcional: manejar el error de token, por ejemplo, mostrar un mensaje
              } else {
                // Opcional: manejar el caso en que no hay ni token ni error
              }
            } catch {
              // Error al obtener los detalles de la integración, no es necesario notificar
            }
          }
        }
      } catch {
        // No es necesario mostrar un error al usuario aquí, simplemente no se autocompletará el token
      } finally {
        setIsLoadingProfileToken(false);
      }
    };

    void fetchProfileToken();
  }, [data.discordToken]); // Solo se ejecuta si data.discordToken cambia (o al montar si es undefined)

  const { label = 'Discord Node', icon = '🎮' } = data || {};

  const toggleEditMode = useCallback(() => {
    setIsEditing((previous) => !previous);
  }, []);

  const handleSave = useCallback(() => {
    // Update the node's data in the React Flow state
    setNodes((nds: Node<DiscordNodeData>[]) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              discordToken,
              channelId,
              messageContent,
            },
          };
        }
        return node;
      }),
    );
    setIsEditing(false); // Exit editing mode
  }, [id, discordToken, channelId, messageContent, setNodes]);

  return (
    <div
      className={`discord-node ${selected ? 'selected' : ''}`}
      onDoubleClick={toggleEditMode}
    >
      <Handle
        type='target'
        position={Position.Top}
        id={`${id}-target`}
        isConnectable={isConnectable}
        className='discord-node__handle discord-node__handle--target'
      />
      <div className='discord-node__header'>
        <span className='discord-node__icon'>{icon}</span>
        {data.label ?? label}{' '}
        {/* Use data.label if available, otherwise default */}
      </div>
      <div className='discord-node__content'>
        {isEditing ? (
          <div className='discord-node__edit-mode'>
            <div className='discord-node__label-group'>
              <label htmlFor={`token-${id}`}>Token del Bot:</label>
              <Tooltip content={tokenTooltipContent} position='top'>
                <span
                  className='discord-node__info-icon'
                  role='button'
                  tabIndex={0}
                >
                  ?
                </span>
              </Tooltip>
            </div>
            <input
              id={`token-${id}`}
              type='text'
              value={discordToken}
              disabled={isLoadingProfileToken} // Deshabilitar mientras carga
              onChange={(e) => setDiscordToken(e.target.value)}
              onDoubleClick={(e) => e.stopPropagation()} // Evitar que el doble clic cierre el modo edición
              onMouseDown={(e) => e.stopPropagation()} // Evitar que el nodo se arrastre al seleccionar texto
              placeholder='Discord Bot Token'
              className='discord-node__input'
            />
            <div className='discord-node__label-group'>
              <label htmlFor={`channel-${id}`}>ID del Canal:</label>
              <Tooltip content={channelTooltipContent} position='top'>
                <span
                  className='discord-node__info-icon'
                  role='button'
                  tabIndex={0}
                >
                  ?
                </span>
              </Tooltip>
            </div>
            <input
              id={`channel-${id}`}
              type='text'
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              onDoubleClick={(e) => e.stopPropagation()} // Evitar que el doble clic cierre el modo edición
              onMouseDown={(e) => e.stopPropagation()} // Evitar que el nodo se arrastre al seleccionar texto
              placeholder='Channel ID'
              className='discord-node__input'
            />
            <label htmlFor={`message-${id}`}>Mensaje:</label>
            <textarea
              id={`message-${id}`}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onDoubleClick={(e) => e.stopPropagation()} // Evitar que el doble clic cierre el modo edición
              onMouseDown={(e) => e.stopPropagation()} // Evitar que el nodo se arrastre al seleccionar texto
              placeholder='Escribe tu mensaje...'
              className='discord-node__textarea'
              rows={3}
            />
            <button onClick={handleSave} className='discord-node__save-button'>
              Guardar
            </button>
          </div>
        ) : (
          <div className='discord-node__display-mode'>
            <p>
              {messageContent
                ? `Mensaje: ${messageContent.slice(0, 30)}${messageContent.length > 30 ? '...' : ''}`
                : 'Doble clic para editar'}
            </p>
            {channelId && (
              <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
                Canal: {channelId}
              </p>
            )}
          </div>
        )}
      </div>
      <Handle
        type='source'
        position={Position.Bottom}
        id={`${id}-source`}
        isConnectable={isConnectable}
        className='discord-node__handle discord-node__handle--source'
      />
    </div>
  );
};

const arePropertiesEqual = (
  previousProperties: NodeProps<DiscordNodeData>,
  nextProperties: NodeProps<DiscordNodeData>,
) => {
  // Compare primitive props that change often
  if (
    previousProperties.selected !== nextProperties.selected ||
    previousProperties.isConnectable !== nextProperties.isConnectable
  ) {
    return false;
  }

  // Shallow compare relevant data properties
  const previousData = previousProperties.data;
  const nextData = nextProperties.data;

  return (
    previousData.label === nextData.label &&
    previousData.discordToken === nextData.discordToken &&
    previousData.channelId === nextData.channelId &&
    previousData.messageContent === nextData.messageContent
  );
};

export default memo(DiscordNode, arePropertiesEqual);
