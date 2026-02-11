'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Undo2, 
  AlertCircle,
  Check,
  X,
  Loader2,
  Wallet,
  CreditCard
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createRefundAction } from '@/actions/sales/sales.action';
import type { Sale, RefundItemRequest } from '@/types/sales.types';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onRefundCreated?: () => void;
}

interface RefundItem extends RefundItemRequest {
  productName: string;
  unitPrice: number;
  maxQuantity: number;
}

export function RefundDialog({
  open,
  onOpenChange,
  sale,
  onRefundCreated,
}: RefundDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'CARD' | 'STORE_CREDIT'>('CASH');
  const [notes, setNotes] = useState('');
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);

  useEffect(() => {
    if (open && sale) {
      // Initialize refund items from sale items
      const items: RefundItem[] = sale.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: 0, // Default to 0, user must specify
        reason: '',
        unitPrice: item.unitPrice,
        maxQuantity: item.quantity,
      }));
      setRefundItems(items);
      setNotes('');
      setRefundMethod('CASH');
    }
  }, [open, sale]);

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setRefundItems(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          : item
      )
    );
  };

  const handleReasonChange = (productId: string, reason: string) => {
    setRefundItems(items =>
      items.map(item =>
        item.productId === productId ? { ...item, reason } : item
      )
    );
  };

  const totalRefundAmount = refundItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const hasItemsToRefund = refundItems.some(item => item.quantity > 0);

  const handleSubmitRefund = async () => {
    if (!sale || !session?.backendToken) return;

    const itemsToRefund = refundItems.filter(item => item.quantity > 0);

    if (itemsToRefund.length === 0) {
      toast.error('Please select at least one item to refund');
      return;
    }

    // Validate all refund items have reasons
    const missingReasons = itemsToRefund.filter(item => !item.reason.trim());
    if (missingReasons.length > 0) {
      toast.error('Please provide a reason for all items being refunded');
      return;
    }

    setIsLoading(true);
    try {
      const response = await createRefundAction(
        sale.id,
        {
          items: itemsToRefund.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            reason: item.reason,
          })),
          refundMethod,
          notes: notes || undefined,
        }
      );

      if (response.success) {
        toast.success('Refund processed successfully!');
        onRefundCreated?.();
        onOpenChange(false);
      } else {
        toast.error(response.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Cannot connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="w-5 h-5" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Sale #{sale.id.slice(0, 8)} • {sale.customerName || 'Walk-in Customer'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Alert */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Refund will restore stock quantities
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                    Select items to refund and specify quantities. Stock will be automatically updated.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items to Refund */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Items to Refund</Label>
            {refundItems.map((item) => (
              <Card key={item.productId} className="border-2">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Max: {item.maxQuantity} units × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Quantity to Refund</Label>
                      <Input
                        type="number"
                        min="0"
                        max={item.maxQuantity}
                        value={item.quantity || ''}
                        onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                        placeholder="0"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason *</Label>
                      <Input
                        value={item.reason}
                        onChange={(e) => handleReasonChange(item.productId, e.target.value)}
                        placeholder="e.g., Damaged, Wrong item"
                        disabled={isLoading || item.quantity === 0}
                        required={item.quantity > 0}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Refund Method */}
          <div className="space-y-2">
            <Label>Refund Method *</Label>
            <Select value={refundMethod} onValueChange={(v: any) => setRefundMethod(v)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Cash Refund
                  </div>
                </SelectItem>
                <SelectItem value="CARD">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Card Refund
                  </div>
                </SelectItem>
                <SelectItem value="STORE_CREDIT">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Store Credit
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this refund..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Refund Summary */}
          {hasItemsToRefund && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Items to Refund:</span>
                    <span className="font-medium">
                      {refundItems.filter(i => i.quantity > 0).length} item(s)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold">Total Refund Amount:</span>
                    <span className="font-bold text-primary">
                      ${totalRefundAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Refund Method:</span>
                    <Badge variant="outline">{refundMethod.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRefund}
            disabled={isLoading || !hasItemsToRefund}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Process Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
