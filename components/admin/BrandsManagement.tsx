'use client';

import { useState } from 'react';
import { Award, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Brand } from '@/types/brand.types';
import { createBrandAction, updateBrandAction, deleteBrandAction } from '@/actions/brands/brands.action';
import { uploadFileAction } from '@/actions/fileupload/fileupload.action';
import { useRouter } from 'next/navigation';

interface BrandsManagementProps {
  brands: Brand[];
}

export default function BrandsManagement({ brands: initialBrands }: BrandsManagementProps) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; brandId: string | null }>({
    open: false,
    brandId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    if (!formData.logoUrl.trim()) {
      toast.error('Brand logo is required');
      return;
    }

    setIsLoading(true);

    try {
      if (editingBrand) {
        const response = await updateBrandAction(editingBrand.id, formData);
        
        if (response.success && response.data) {
          setBrands(brands.map(b => 
            b.id === editingBrand.id ? response.data! : b
          ));
          toast.success('Brand updated successfully! 🎉');
          router.refresh();
        } else {
          toast.error(response.message || 'Failed to update brand');
        }
      } else {
        const response = await createBrandAction(formData);
        
        if (response.success && response.data) {
          setBrands([...brands, response.data]);
          toast.success('Brand created successfully! 🎉');
          router.refresh();
        } else {
          toast.error(response.message || 'Failed to create brand');
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.error('Failed to save brand. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description,
      logoUrl: brand.logoUrl,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, brandId: id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.brandId) return;

    setIsLoading(true);

    try {
      const response = await deleteBrandAction(deleteDialog.brandId);
      
      if (response.success) {
        setBrands(brands.filter(b => b.id !== deleteDialog.brandId));
        toast.success('Brand deleted successfully! ✅');
        router.refresh();
      } else {
        toast.error(response.message || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand. Please try again.');
    } finally {
      setIsLoading(false);
      setDeleteDialog({ open: false, brandId: null });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', logoUrl: '' });
    setDialogOpen(false);
    setEditingBrand(null);
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      toast.info('Uploading image... 📤');
      
      const response = await uploadFileAction(file);
      
      if (response.success && response.data?.url) {
        toast.success('Image uploaded successfully! ✅');
        return response.data.url;
      } else {
        toast.error(response.message || 'Failed to upload image');
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      throw error;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/50">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Brands</h1>
                <p className="text-muted-foreground">Manage your product brands</p>
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg" onClick={() => { setEditingBrand(null); resetForm(); }}>
                <Plus className="w-5 h-5 mr-2" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingBrand ? 'Edit Brand' : 'Create New Brand'}
                </DialogTitle>
                <DialogDescription>
                  {editingBrand ? 'Update the brand information below' : 'Fill in the details to add a new brand'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter brand name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brand Logo *</Label>
                  <ImageUpload
                    value={formData.logoUrl}
                    onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                    showUrlInput={false}
                    onFileSelect={handleFileUpload}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter brand description..."
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create Brand'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        

        {/* Brands Grid */}
        {brands.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => (
              <Card key={brand.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/20">
                {/* Logo Section with Gradient Background */}
                <div className="relative h-40 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 flex items-center justify-center overflow-hidden">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    width={150}
                    height={150}
                    className="object-contain p-2"
                    style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>

                {/* Content Section */}
                <CardHeader className="text-center pb-3 space-y-2">
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {brand.name}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 min-h-[32px] px-2">
                    {brand.description || 'No description available'}
                  </CardDescription>
                </CardHeader>

                {/* Action Buttons */}
                <CardContent className="pt-0 pb-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(brand)}
                      className="flex-1 h-9 hover:bg-primary hover:text-primary-foreground transition-all"
                      disabled={isLoading}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(brand.id)}
                      className="flex-1 h-9 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30 transition-all"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No brands yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Start by creating your first brand to organize your products
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Brand
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, brandId: null })}
        onConfirm={confirmDelete}
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone and may affect products associated with this brand."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
