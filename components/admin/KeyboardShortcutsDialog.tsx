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
      category: 'ទូទៅ',
      items: [
        { keys: { key: 'n', ctrl: true, cmd: true }, description: 'ផលិតផលថ្មី' },
        { keys: { key: 'f', ctrl: true, cmd: true }, description: 'ផ្តោតស្វែងរក' },
        { keys: { key: 'k', ctrl: true, cmd: true }, description: 'ប៉ាណែលពាក្យបញ្ជា' },
        { keys: { key: 'r', ctrl: true, cmd: true }, description: 'ផ្ទុកទិន្នន័យឡើងវិញ' },
        { keys: { key: 'Escape' }, description: 'បិទប្រអប់ / សម្អាតការស្វែងរក' },
      ]
    },
    {
      category: 'សកម្មភាព',
      items: [
        { keys: { key: 'e', ctrl: true, cmd: true }, description: 'នាំចេញផលិតផល' },
        { keys: { key: 's', ctrl: true, cmd: true }, description: 'រក្សាទុកទម្រង់បច្ចុប្បន្ន' },
        { keys: { key: 'd', ctrl: true, cmd: true }, description: 'ចម្លងអ្វីដែលបានជ្រើស' },
      ]
    },
    {
      category: 'ការរុករក',
      items: [
        { keys: { key: '↑' }, description: 'ផលិតផលមុន' },
        { keys: { key: '↓' }, description: 'ផលិតផលបន្ទាប់' },
        { keys: { key: 'Tab' }, description: 'វាលបន្ទាប់' },
        { keys: { key: 'Tab', shift: true }, description: 'វាលមុន' },
      ]
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Keyboard className="h-4 w-4 mr-2" />
          ផ្លូវកាត់
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⌨️ ផ្លូវកាត់ក្តារចុច</DialogTitle>
          <DialogDescription>
            បង្កើនល្បឿនការងាររបស់អ្នកជាមួយផ្លូវកាត់ទាំងនេះ
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
                  ប៊ូតុង <strong>⌘ Command</strong> និង <strong>⌥ Option</strong> ត្រូវបានប្រើនៅលើ Mac
                </>
              ) : (
                <>
                  ប៊ូតុង <strong>Ctrl</strong> និង <strong>Alt</strong> ត្រូវបានប្រើនៅលើ Windows/Linux
                </>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
