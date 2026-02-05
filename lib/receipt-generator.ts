/**
 * Enhanced Receipt Generator
 * Creates clean, modern PDF receipts with minimal lines and better spacing
 */

import jsPDF from 'jspdf';
import type { Sale, SaleItem } from '@/types/sales.types';

interface ReceiptConfig {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeTaxId?: string;
  logoUrl?: string;
}

const DEFAULT_CONFIG: ReceiptConfig = {
  storeName: 'Rolly Online Shop',
  storeAddress: '123 Business Street, City, Country',
  storePhone: '+1 234 567 8900',
  storeEmail: 'info@rollyshop.com',
};

/**
 * Generate a clean, modern receipt PDF
 */
export async function generateEnhancedReceipt(
  sale: Sale,
  config: Partial<ReceiptConfig> = {}
): Promise<Blob> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create PDF - A4 size (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Colors
  const primaryColor = '#2563eb'; // Blue
  const darkGray = '#1f2937';
  const lightGray = '#6b7280';
  const bgGray = '#f3f4f6';

  // ==========================================
  // HEADER SECTION - Store Info
  // ==========================================
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Store Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(finalConfig.storeName, pageWidth / 2, yPos + 15, { align: 'center' });

  // Store Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  yPos += 22;
  
  if (finalConfig.storeAddress) {
    doc.text(finalConfig.storeAddress, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
  }
  
  const contactInfo = [];
  if (finalConfig.storePhone) contactInfo.push(finalConfig.storePhone);
  if (finalConfig.storeEmail) contactInfo.push(finalConfig.storeEmail);
  
  if (contactInfo.length > 0) {
    doc.text(contactInfo.join(' • '), pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
  }

  if (finalConfig.storeTaxId) {
    doc.text(`Tax ID: ${finalConfig.storeTaxId}`, pageWidth / 2, yPos, { align: 'center' });
  }

  // ==========================================
  // RECEIPT TITLE
  // ==========================================
  yPos = 60;
  doc.setTextColor(darkGray);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', pageWidth / 2, yPos, { align: 'center' });

  // ==========================================
  // TRANSACTION INFO - Clean Card Style
  // ==========================================
  yPos += 12;
  
  // Light background card
  doc.setFillColor(bgGray);
  doc.roundedRect(margin, yPos, contentWidth, 28, 3, 3, 'F');
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  const leftCol = margin + 5;
  const rightCol = pageWidth / 2 + 5;
  
  doc.text('Receipt No:', leftCol, yPos);
  doc.text('Date & Time:', leftCol, yPos + 5);
  doc.text('Customer:', leftCol, yPos + 10);
  doc.text('Payment Method:', leftCol, yPos + 15);
  
  // Right column - Values
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  const valueLeftCol = leftCol + 35;
  
  doc.text(`#${sale.id.slice(0, 8).toUpperCase()}`, valueLeftCol, yPos);
  doc.text(new Date(sale.createdAt).toLocaleString(), valueLeftCol, yPos + 5);
  doc.text(sale.customerName || 'Walk-in Customer', valueLeftCol, yPos + 10);
  doc.text(sale.paymentMethod, valueLeftCol, yPos + 15);

  // ==========================================
  // ITEMS TABLE - Minimal Design
  // ==========================================
  yPos += 28;
  
  // Table header
  doc.setFillColor(darkGray);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  yPos += 5.5;
  
  doc.text('Item', margin + 3, yPos);
  doc.text('Qty', pageWidth - margin - 50, yPos, { align: 'right' });
  doc.text('Price', pageWidth - margin - 35, yPos, { align: 'right' });
  doc.text('Total', pageWidth - margin - 3, yPos, { align: 'right' });

  // Table items
  yPos += 5;
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'normal');
  
  sale.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos - 3, contentWidth, 7, 'F');
    }
    
    yPos += 1;
    
    // Item name (truncate if too long)
    const itemName = item.productName.length > 40 
      ? item.productName.substring(0, 37) + '...' 
      : item.productName;
    doc.text(itemName, margin + 3, yPos);
    
    // Quantity
    doc.text(item.quantity.toString(), pageWidth - margin - 50, yPos, { align: 'right' });
    
    // Unit price
    doc.text(`$${item.unitPrice.toFixed(2)}`, pageWidth - margin - 35, yPos, { align: 'right' });
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`$${item.totalPrice.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    yPos += 6;
  });

  // ==========================================
  // TOTALS SECTION - Clean Design
  // ==========================================
  yPos += 5;
  
  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.text('Subtotal:', pageWidth - margin - 40, yPos);
  doc.setTextColor(darkGray);
  doc.text(`$${sale.subtotal.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
  yPos += 6;

  // Discount (if any)
  if (sale.discount > 0) {
    doc.setTextColor(lightGray);
    doc.text('Discount:', pageWidth - margin - 40, yPos);
    doc.setTextColor('#dc2626'); // Red
    doc.text(`-$${sale.discount.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
    yPos += 6;
  }

  // Tax (if any)
  if (sale.tax > 0) {
    doc.setTextColor(lightGray);
    doc.text('Tax:', pageWidth - margin - 40, yPos);
    doc.setTextColor(darkGray);
    doc.text(`$${sale.tax.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
    yPos += 6;
  }

  // Total - Highlighted
  yPos += 2;
  doc.setFillColor(primaryColor);
  doc.roundedRect(pageWidth - margin - 60, yPos - 4, 60, 12, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - margin - 55, yPos + 3);
  doc.setFontSize(16);
  doc.text(`$${sale.total.toFixed(2)}`, pageWidth - margin - 3, yPos + 3, { align: 'right' });

  // ==========================================
  // PAYMENT INFO
  // ==========================================
  if (sale.amountPaid && sale.changeGiven !== undefined) {
    yPos += 18;
    doc.setFontSize(9);
    doc.setTextColor(lightGray);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Amount Paid:', pageWidth - margin - 40, yPos);
    doc.setTextColor(darkGray);
    doc.text(`$${sale.amountPaid.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
    yPos += 5;
    
    doc.setTextColor(lightGray);
    doc.text('Change:', pageWidth - margin - 40, yPos);
    doc.setTextColor(darkGray);
    doc.text(`$${sale.changeGiven.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
  }

  // ==========================================
  // FOOTER - Thank You Message
  // ==========================================
  yPos = pageHeight - 40;
  
  // Decorative line
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin + 40, yPos, pageWidth - margin - 40, yPos);
  
  yPos += 8;
  doc.setTextColor(darkGray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You for Your Purchase!', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray);
  doc.text('Visit us again soon!', pageWidth / 2, yPos, { align: 'center' });
  
  // Additional footer info
  yPos += 8;
  doc.setFontSize(8);
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });

  // Return as blob
  return doc.output('blob');
}

/**
 * Download receipt PDF
 */
export async function downloadReceipt(
  sale: Sale,
  config?: Partial<ReceiptConfig>
): Promise<void> {
  const blob = await generateEnhancedReceipt(sale, config);
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${sale.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Print receipt
 */
export async function printReceipt(
  sale: Sale,
  config?: Partial<ReceiptConfig>
): Promise<void> {
  const blob = await generateEnhancedReceipt(sale, config);
  const url = window.URL.createObjectURL(blob);
  
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}
