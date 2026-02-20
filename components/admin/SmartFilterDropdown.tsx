'use client';

import { useState } from 'react';
import { Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SMART_FILTER_PRESETS, type SmartFilterPreset } from '@/lib/stock-utils';

interface SmartFilterDropdownProps {
  value: string | null;
  onChange: (presetId: string | null) => void;
}

export function SmartFilterDropdown({ value, onChange }: SmartFilterDropdownProps) {
  const activePreset = SMART_FILTER_PRESETS.find(p => p.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={value ? 'default' : 'outline'}
          size="sm"
          className="h-9"
        >
          <Filter className="h-4 w-4 mr-2" />
          {activePreset ? (
            <>
              {activePreset.icon} {activePreset.label}
            </>
          ) : (
            'តម្រងឆ្លាត'
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>តម្រងរហ័ស</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Clear filter option */}
        <DropdownMenuItem
          onClick={() => onChange(null)}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span>🔄</span>
              <div>
                <div className="font-medium">ផលិតផលទាំងអស់</div>
                <div className="text-xs text-muted-foreground">សម្អាតតម្រង</div>
              </div>
            </div>
            {!value && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Stock Level Filters */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          កម្រិតស្តុក
        </DropdownMenuLabel>
        {SMART_FILTER_PRESETS.filter(p => 
          ['out-of-stock', 'critical-stock', 'low-stock', 'healthy-stock'].includes(p.id)
        ).map((preset) => (
          <DropdownMenuItem
            key={preset.id}
            onClick={() => onChange(preset.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span>{preset.icon}</span>
                <div>
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {preset.description}
                  </div>
                </div>
              </div>
              {value === preset.id && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Performance Filters */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          ប្រសិទ្ធភាព
        </DropdownMenuLabel>
        {SMART_FILTER_PRESETS.filter(p => 
          ['low-profit', 'high-value', 'never-sold', 'best-sellers'].includes(p.id)
        ).map((preset) => (
          <DropdownMenuItem
            key={preset.id}
            onClick={() => onChange(preset.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span>{preset.icon}</span>
                <div>
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {preset.description}
                  </div>
                </div>
              </div>
              {value === preset.id && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
