'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, Image as ImageIcon, X } from 'lucide-react';
import Receipt from './Receipt';
import type { Sale } from '@/types/sales.types';
import { toast } from 'sonner';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

export default function ReceiptDialog({
  open,
  onClose,
  sale,
  storeName,
  storeAddress,
  storePhone,
}: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!sale) return null;

  // Helper function to capture receipt as canvas (avoiding oklch color issues)
  const captureReceiptAsCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!receiptRef.current) {
      throw new Error('Receipt element not found');
    }

    return await html2canvas(receiptRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: false,
      onclone: (clonedDoc) => {
        // Inject a style tag to override any oklch colors with safe hex colors
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            --background: 252 252 253 !important;
            --foreground: 16 24 40 !important;
            --card: 255 255 255 !important;
            --border: 226 232 240 !important;
            --primary: 59 130 246 !important;
            --muted-foreground: 100 116 139 !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      },
    });
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;

    try {
      const printWindow = window.open('', '_blank', 'width=302,height=600');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      const receiptHTML = receiptRef.current.innerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${sale.id.slice(0, 8)}</title>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Courier New', 'Consolas', monospace;
                background: white;
                color: black;
                width: 80mm;
                margin: 0 auto;
                padding: 0;
              }
              
              /* XPRINTER Thermal Printer Settings */
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0mm;
                }
                
                body {
                  margin: 0;
                  padding: 0;
                  width: 80mm;
                }
                
                /* Remove any backgrounds for thermal printing */
                * {
                  background: transparent !important;
                  color: black !important;
                }
                
                /* Ensure text is crisp */
                p, span, div, td, th {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
              
              /* Import Tailwind utilities needed for layout */
              .font-mono { font-family: 'Courier New', monospace; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .text-2xl { font-size: 1.5rem; }
              .text-lg { font-size: 1.125rem; }
              .text-center { text-align: center; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .justify-center { justify-content: center; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              .mb-1 { margin-bottom: 0.25rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mt-3 { margin-top: 0.75rem; }
              .mt-4 { margin-top: 1rem; }
              .mt-6 { margin-top: 1.5rem; }
              .pb-3 { padding-bottom: 0.75rem; }
              .pt-2 { padding: top: 0.5rem; }
              .pt-3 { padding-top: 0.75rem; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .pr-2 { padding-right: 0.5rem; }
              .w-full { width: 100%; }
              .w-12 { width: 3rem; }
              .w-16 { width: 4rem; }
              .w-20 { width: 5rem; }
              .max-w-\\[320px\\] { max-width: 320px; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .break-words { word-wrap: break-word; }
              .shadow-lg { box-shadow: none; }
            </style>
          </head>
          <body>
            ${receiptHTML}
          </body>
        </html>
      `);
      printWindow.document.close();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Close after print dialog
        setTimeout(() => {
          printWindow.close();
        }, 100);
      }, 250);

      toast.success('Sending to XPRINTER...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    }
  };

  const handleDownloadImage = async () => {
    try {
      setIsProcessing(true);
      toast.info('Generating image...');

      const canvas = await captureReceiptAsCanvas();

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${sale.id.slice(0, 8)}-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('Receipt image downloaded!');
      }, 'image/png');
    } catch (error) {
      console.error('Download image error:', error);
      toast.error('Failed to download image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsProcessing(true);
      toast.info('Generating PDF...');

      const canvas = await captureReceiptAsCanvas();
      const imgData = canvas.toDataURL('image/png');
      
      // Thermal receipt size (80mm width)
      const pdfWidth = 80; // mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${sale.id.slice(0, 8)}-${Date.now()}.pdf`);

      toast.success('Receipt PDF downloaded!');
    } catch (error) {
      console.error('Download PDF error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt Preview</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Preview */}
          <div 
            className="p-4 rounded-lg flex justify-center"
            style={{ backgroundColor: '#f3f4f6' }}
          >
            <div 
              className="shadow-lg"
              style={{ backgroundColor: '#ffffff' }}
            >
              <Receipt
                ref={receiptRef}
                sale={sale}
                storeName={storeName}
                storeAddress={storeAddress}
                storePhone={storePhone}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={handlePrint}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              onClick={handleDownloadImage}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Image
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Receipt ID: {sale.id}</p>
            <p>Standard thermal printer size (80mm width)</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
