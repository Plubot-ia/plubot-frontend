// src/components/onboarding/ui/ContextMenu.tsx
// STUB: Implementación completa requerida
import React from 'react';

// Interfaz base para propiedades comunes (la mayoría opcionales)
interface ContextMenuBaseItem {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  shortcut?: string;
  variant?: 'default' | 'destructive';
  badge?: string;
}

// Interfaz para ítems que son acciones clickables
export interface ContextMenuActionItem extends ContextMenuBaseItem {
  type?: undefined; // Opcional, o explícitamente no 'separator'
  label: string; // Requerido para ítems de acción
  onClick: () => void; // Requerido para ítems de acción
}

// Interfaz para ítems que son separadores
export interface ContextMenuSeparatorItem {
  type: 'separator';
  // Los separadores no tienen label, onClick, icon, etc.
  label?: undefined;
  icon?: undefined;
  onClick?: undefined;
  disabled?: undefined;
  shortcut?: undefined;
  variant?: undefined;
  badge?: undefined;
}

// Tipo de unión discriminada
export type ContextMenuItem = ContextMenuActionItem | ContextMenuSeparatorItem;

interface ContextMenuProperties {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onClose: () => void;
  nodeId?: string; // Añadido porque lo vi en EndNode.tsx, aunque no se usa en el stub
}

export const ContextMenu = ({
  items,
  position,
  onClose,
  nodeId,
}: ContextMenuProperties): React.ReactElement | null => {
  if (!position) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        border: '1px solid #ccc',
        background: 'white',
        padding: '8px',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        borderRadius: '4px',
      }}
      // Evitar que el click se propague y cierre inmediatamente por otros handlers
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      // Evitar que aparezca el menú contextual nativo sobre nuestro menú
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role='menu'
      tabIndex={-1}
    >
      {/* <p style={{
        margin: 0, padding: '0 0 4px 0', fontSize: '10px', color: '#777',
        borderBottom: '1px solid #eee', marginBottom: '4px'
      }}>Node: {nodeId}</p> */}
      {items.map((item, index) => {
        if (item.type === 'separator') {
          const prevLabel =
            items[index - 1] && 'label' in items[index - 1] && items[index - 1].label
              ? items[index - 1].label
              : '';
          const nextLabel =
            items[index + 1] && 'label' in items[index + 1] && items[index + 1].label
              ? items[index + 1].label
              : '';
          return (
            <hr
              key={`sep-between-${prevLabel}-and-${nextLabel}-${nodeId ?? 'global'}`}
              style={{ margin: '4px 0', borderColor: '#eee' }}
            />
          );
        }
        // Ahora TypeScript sabe que si no es 'separator', es un ContextMenuActionItem
        return (
          <div
            key={`${item.label}-${nodeId ?? 'global'}`}
            style={{
              padding: '6px 8px',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: item.variant === 'destructive' ? '#dc3545' : '#333',
              borderRadius: '3px',
            }}
            onClick={(e) => {
              // Prevenir que el click en el item cierre el menú a través del div padre
              e.stopPropagation();
              if (!item.disabled && item.onClick) {
                item.onClick();
                onClose(); // Cerrar el menú después de la acción
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!item.disabled && item.onClick) {
                  item.onClick();
                  onClose();
                }
              }
            }}
            role='menuitem'
            tabIndex={0}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  item.variant === 'destructive' ? '#f8d7da' : '#f0f0f0';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
            }}
          >
            {item.icon && (
              <item.icon style={{ marginRight: '8px', width: '16px', height: '16px' }} />
            )}
            <span style={{ flexGrow: 1 }}>{item.label}</span>
            {item.shortcut && (
              <span
                style={{
                  fontSize: '0.85em',
                  color: '#777',
                  marginLeft: '12px',
                }}
              >
                ({item.shortcut})
              </span>
            )}
            {item.badge && (
              <span
                style={{
                  fontSize: '0.8em',
                  background: item.variant === 'destructive' ? '#dc3545' : '#007bff',
                  color: 'white',
                  padding: '2px 5px',
                  borderRadius: '8px',
                  marginLeft: '8px',
                  fontWeight: 'bold',
                }}
              >
                {item.badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ContextMenu;
