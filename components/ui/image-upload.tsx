'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { compressImage } from '@/lib/image-compression';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  showUrlInput?: boolean; // Option to show/hide URL input
  onFileSelect?: (file: File) => Promise<string>; // Custom upload handler
  maxSizeMB?: number; // Max file size before compression (default: auto-compress all)
}

export function ImageUpload({ 
  value, 
  onChange, 
  disabled, 
  showUrlInput = true, 
  onFileSelect,
  maxSizeMB = 10 // Default: compress images larger than 10MB
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [compressionProgress, setCompressionProgress] = useState('');

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Revoke any blob URLs when component unmounts
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFile = useCallback(async (file: File) => {
    console.log('🎯 handleFile called:', { fileName: file.name, isUploading });
    
    // CRITICAL: Prevent concurrent uploads
    if (isUploading) {
      console.warn('⚠️ Already uploading, ignoring new file');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF, WEBP)');
      return;
    }

    console.log('📸 Original image:', {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      type: file.type
    });

    setIsUploading(true);
    setCompressionProgress('Processing image...');

    let previewUrl: string | null = null;

    try {
      let processedFile = file;

      // Auto-compress if image is large OR if from camera (to fix orientation)
      const shouldCompress = file.size > (maxSizeMB * 1024 * 1024) || file.type === 'image/jpeg';
      
      if (shouldCompress) {
        setCompressionProgress('Compressing & fixing orientation...');
        console.log('🔧 Compressing image...');
        
        try {
          processedFile = await compressImage(file, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.85,
            outputFormat: 'image/jpeg'
          });
          
          console.log('✅ Compressed:', {
            originalSize: (file.size / 1024 / 1024).toFixed(2) + 'MB',
            compressedSize: (processedFile.size / 1024 / 1024).toFixed(2) + 'MB',
            savings: (((file.size - processedFile.size) / file.size) * 100).toFixed(1) + '%'
          });
        } catch (compressionError) {
          console.warn('⚠️ Compression failed, using original:', compressionError);
          processedFile = file;
        }
      }

      // Create preview from processed file
      setCompressionProgress('Creating preview...');
      previewUrl = URL.createObjectURL(processedFile);
      
      // Revoke old preview URL if it exists
      if (preview && preview.startsWith('blob:')) {
        console.log('🧹 Cleaning up old preview URL');
        URL.revokeObjectURL(preview);
      }
      setPreview(previewUrl);

      // Upload to server
      setCompressionProgress('Uploading...');
      
      if (onFileSelect) {
        console.log('📤 Starting upload to server...');
        const url = await onFileSelect(processedFile);
        onChange(url);
        console.log('✅ Image uploaded successfully:', processedFile.name);
        
        // Replace preview with server URL and cleanup blob
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          previewUrl = null;
        }
        setPreview(url);
      } else {
        // Fallback: convert to base64
        const base64Reader = new FileReader();
        base64Reader.onload = (e) => {
          const result = e.target?.result as string;
          onChange(result);
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
          }
        };
        base64Reader.onerror = () => {
          console.error('❌ Failed to convert to base64');
        };
        base64Reader.readAsDataURL(processedFile);
      }
      
      setCompressionProgress('');
      console.log('✅ Upload complete!');
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Failed to upload image. Please try again.');
      
      // Cleanup preview URL on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
      }
      setPreview(null);
      setCompressionProgress('');
    } finally {
      console.log('🏁 Finally block: resetting isUploading to false');
      setIsUploading(false);
    }
  }, [onChange, onFileSelect, preview, maxSizeMB, isUploading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    // Prevent clicks while uploading
    if (disabled || isUploading) {
      console.log('⚠️ Upload in progress, please wait...');
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // DON'T set capture attribute - let user choose camera OR gallery
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('📁 File selected:', file.name);
        handleFile(file);
      }
      
      // Cleanup: Remove the input from DOM after use
      setTimeout(() => {
        input.remove();
      }, 100);
    };
    
    // Cleanup if user cancels (doesn't select file)
    input.oncancel = () => {
      console.log('❌ File selection cancelled');
      setTimeout(() => {
        input.remove();
      }, 100);
    };
    
    input.click();
  }, [disabled, isUploading, handleFile]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cleanup blob URL if exists
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    
    setPreview(null);
    onChange('');
  }, [onChange, preview]);

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all cursor-pointer overflow-hidden",
          isDragging && "border-primary bg-primary/5 scale-[1.02]",
          !isDragging && "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "pointer-events-none opacity-75",
          preview ? "h-64" : "h-48"
        )}
      >
        {preview ? (
          <div className="relative w-full h-full group">
            <Image
              src={preview}
              alt="Upload preview"
              fill
              className="object-contain p-2"
              unoptimized
            />
            
            {!disabled && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClick}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm font-semibold">
                    {compressionProgress || 'Uploading...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop or click to browse
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Upload className="w-4 h-4" />
                <span>Supports: JPG, PNG, GIF, WEBP</span>
              </div>
              <p className="text-xs text-green-600 font-medium">
                ✅ Auto-compresses large images
              </p>
            </div>

            {isUploading && (
              <div className="mt-4 w-full max-w-xs">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alternative: Paste URL */}
      {showUrlInput && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>or</span>
          <input
            type="text"
            placeholder="Paste image URL"
            value={value || ''}
            onChange={(e) => {
              onChange(e.target.value);
              setPreview(e.target.value);
            }}
            disabled={disabled}
            className="flex-1 px-3 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 text-sm"
          />
        </div>
      )}
    </div>
  );
}
