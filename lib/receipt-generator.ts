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
  doc.text('វិក្កយបត្រ', pageWidth / 2, yPos, { align: 'center' });

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
  
  doc.text('វិក្កយបត្រលេខ:', leftCol, yPos);
  doc.text('កាលបរិច្ឆេទ និងម៉ោង:', leftCol, yPos + 5);
  doc.text('អតិថិជន:', leftCol, yPos + 10);
  doc.text('វិធីបង់ប្រាក់:', leftCol, yPos + 15);
  
  // Right column - Values
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  const valueLeftCol = leftCol + 35;
  
  doc.text(`#${sale.id.slice(0, 8).toUpperCase()}`, valueLeftCol, yPos);
  doc.text(new Date(sale.createdAt).toLocaleString(), valueLeftCol, yPos + 5);
  doc.text(sale.customerName || 'អតិថិជនផ្ទាល់', valueLeftCol, yPos + 10);
  doc.text(sale.paymentMethod, valueLeftCol, yPos + 15);

  // ==========================================
  // ITEMS TABLE - Minimal Design
  // ==========================================
  yPos += 28;
  
  // Table column positions
  const colNumX = margin;
  const colNumW = 10;
  const colItemX = colNumX + colNumW;
  const colQtyW = 15;
  const colPriceW = 25;
  const colTotalW = 28;
  const colItemW = contentWidth - colNumW - colQtyW - colPriceW - colTotalW;
  const colQtyX = colItemX + colItemW;
  const colPriceX = colQtyX + colQtyW;
  const colTotalX = colPriceX + colPriceW;
  const rowHeight = 7;

  // Table header
  doc.setFillColor(darkGray);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  yPos += 5.5;
  
  doc.text('#', colNumX + colNumW / 2, yPos, { align: 'center' });
  doc.text('មុខទំនិញ', colItemX + 2, yPos);
  doc.text('ចំនួន', colQtyX + colQtyW / 2, yPos, { align: 'center' });
  doc.text('តម្លៃ', colPriceX + colPriceW - 2, yPos, { align: 'right' });
  doc.text('សរុប', colTotalX + colTotalW - 2, yPos, { align: 'right' });

  // Table border around header
  doc.setDrawColor(darkGray);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos - 5.5, contentWidth, 8);

  // Table items
  yPos += 2.5;
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'normal');
  
  sale.items.forEach((item, index) => {
    const rowY = yPos;
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
    }
    
    const textY = rowY + 5;
    
    // Row number
    doc.setTextColor(lightGray);
    doc.setFont('helvetica', 'normal');
    doc.text((index + 1).toString(), colNumX + colNumW / 2, textY, { align: 'center' });
    
    // Item name (truncate if too long)
    doc.setTextColor(darkGray);
    const itemName = item.productName.length > 35 
      ? item.productName.substring(0, 32) + '...' 
      : item.productName;
    doc.text(itemName, colItemX + 2, textY);
    
    // Quantity
    doc.text(item.quantity.toString(), colQtyX + colQtyW / 2, textY, { align: 'center' });
    
    // Unit price
    doc.text(`$${item.unitPrice.toFixed(2)}`, colPriceX + colPriceW - 2, textY, { align: 'right' });
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`$${item.subtotal.toFixed(2)}`, colTotalX + colTotalW - 2, textY, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    // Row border
    doc.setDrawColor('#d1d5db');
    doc.setLineWidth(0.2);
    doc.rect(margin, rowY, contentWidth, rowHeight);
    
    // Column separators
    doc.line(colItemX, rowY, colItemX, rowY + rowHeight);
    doc.line(colQtyX, rowY, colQtyX, rowY + rowHeight);
    doc.line(colPriceX, rowY, colPriceX, rowY + rowHeight);
    doc.line(colTotalX, rowY, colTotalX, rowY + rowHeight);
    
    yPos += rowHeight;
  });

  // ==========================================
  // TOTALS SECTION - Clean Design
  // ==========================================
  yPos += 5;
  
  // Calculate subtotal from items
  const subtotal = sale.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.text('សរុបរង:', pageWidth - margin - 40, yPos);
  doc.setTextColor(darkGray);
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
  yPos += 6;

  // Discount (if any)
  if (sale.discountAmount && sale.discountAmount > 0) {
    doc.setTextColor(lightGray);
    doc.text('បញ្ចុះតម្លៃ:', pageWidth - margin - 40, yPos);
    doc.setTextColor('#dc2626'); // Red
    doc.text(`-$${sale.discountAmount.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
    yPos += 6;
  }

  // Total - Highlighted
  yPos += 2;
  doc.setFillColor(primaryColor);
  doc.roundedRect(pageWidth - margin - 60, yPos - 4, 60, 12, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('សរុប:', pageWidth - margin - 55, yPos + 3);
  doc.setFontSize(16);
  doc.text(`$${sale.totalAmount.toFixed(2)}`, pageWidth - margin - 3, yPos + 3, { align: 'right' });

  // ==========================================
  // PAYMENT INFO - Skipped (amountPaid and changeGiven don't exist in Sale type)
  // ==========================================
  // These fields would need to be added to the Sale type if needed:
  // - amountPaid: number
  // - changeGiven: number

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
  doc.text('អរគុណសម្រាប់ការទិញ!', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray);
  doc.text('សូមអញ្ជើញមកម្តងទៀត!', pageWidth / 2, yPos, { align: 'center' });
  
  // Additional footer info
  yPos += 8;
  doc.setFontSize(8);
  doc.text('វិក្កយបត្រនេះបង្កើតដោយកុំព្យូទ័រ មិនចាំបាច់ហត្ថលេខាឡើយ។', pageWidth / 2, yPos, { align: 'center' });

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
