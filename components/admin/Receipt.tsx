'use client';

import { forwardRef } from 'react';
import type { Sale } from '@/types/sales.types';

interface ReceiptProps {
  sale: Sale;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

// All inline styles -- no Tailwind classes -- so html2canvas renders correctly
const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, storeName = 'Rolly Shop', storeAddress, storePhone }, ref) => {
    const fmt = (n: number) => `$${n.toFixed(2)}`;

    const fmtDate = (s: string) =>
      new Date(s).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    return (
      <div
        ref={ref}
        data-receipt-render="true"
        style={{
          width: '320px',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: "'Courier New', Consolas, monospace",
          fontSize: '13px',
          lineHeight: '1.5',
          padding: '28px 24px',
        }}
      >
        {/* ── Store Header ── */}
        <div
          style={{
            textAlign: 'center',
            paddingBottom: '14px',
            marginBottom: '14px',
            borderBottom: '2px solid #000',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            {storeName}
          </div>
          {storeAddress && (
            <div style={{ fontSize: '11px', color: '#374151' }}>{storeAddress}</div>
          )}
          {storePhone && (
            <div style={{ fontSize: '11px', color: '#374151' }}>Tel: {storePhone}</div>
          )}
        </div>

        {/* ── Receipt Info ── */}
        <div style={{ fontSize: '12px', marginBottom: '14px' }}>
          <Row label="Receipt #" value={sale.id.slice(0, 8).toUpperCase()} />
          <Row label="Date" value={fmtDate(sale.createdAt)} />
          {sale.customerName && <Row label="Customer" value={sale.customerName} />}
          {sale.customerPhone && <Row label="Phone" value={sale.customerPhone} />}
          <Row label="Cashier" value={sale.soldBy} />
          <Row label="Payment" value={sale.paymentMethod} bold />
        </div>

        {/* ── Dashed Separator ── */}
        <div style={{ borderTop: '2px dashed #000', marginBottom: '6px' }} />

        {/* ── Items Table ── */}
        <table
          style={{
            width: '100%',
            fontSize: '12px',
            borderCollapse: 'collapse',
            marginBottom: '6px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 700 }}>Item</th>
              <th style={{ textAlign: 'center', padding: '6px 0', fontWeight: 700, width: '36px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700, width: '56px' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700, width: '64px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #d1d5db' }}>
                <td style={{ padding: '8px 6px 8px 0', wordBreak: 'break-word', verticalAlign: 'top' }}>
                  {item.productName}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'center', verticalAlign: 'top' }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'right', verticalAlign: 'top' }}>
                  {fmt(item.unitPrice)}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>
                  {fmt(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals ── */}
        <div
          style={{
            borderTop: '2px solid #000',
            paddingTop: '10px',
            fontSize: '13px',
          }}
        >
          {sale.discountAmount != null && sale.discountAmount > 0 && (
            <Row label="Discount" value={`-${fmt(sale.discountAmount)}`} color="#dc2626" />
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '18px',
              marginTop: '4px',
            }}
          >
            <span>TOTAL</span>
            <span>{fmt(sale.totalAmount)}</span>
          </div>
        </div>

        {/* ── Notes ── */}
        {sale.notes && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: '1px dashed #000',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Notes:</div>
            <div style={{ wordBreak: 'break-word' }}>{sale.notes}</div>
          </div>
        )}

        {/* ── Footer ── */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '14px',
            borderTop: '2px solid #000',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>
            Thank You for Your Purchase!
          </div>
          <div style={{ color: '#374151' }}>Please Come Again</div>

          <div style={{ marginTop: '14px', fontSize: '11px', color: '#6b7280' }}>
            <div>Items: {sale.items.length}</div>
            <div>Saved: {fmt(sale.discountAmount || 0)}</div>
          </div>
        </div>

        {/* ── Receipt ID Badge ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px' }}>
          <div
            style={{
              border: '2px solid #000',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            {sale.id.slice(0, 12).toUpperCase()}
          </div>
        </div>
      </div>
    );
  }
);

/* ── Helper row component ── */
function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 0',
        color: color || '#000000',
      }}
    >
      <span>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

Receipt.displayName = 'Receipt';

export default Receipt;
