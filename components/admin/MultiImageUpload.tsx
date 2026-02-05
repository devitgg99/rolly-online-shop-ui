'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Star, 
  GripVertical,
  X,
  Check,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  fetchProductImages, 
  addProductImage, 
  setPrimaryProductImage, 
  deleteProductImage,
  reorderProductImages 
} from '@/services/products.service';
import { uploadFileAction } from '@/actions/fileupload/fileupload.action';
import type { ProductImage } from '@/types/product.types';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onImagesUpdated?: () => void;
}

export function MultiImageUpload({
  open,
  onOpenChange,
  productId,
  productName,
  onImagesUpdated,
}: MultiImageUploadProps) {
  const { data: session } = useSession();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && productId) {
      loadImages();
    }
  }, [open, productId]);

  const loadImages = async () => {
    if (!session?.backendToken) return;

    setIsLoading(true);
    try {
      const response = await fetchProductImages(productId, session.backendToken);

      if (response.success && response.data) {
        const sortedImages = response.data.sort((a, b) => a.displayOrder - b.displayOrder);
        setImages(sortedImages);
      } else {
        toast.error(response.message || 'Failed to load images');
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (!session?.backendToken) {
      toast.error('Authentication required');
      return;
    }

    setUploadingFile(true);
    try {
      // Upload file
      const uploadResponse = await uploadFileAction(file, session.backendToken);
      
      if (!uploadResponse.success || !uploadResponse.data?.url) {
        toast.error(uploadResponse.message || 'Failed to upload image');
        return;
      }

      // Add image to product
      const addResponse = await addProductImage(
        productId,
        {
          url: uploadResponse.data.url,
          isPrimary: images.length === 0, // First image is primary
          displayOrder: images.length,
        },
        session.backendToken
      );

      if (addResponse.success) {
        toast.success('Image added successfully!');
        loadImages();
        onImagesUpdated?.();
      } else {
        toast.error(addResponse.message || 'Failed to add image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!session?.backendToken) return;

    setIsLoading(true);
    try {
      const response = await setPrimaryProductImage(productId, imageId, session.backendToken);

      if (response.success) {
        toast.success('Primary image updated!');
        loadImages();
        onImagesUpdated?.();
      } else {
        toast.error(response.message || 'Failed to set primary image');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('Failed to set primary image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (images.length === 1) {
      toast.error('Cannot delete the only image. Products must have at least one image.');
      return;
    }

    if (!session?.backendToken) return;

    const confirmed = confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await deleteProductImage(productId, imageId, session.backendToken);

      if (response.success) {
        toast.success('Image deleted successfully!');
        loadImages();
        onImagesUpdated?.();
      } else {
        toast.error(response.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !session?.backendToken) return;

    const imageOrders = images.map((img, index) => ({
      imageId: img.id,
      displayOrder: index,
    }));

    setIsLoading(true);
    try {
      const response = await reorderProductImages(
        productId,
        { imageOrders },
        session.backendToken
      );

      if (response.success) {
        toast.success('Image order updated!');
        onImagesUpdated?.();
      } else {
        toast.error(response.message || 'Failed to reorder images');
        loadImages(); // Reload to revert
      }
    } catch (error) {
      console.error('Error reordering images:', error);
      toast.error('Failed to reorder images');
      loadImages();
    } finally {
      setIsLoading(false);
      setDraggedIndex(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Manage Product Images - {productName}
          </DialogTitle>
          <DialogDescription>
            Upload, reorder, and manage product images. Drag to reorder. First image or starred image is the primary display.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Upload Button */}
          <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploadingFile || isLoading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Uploading image...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Click to upload image</p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, WEBP up to 10MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Images Grid */}
          {isLoading && images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading images...
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No images uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <Card
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'relative group cursor-move transition-all',
                    image.isPrimary && 'ring-2 ring-primary',
                    draggedIndex === index && 'opacity-50'
                  )}
                >
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      <img
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Primary Badge */}
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Primary
                          </div>
                        </div>
                      )}

                      {/* Drag Handle */}
                      <div className="absolute top-2 right-2 bg-background/80 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!image.isPrimary && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetPrimary(image.id)}
                            disabled={isLoading}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Set Primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteImage(image.id)}
                          disabled={isLoading || images.length === 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Display Order */}
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      Position: {index + 1}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <div className="text-sm text-muted-foreground text-center pt-4 border-t">
              💡 Drag images to reorder them. The primary image will be shown in product listings.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
