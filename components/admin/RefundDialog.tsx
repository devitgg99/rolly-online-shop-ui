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
      toast.error('សូមជ្រើសរើសយ៉ាងហោចណាស់មួយមុខទំនិញដើម្បីសង');
      return;
    }

    // Validate all refund items have reasons
    const missingReasons = itemsToRefund.filter(item => !item.reason.trim());
    if (missingReasons.length > 0) {
      toast.error('សូមផ្តល់មូលហេតុសម្រាប់មុខទំនិញទាំងអស់ដែលត្រូវសង');
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
        toast.success('ការសងប្រាក់វិញបានជោគជ័យ!');
        onRefundCreated?.();
        onOpenChange(false);
      } else {
        toast.error(response.message || 'បរាជ័យក្នុងការដំណើរការសងប្រាក់វិញ');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមព្យាយាមម្តងទៀត។');
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
            ដំណើរការសងប្រាក់វិញ
          </DialogTitle>
          <DialogDescription>
            ការលក់ #{sale.id.slice(0, 8)} • {sale.customerName || 'អតិថិជនដើរចូល'}
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
                    ការសងប្រាក់វិញនឹងស្តារបរិមាណស្តុកឡើងវិញ
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                    ជ្រើសរើសមុខទំនិញដើម្បីសង និងបញ្ជាក់ចំនួន។ ស្តុកនឹងត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិ។
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items to Refund */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">មុខទំនិញសម្រាប់សង</Label>
            {refundItems.map((item) => (
              <Card key={item.productId} className="border-2">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        អតិបរមា: {item.maxQuantity} ឯកតា × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>ចំនួនដែលត្រូវសង</Label>
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
                      <Label>មូលហេតុ *</Label>
                      <Input
                        value={item.reason}
                        onChange={(e) => handleReasonChange(item.productId, e.target.value)}
                        placeholder="ឧ. ខូចខាត, មុខទំនិញខុស"
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
            <Label>វិធីសងប្រាក់ *</Label>
            <Select value={refundMethod} onValueChange={(v: any) => setRefundMethod(v)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    សងសាច់ប្រាក់
                  </div>
                </SelectItem>
                <SelectItem value="CARD">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    សងតាមកាត
                  </div>
                </SelectItem>
                <SelectItem value="STORE_CREDIT">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    ឥណទានហាង
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>កំណត់ចំណាំបន្ថែម (ស្រេចចិត្ត)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ព័ត៌មានបន្ថែមអំពីការសងប្រាក់វិញនេះ..."
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
                    <span className="text-muted-foreground">មុខទំនិញសម្រាប់សង:</span>
                    <span className="font-medium">
                      {refundItems.filter(i => i.quantity > 0).length} មុខ
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold">ចំនួនសងសរុប:</span>
                    <span className="font-bold text-primary">
                      ${totalRefundAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">វិធីសងប្រាក់:</span>
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
            បោះបង់
          </Button>
          <Button
            onClick={handleSubmitRefund}
            disabled={isLoading || !hasItemsToRefund}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                កំពុងដំណើរការ...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                ដំណើរការសងប្រាក់
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
