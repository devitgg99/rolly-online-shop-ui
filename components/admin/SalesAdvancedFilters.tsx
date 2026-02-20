'use client';

import { useState } from 'react';
import { Filter, X, Calendar, DollarSign, CreditCard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'E_WALLET' | 'BANK_TRANSFER' | 'COD' | 'ALL';
  minAmount?: string;
  maxAmount?: string;
  customerName?: string;
  sortBy?: 'date' | 'amount' | 'profit';
  direction?: 'asc' | 'desc';
}

interface SalesAdvancedFiltersProps {
  filters: SalesFilters;
  onFiltersChange: (filters: SalesFilters) => void;
  onApply: () => void;
}

export function SalesAdvancedFilters({ 
  filters, 
  onFiltersChange,
  onApply 
}: SalesAdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const updateFilter = (key: keyof SalesFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      paymentMethod: 'ALL',
      sortBy: 'date',
      direction: 'desc',
    });
  };

  const setQuickFilter = (type: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
    switch (type) {
      case 'today':
        updateFilter('startDate', today);
        updateFilter('endDate', today);
        break;
      case 'yesterday':
        updateFilter('startDate', yesterday);
        updateFilter('endDate', yesterday);
        break;
      case 'week':
        updateFilter('startDate', lastWeek);
        updateFilter('endDate', today);
        break;
      case 'month':
        updateFilter('startDate', lastMonth);
        updateFilter('endDate', today);
        break;
      case 'all':
        updateFilter('startDate', undefined);
        updateFilter('endDate', undefined);
        break;
    }
    onApply();
  };

  const activeFiltersCount = [
    filters.startDate,
    filters.endDate,
    filters.paymentMethod && filters.paymentMethod !== 'ALL',
    filters.minAmount,
    filters.maxAmount,
    filters.customerName,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            តម្រង និងស្វែងរក
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} សកម្ម</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                សម្អាតទាំងអស់
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'លាក់' : 'បង្ហាញ'}តម្រង
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter('today')}
            className={cn(
              filters.startDate === today && filters.endDate === today && 'bg-primary/10'
            )}
          >
            ថ្ងៃនេះ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter('yesterday')}
            className={cn(
              filters.startDate === yesterday && filters.endDate === yesterday && 'bg-primary/10'
            )}
          >
            ម្សិលមិញ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter('week')}
            className={cn(
              filters.startDate === lastWeek && filters.endDate === today && 'bg-primary/10'
            )}
          >
            សប្តាហ៍នេះ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter('month')}
            className={cn(
              filters.startDate === lastMonth && filters.endDate === today && 'bg-primary/10'
            )}
          >
            ខែនេះ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter('all')}
            className={cn(
              !filters.startDate && !filters.endDate && 'bg-primary/10'
            )}
          >
            គ្រប់ពេល
          </Button>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid gap-4 pt-4 border-t">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  ថ្ងៃចាប់ផ្តើម
                </Label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
                  max={filters.endDate || today}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  ថ្ងៃបញ្ចប់
                </Label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
                  min={filters.startDate}
                  max={today}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                វិធីបង់ប្រាក់
              </Label>
              <Select
                value={filters.paymentMethod || 'ALL'}
                onValueChange={(v) => updateFilter('paymentMethod', v === 'ALL' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">វិធីទាំងអស់</SelectItem>
                  <SelectItem value="CASH">💵 សាច់ប្រាក់</SelectItem>
                  <SelectItem value="CARD">💳 កាត</SelectItem>
                  <SelectItem value="E_WALLET">📱 កាបូបអេឡិចត្រូនិក</SelectItem>
                  <SelectItem value="BANK_TRANSFER">🏦 ផ្ទេរធនាគារ</SelectItem>
                  <SelectItem value="COD">📦 បង់ប្រាក់ពេលទទួល</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ចំនួនអប្បបរមា
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', e.target.value || undefined)}
                  placeholder="$0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ចំនួនអតិបរមា
                </Label>
                <Input
                  type="number"
                  min={filters.minAmount || "0"}
                  step="0.01"
                  value={filters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', e.target.value || undefined)}
                  placeholder="$999.99"
                />
              </div>
            </div>

            {/* Customer Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Search className="w-3 h-3" />
                ឈ្មោះអតិថិជន
              </Label>
              <Input
                value={filters.customerName || ''}
                onChange={(e) => updateFilter('customerName', e.target.value || undefined)}
                placeholder="ស្វែងរកតាមឈ្មោះអតិថិជន..."
              />
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>តម្រៀបតាម</Label>
                <Select
                  value={filters.sortBy || 'date'}
                  onValueChange={(v: any) => updateFilter('sortBy', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">កាលបរិច្ឆេទ</SelectItem>
                    <SelectItem value="amount">ចំនួន</SelectItem>
                    <SelectItem value="profit">ចំណេញ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ទិសដៅ</Label>
                <Select
                  value={filters.direction || 'desc'}
                  onValueChange={(v: any) => updateFilter('direction', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">ឡើង</SelectItem>
                    <SelectItem value="desc">ចុះ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={onApply} className="w-full">
              អនុវត្តតម្រង
            </Button>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && !isExpanded && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            <span className="text-sm text-muted-foreground">សកម្ម:</span>
            {filters.startDate && (
              <Badge variant="secondary" className="gap-1">
                ពី {new Date(filters.startDate).toLocaleDateString()}
                <button onClick={() => updateFilter('startDate', undefined)}>
                  <X className="w-3 h-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.endDate && (
              <Badge variant="secondary" className="gap-1">
                ដល់ {new Date(filters.endDate).toLocaleDateString()}
                <button onClick={() => updateFilter('endDate', undefined)}>
                  <X className="w-3 h-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.paymentMethod && filters.paymentMethod !== 'ALL' && (
              <Badge variant="secondary" className="gap-1">
                {filters.paymentMethod}
                <button onClick={() => updateFilter('paymentMethod', 'ALL')}>
                  <X className="w-3 h-3 ml-1" />
                </button>
              </Badge>
            )}
            {filters.customerName && (
              <Badge variant="secondary" className="gap-1">
                អតិថិជន: {filters.customerName}
                <button onClick={() => updateFilter('customerName', undefined)}>
                  <X className="w-3 h-3 ml-1" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
