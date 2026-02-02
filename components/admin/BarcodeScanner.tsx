'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { X, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const hasScannedRef = useRef(false); // Prevent multiple scans

  useEffect(() => {
    if (!open) {
      // Clean up everything when closing
      stopScanning();
      cleanupCache();
      return;
    }

    // Fresh start for each scan
    cleanupCache();
    startScanning();

    return () => {
      stopScanning();
      cleanupCache();
    };
  }, [open]);

  // Clear all cache data for fresh scan
  const cleanupCache = () => {
    hasScannedRef.current = false;
    setError('');
    setIsScanning(false);
    console.log('🧹 Barcode scanner cache cleared');
  };

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      console.log('🔍 Starting camera...');

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported on this browser. Please use Chrome or update Safari.');
        setIsScanning(false);
        return;
      }

      console.log('📷 Requesting camera permission...');

      // Safari-friendly camera request
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      }).catch(err => {
        console.error('Permission error:', err);
        throw err;
      });

      console.log('✅ Camera permission granted!');

      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('📹 Found cameras:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        setError('No camera found. Please check your device settings.');
        setIsScanning(false);
        return;
      }

      // Try to find back camera (for mobile)
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      const selectedDeviceId = backCamera?.deviceId || videoDevices[0].deviceId;

      console.log('📸 Using camera:', backCamera?.label || videoDevices[0].label);

      if (videoRef.current) {
        // Start scanning with the selected camera
        await readerRef.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (result && !hasScannedRef.current) {
              hasScannedRef.current = true; // Mark as scanned
              const barcode = result.getText();
              console.log('✅ Barcode scanned successfully:', barcode);
              
              // Stop scanning and clean cache
              stopScanning();
              
              // Call callback and close
              setTimeout(() => {
                onScan(barcode);
                cleanupCache(); // Clear cache after successful scan
                onClose();
              }, 100);
            }
            // Don't log errors (ZXing logs many false positives while scanning)
          }
        );
        console.log('🎥 Scanner started successfully!');
      }
    } catch (err: any) {
      console.error('❌ Scanner error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. On Safari: Go to Settings > Safari > Camera > Allow');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please check your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is being used by another app. Please close other apps and try again.');
      } else {
        setError(`Camera error: ${err.message || 'Please try again or use keyboard input.'}`);
      }
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      try {
        // Stop all video tracks
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          videoRef.current.srcObject = null;
          videoRef.current.src = '';
        }
        // Clear reader reference
        readerRef.current = null;
      } catch (err) {
        console.error('⚠️  Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    console.log('🛑 Scanner stopped');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a barcode to scan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-2">{error}</p>
              <p className="text-xs text-muted-foreground">
                Tip: You can still use a USB or Bluetooth barcode scanner - just scan while the POS is open!
              </p>
            </div>
          ) : (
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
                webkit-playsinline="true"
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 md:w-64 md:h-64 border-2 border-primary/50 rounded-lg relative">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/70 animate-pulse shadow-lg shadow-primary/50" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center space-y-2">
            {!error && (
              <>
                <p className="text-sm text-muted-foreground">
                  {isScanning ? '📸 Scanning... Position barcode in the frame' : '📷 Initializing camera...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Or use a physical barcode scanner (USB/Bluetooth)
                </p>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
