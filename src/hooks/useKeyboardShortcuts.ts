// src/hooks/useKeyboardShortcuts.ts
// Cross-platform keyboard-shortcut hook (replaces previous stub)
import { useEffect, useMemo, useCallback } from 'react';

/**
 * Map of keyboard shortcut strings to handler functions.
 * Example keys: 'mod+z', 'mod+shift+z', 'mod+alt+z', 'delete', 'f2'
 */
export interface ShortcutMap {
  [keyCombination: string]: (event: KeyboardEvent) => void;
}

interface ParsedShortcut {
  key: string;
  requiresMod: boolean; // ctrl ⌘
  requiresShift: boolean;
  requiresAlt: boolean;
}

/**
 * Parse a shortcut pattern like `mod+shift+z` into an object easier to match.
 */
function parseShortcut(pattern: string): ParsedShortcut {
  const parts = pattern.toLowerCase().split('+');
  const key = parts.pop() ?? '';
  return {
    key,
    requiresMod:
      parts.includes('mod') ||
      parts.includes('ctrl') ||
      parts.includes('cmd') ||
      parts.includes('meta'),
    requiresShift: parts.includes('shift'),
    requiresAlt: parts.includes('alt') || parts.includes('option'),
  };
}

function eventMatches(event: KeyboardEvent, spec: ParsedShortcut): boolean {
  const eventKey = (event.key ?? '').toLowerCase();
  if (eventKey !== spec.key) return false;

  const modulePressed = event.ctrlKey || event.metaKey;
  if (spec.requiresMod !== modulePressed) return false;

  if (spec.requiresShift !== event.shiftKey) return false;
  if (spec.requiresAlt !== event.altKey) return false;

  return true;
}

/**
 * React hook to attach global keyboard shortcuts.
 *
 * @param shortcuts Map of key patterns to handlers. The hook will update if this object's reference changes.
 * @param active    Enable/disable the shortcuts.
 */
export const useKeyboardShortcuts = (shortcuts: ShortcutMap, active = true): void => {
  // Pre-parse the shortcuts only when `shortcuts` changes
  const parsedShortcuts = useMemo(() => {
    return Object.entries(shortcuts).map(([pattern, handler]) => ({
      spec: parseShortcut(pattern),
      handler,
    }));
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if focus is on input/textarea/contentEditable
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      for (const { spec, handler } of parsedShortcuts) {
        if (eventMatches(event, spec)) {
          try {
            handler(event);
          } catch {
            // El error se ignora intencionadamente para evitar que un atajo defectuoso
            // rompa todos los demás atajos de teclado.
          }
          break; // stop on first match
        }
      }
    },
    [parsedShortcuts],
  );

  useEffect(() => {
    if (!active) return;

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [active, handleKeyDown]);
};

export default useKeyboardShortcuts;
