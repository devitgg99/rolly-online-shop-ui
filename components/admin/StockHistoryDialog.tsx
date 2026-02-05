'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  RotateCcw,
  ShoppingCart,
  Undo2,
  FileEdit,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchStockHistory, adjustProductStock } from '@/services/products.service';
import type { StockHistoryEntry } from '@/types/product.types';
import { cn } from '@/lib/utils';

interface StockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  currentStock: number;
  onStockAdjusted?: () => void;
}

const adjustmentTypeConfig = {
  SALE: { icon: ShoppingCart, label: 'Sale', color: 'text-green-600 bg-green-50' },
  RESTOCK: { icon: TrendingUp, label: 'Restock', color: 'text-blue-600 bg-blue-50' },
  DAMAGE: { icon: AlertTriangle, label: 'Damage', color: 'text-red-600 bg-red-50' },
  MANUAL: { icon: FileEdit, label: 'Manual', color: 'text-purple-600 bg-purple-50' },
  RETURN: { icon: Undo2, label: 'Return', color: 'text-orange-600 bg-orange-50' },
  CORRECTION: { icon: RotateCcw, label: 'Correction', color: 'text-gray-600 bg-gray-50' },
};

export function StockHistoryDialog({
  open,
  onOpenChange,
  productId,
  productName,
  currentStock,
  onStockAdjusted,
}: StockHistoryDialogProps) {
  const { data: session } = useSession();
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment: '',
    adjustmentType: 'MANUAL' as const,
    reason: '',
  });

  useEffect(() => {
    if (open && productId) {
      loadHistory();
    }
  }, [open, productId, page]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetchStockHistory(
        productId,
        page,
        20,
        undefined,
        undefined,
        session?.backendToken
      );

      if (response.success && response.data) {
        setHistory(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        toast.error(response.message || 'Failed to load stock history');
      }
    } catch (error) {
      console.error('Error loading stock history:', error);
      toast.error('Failed to load stock history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustmentData.adjustment) {
      toast.error('Please enter an adjustment amount');
      return;
    }

    const adjustment = parseInt(adjustmentData.adjustment);
    if (isNaN(adjustment) || adjustment === 0) {
      toast.error('Please enter a valid non-zero adjustment');
      return;
    }

    if (!session?.backendToken) {
      toast.error('Authentication required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await adjustProductStock(
        productId,
        {
          adjustment,
          adjustmentType: adjustmentData.adjustmentType,
          reason: adjustmentData.reason || undefined,
        },
        session.backendToken
      );

      if (response.success) {
        toast.success('Stock adjusted successfully!');
        setShowAdjustForm(false);
        setAdjustmentData({ adjustment: '', adjustmentType: 'MANUAL', reason: '' });
        loadHistory();
        onStockAdjusted?.();
      } else {
        toast.error(response.message || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Stock History - {productName}
          </DialogTitle>
          <DialogDescription>
            Current Stock: <span className="font-bold">{currentStock}</span> units
            {totalElements > 0 && ` • ${totalElements} total changes`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Adjust Stock Form */}
          {showAdjustForm ? (
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Adjust Stock</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAdjustForm(false);
                      setAdjustmentData({ adjustment: '', adjustmentType: 'MANUAL', reason: '' });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Adjustment Amount *</Label>
                    <Input
                      type="number"
                      placeholder="Enter +/- amount (e.g., -5 or +10)"
                      value={adjustmentData.adjustment}
                      onChange={(e) =>
                        setAdjustmentData({ ...adjustmentData, adjustment: e.target.value })
                      }
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Negative to decrease, positive to increase
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Adjustment Type *</Label>
                    <Select
                      value={adjustmentData.adjustmentType}
                      onValueChange={(value: any) =>
                        setAdjustmentData({ ...adjustmentData, adjustmentType: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual Adjustment</SelectItem>
                        <SelectItem value="DAMAGE">Damage/Loss</SelectItem>
                        <SelectItem value="CORRECTION">Stock Correction</SelectItem>
                        <SelectItem value="RESTOCK">Restock</SelectItem>
                        <SelectItem value="RETURN">Customer Return</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Input
                    placeholder="Enter reason for adjustment..."
                    value={adjustmentData.reason}
                    onChange={(e) =>
                      setAdjustmentData({ ...adjustmentData, reason: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAdjustForm(false);
                      setAdjustmentData({ adjustment: '', adjustmentType: 'MANUAL', reason: '' });
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAdjustStock} disabled={isLoading}>
                    {isLoading ? 'Adjusting...' : 'Adjust Stock'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setShowAdjustForm(true)}
              className="w-full"
              variant="outline"
            >
              <Package className="w-4 h-4 mr-2" />
              Adjust Stock
            </Button>
          )}

          {/* History List */}
          {isLoading && history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No stock changes recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => {
                const config = adjustmentTypeConfig[entry.adjustmentType];
                const Icon = config.icon;
                const isIncrease = entry.adjustment > 0;

                return (
                  <Card key={entry.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn('p-2 rounded-lg', config.color)}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={config.color}>
                                  {config.label}
                                </Badge>
                                <span
                                  className={cn(
                                    'font-semibold',
                                    isIncrease ? 'text-green-600' : 'text-red-600'
                                  )}
                                >
                                  {isIncrease ? '+' : ''}
                                  {entry.adjustment} units
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {entry.previousStock} → {entry.newStock}
                              </p>
                            </div>

                            <div className="text-right text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs">
                                {new Date(entry.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          {entry.reason && (
                            <p className="text-sm mt-2 text-muted-foreground italic">
                              {entry.reason}
                            </p>
                          )}

                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {entry.updatedByName}
                            {entry.referenceType && (
                              <>
                                <span className="mx-1">•</span>
                                <span>{entry.referenceType}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
