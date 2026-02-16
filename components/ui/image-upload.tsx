'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { compressImage } from '@/lib/image-compression';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  showUrlInput?: boolean;
  onFileSelect?: (file: File) => Promise<string>;
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  showUrlInput = true,
  onFileSelect,
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [statusText, setStatusText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  // Sync preview when value prop changes externally
  useEffect(() => {
    if (value && value !== preview && !isUploading) {
      setPreview(value);
    }
  }, [value]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (uploadingRef.current) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF, WEBP)');
      return;
    }

    uploadingRef.current = true;
    setIsUploading(true);
    setStatusText('Processing...');

    let blobUrl: string | null = null;

    try {
      let processed = file;

      // Compress if needed
      if (file.size > maxSizeMB * 1024 * 1024 || file.type === 'image/jpeg') {
        setStatusText('Optimizing...');
        try {
          processed = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.80,
            outputFormat: 'image/jpeg',
          });
        } catch {
          processed = file;
        }
      }

      // Show instant preview
      blobUrl = URL.createObjectURL(processed);
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      setPreview(blobUrl);

      // Upload
      setStatusText('Uploading...');
      if (onFileSelect) {
        const uploadPromise = onFileSelect(processed);
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout')), 45000)
        );
        const url = await Promise.race([uploadPromise, timeoutPromise]);
        onChange(url);
        if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
        setPreview(url);
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(processed);
        });
        onChange(base64);
        if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
        setPreview(base64);
      }

      setStatusText('');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
      if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
      setPreview(value || null);
      setStatusText('');
    } finally {
      uploadingRef.current = false;
      setIsUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onChange, onFileSelect, maxSizeMB, value, preview]);

  const openFilePicker = useCallback(() => {
    if (disabled || uploadingRef.current) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onChange, preview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [disabled, processFile]);

  return (
    <div className="space-y-2">
      {/* Persistent file input in the DOM — critical for mobile reliability */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
        }}
      />

      {preview ? (
        /* ─── Has image ─── */
        <div className="relative border-2 border-border rounded-lg overflow-hidden h-64">
          <Image
            src={preview}
            alt="Upload preview"
            fill
            className="object-contain p-2"
            unoptimized
          />

          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="text-white text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium">{statusText || 'Uploading...'}</p>
              </div>
            </div>
          )}

          {/* Action buttons — always visible, not just on hover */}
          {!disabled && !isUploading && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              <button
                type="button"
                onClick={openFilePicker}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-destructive text-destructive-foreground rounded-md shadow-lg hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ─── Empty state ─── */
        <div
          onClick={openFilePicker}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          className={cn(
            'relative flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg transition-all cursor-pointer',
            isDragging && 'border-primary bg-primary/5 scale-[1.02]',
            !isDragging && 'border-border hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed',
            isUploading && 'pointer-events-none opacity-75'
          )}
        >
          {isUploading ? (
            <div className="text-center">
              <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-sm font-medium">{statusText || 'Uploading...'}</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ImageIcon className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-semibold mb-1">Upload Image</p>
              <p className="text-xs text-muted-foreground mb-3">
                Drag & drop or tap to browse
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="w-3.5 h-3.5" />
                <span>JPG, PNG, GIF, WEBP</span>
              </div>
              <p className="text-[10px] text-green-600 mt-1">Auto-compresses large images</p>
            </>
          )}
        </div>
      )}

      {/* Optional URL input */}
      {showUrlInput && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>or</span>
          <input
            type="text"
            placeholder="Paste image URL"
            value={value || ''}
            onChange={(e) => { onChange(e.target.value); setPreview(e.target.value); }}
            disabled={disabled}
            className="flex-1 px-3 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 text-sm"
          />
        </div>
      )}
    </div>
  );
}
