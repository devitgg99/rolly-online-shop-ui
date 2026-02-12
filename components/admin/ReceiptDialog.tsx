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

  // Capture receipt as high-res canvas for image/PDF export
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
      // Receipt uses pure inline styles so no CSS-variable patching needed
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
