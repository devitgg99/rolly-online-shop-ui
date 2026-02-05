import { useEffect } from 'react';

type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description?: string;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      
      for (const shortcut of shortcuts) {
        const {key, ctrl, cmd, shift, alt, callback } = shortcut;
        
        // Check modifier keys
        const ctrlOrCmdMatch = isMac 
          ? (cmd && event.metaKey) || (ctrl && event.ctrlKey)
          : ctrl && event.ctrlKey;
        
        const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
        const altMatch = alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === key.toLowerCase();
        
        // Check if all conditions match
        if (keyMatch && ctrlOrCmdMatch && shiftMatch && altMatch) {
          event.preventDefault();
          callback();
          break;
        }
        
        // Also handle Escape key specially (no modifiers needed)
        if (key === 'Escape' && event.key === 'Escape') {
          callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Helper to get shortcut display string
export function getShortcutString(shortcut: Omit<KeyboardShortcut, 'callback'>): string {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];
  
  if (shortcut.ctrl || shortcut.cmd) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}
