'use client';

import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getShortcutString } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcutsDialog() {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const shortcuts = [
    {
      category: 'General',
      items: [
        { keys: { key: 'n', ctrl: true, cmd: true }, description: 'New Product' },
        { keys: { key: 'f', ctrl: true, cmd: true }, description: 'Focus Search' },
        { keys: { key: 'k', ctrl: true, cmd: true }, description: 'Command Palette' },
        { keys: { key: 'r', ctrl: true, cmd: true }, description: 'Refresh Data' },
        { keys: { key: 'Escape' }, description: 'Close Dialog / Clear Search' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: { key: 'e', ctrl: true, cmd: true }, description: 'Export Products' },
        { keys: { key: 's', ctrl: true, cmd: true }, description: 'Save Current Form' },
        { keys: { key: 'd', ctrl: true, cmd: true }, description: 'Duplicate Selected' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: { key: '↑' }, description: 'Previous Product' },
        { keys: { key: '↓' }, description: 'Next Product' },
        { keys: { key: 'Tab' }, description: 'Next Field' },
        { keys: { key: 'Tab', shift: true }, description: 'Previous Field' },
      ]
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Keyboard className="h-4 w-4 mr-2" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⌨️ Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent"
                  >
                    <span className="text-sm">{item.description}</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                      {getShortcutString(item.keys)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {isMac ? (
                <>
                  <strong>⌘ Command</strong> and <strong>⌥ Option</strong> keys are used on Mac
                </>
              ) : (
                <>
                  <strong>Ctrl</strong> and <strong>Alt</strong> keys are used on Windows/Linux
                </>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
