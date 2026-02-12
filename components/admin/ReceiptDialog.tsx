'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

  /**
   * Capture receipt as high-res canvas.
   * html2canvas clones the ENTIRE document, so Tailwind v4's oklch()
   * colors crash the parser. Fix: strip all stylesheets from the clone.
   * The Receipt uses pure inline styles so it renders fine without them.
   */
  const captureReceiptAsCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!receiptRef.current) {
      throw new Error('Receipt element not found');
    }

    return await html2canvas(receiptRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: false,
      onclone: (clonedDoc) => {
        // Remove ALL stylesheets & style tags to eliminate oklch colors
        clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove());

        // Add minimal safe base styles
        const safeStyle = clonedDoc.createElement('style');
        safeStyle.textContent = '* { margin: 0; padding: 0; } body { background: #fff; }';
        clonedDoc.head.appendChild(safeStyle);
      },
    });
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;

    try {
      const printWindow = window.open('', '_blank', 'width=360,height=700');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      const receiptHTML = receiptRef.current.outerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${sale.id.slice(0, 8)}</title>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                background: white;
                color: black;
                display: flex;
                justify-content: center;
              }
              @media print {
                @page { size: 80mm auto; margin: 0; }
                body { width: 80mm; }
              }
            </style>
          </head>
          <body>${receiptHTML}</body>
        </html>
      `);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 100);
      }, 250);

      toast.success('Sending to XPRINTER...');
    } catch {
      toast.error('Failed to print receipt');
    }
  };

  const handleDownloadImage = async () => {
    try {
      setIsProcessing(true);
      toast.info('Generating image...');

      const canvas = await captureReceiptAsCanvas();

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
    } catch {
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
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
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
          <DialogDescription className="sr-only">
            Preview and download receipt
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable receipt area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
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
        </div>

        {/* Fixed bottom actions -- always visible */}
        <div className="flex-shrink-0 border-t px-6 py-4 space-y-3 bg-background">
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
          <p className="text-xs text-muted-foreground text-center">
            Receipt #{sale.id.slice(0, 8).toUpperCase()} • 80mm thermal format
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
