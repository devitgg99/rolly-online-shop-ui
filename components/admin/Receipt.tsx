'use client';

import { forwardRef } from 'react';
import type { Sale } from '@/types/sales.types';

interface ReceiptProps {
  sale: Sale;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, storeName = 'Rolly Shop', storeAddress, storePhone }, ref) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatCurrency = (amount: number) => {
      return `$${amount.toFixed(2)}`;
    };

    return (
      <div
        ref={ref}
        data-receipt-render="true"
        className="font-mono text-sm max-w-[320px] mx-auto"
        style={{
          width: '80mm', // Standard thermal printer width
          minHeight: '100mm',
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '24px',
        }}
      >
        {/* Store Header */}
        <div 
          className="text-center pb-3 mb-3"
          style={{ 
            borderBottom: '2px solid #000000',
          }}
        >
          <h1 className="text-2xl font-bold mb-1">{storeName}</h1>
          {storeAddress && <p className="text-xs">{storeAddress}</p>}
          {storePhone && <p className="text-xs">Tel: {storePhone}</p>}
        </div>

        {/* Receipt Info */}
        <div className="text-xs mb-3 space-y-1">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-bold">{sale.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(sale.createdAt)}</span>
          </div>
          {sale.customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{sale.customerName}</span>
            </div>
          )}
          {sale.customerPhone && (
            <div className="flex justify-between">
              <span>Phone:</span>
              <span>{sale.customerPhone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{sale.soldBy}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment:</span>
            <span className="font-bold">{sale.paymentMethod}</span>
          </div>
        </div>

        {/* Items */}
        <div 
          className="pt-2 mb-2"
          style={{ 
            borderTop: '2px dashed #000000',
          }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1 w-12">Qty</th>
                <th className="text-right py-1 w-16">Price</th>
                <th className="text-right py-1 w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #d1d5db' }}>
                  <td className="py-2 pr-2">
                    <div className="break-words">{item.productName}</div>
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right py-2 font-bold">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div 
          className="pt-2 space-y-1 text-sm"
          style={{ 
            borderTop: '2px solid #000000',
          }}
        >
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              {formatCurrency(
                sale.totalAmount + (sale.discountAmount || 0)
              )}
            </span>
          </div>
          {sale.discountAmount && sale.discountAmount > 0 && (
            <div className="flex justify-between" style={{ color: '#dc2626' }}>
              <span>Discount:</span>
              <span>-{formatCurrency(sale.discountAmount)}</span>
            </div>
          )}
          <div 
            className="flex justify-between font-bold text-lg pt-2"
            style={{ 
              borderTop: '1px solid #000000',
            }}
          >
            <span>TOTAL:</span>
            <span>{formatCurrency(sale.totalAmount)}</span>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div 
            className="mt-3 pt-2 text-xs"
            style={{ 
              borderTop: '1px dashed #000000',
            }}
          >
            <p className="font-bold mb-1">Notes:</p>
            <p className="break-words">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div 
          className="text-center mt-6 pt-3 text-xs space-y-1"
          style={{ 
            borderTop: '2px solid #000000',
          }}
        >
          <p className="font-bold">Thank You for Your Purchase!</p>
          <p>Please Come Again</p>
          <div className="mt-4 text-[10px]" style={{ color: '#4b5563' }}>
            <p>Items: {sale.items.length}</p>
            <p>Saved: {formatCurrency(sale.discountAmount || 0)}</p>
          </div>
        </div>

        {/* Barcode placeholder */}
        <div className="mt-4 flex justify-center">
          <div 
            className="px-4 py-2 font-mono text-xs"
            style={{ 
              border: '2px solid #000000',
            }}
          >
            {sale.id.slice(0, 12).toUpperCase()}
          </div>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';

export default Receipt;
