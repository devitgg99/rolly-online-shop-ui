'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Award, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Search, 
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Eye,
  Filter,
  X,
  Loader2,
  Sparkles,
  Download,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Brand, BrandAnalytics, BrandStats } from '@/types/brand.types';
import { createBrandAction, updateBrandAction, deleteBrandAction } from '@/actions/brands/brands.action';
import { uploadFileAction } from '@/actions/fileupload/fileupload.action';
import { fetchBrandAnalytics, fetchBrandStats, exportBrands } from '@/services/brands.service';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BrandsManagementProps {
  brands: Brand[];
}

export default function BrandsManagement({ brands: initialBrands }: BrandsManagementProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State management
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

  // New UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  // Analytics state
  const [brandAnalytics, setBrandAnalytics] = useState<BrandAnalytics[]>([]);
  const [brandStats, setBrandStats] = useState<BrandStats | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', description: '', logoUrl: '' });
    setDialogOpen(false);
    setEditingBrand(null);
  };

  const handleOpenDialog = () => {
    setEditingBrand(null);
    resetForm();
    setDialogOpen(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl/Cmd + N: New brand
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleOpenDialog();
      }
      // Escape: Close dialogs
      if (e.key === 'Escape') {
        if (dialogOpen) resetForm();
        if (deleteDialog.open) setDeleteDialog({ open: false, brandId: null });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, deleteDialog.open]);

  // Fetch brand analytics and stats
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session?.backendToken) return;

      try {
        const [analyticsResponse, statsResponse] = await Promise.all([
          fetchBrandAnalytics(session.backendToken),
          fetchBrandStats(session.backendToken)
        ]);

        if (analyticsResponse.success && analyticsResponse.data) {
          setBrandAnalytics(analyticsResponse.data);
        }

        if (statsResponse.success && statsResponse.data) {
          setBrandStats(statsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching brand analytics:', error);
      }
    };

    fetchAnalytics();
  }, [session, brands]); // Refetch when brands change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('ឈ្មោះម៉ាកត្រូវបានទាមទារ');
      return;
    }

    if (!formData.logoUrl.trim()) {
      toast.error('ឡូហ្គោម៉ាកត្រូវបានទាមទារ');
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
          toast.success('ម៉ាកត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ! 🎉');
          router.refresh();
        } else {
          toast.error(response.message || 'បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពម៉ាក');
        }
      } else {
        const response = await createBrandAction(formData);
        
        if (response.success && response.data) {
          setBrands([...brands, response.data]);
          toast.success('ម៉ាកត្រូវបានបង្កើតដោយជោគជ័យ! 🎉');
          router.refresh();
        } else {
          toast.error(response.message || 'បរាជ័យក្នុងការបង្កើតម៉ាក');
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.error('បរាជ័យក្នុងការរក្សាទុកម៉ាក។ សូមព្យាយាមម្តងទៀត។');
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
        toast.success('ម៉ាកត្រូវបានលុបដោយជោគជ័យ! ✅');
        router.refresh();
      } else {
        toast.error(response.message || 'បរាជ័យក្នុងការលុបម៉ាក');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('បរាជ័យក្នុងការលុបម៉ាក។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsLoading(false);
      setDeleteDialog({ open: false, brandId: null });
    }
  };

  // Filtering and sorting
  const filteredAndSortedBrands = brands
    .filter((brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSelectBrand = (brandId: string) => {
    const newSelected = new Set(selectedBrands);
    if (newSelected.has(brandId)) {
      newSelected.delete(brandId);
    } else {
      newSelected.add(brandId);
    }
    setSelectedBrands(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBrands.size === filteredAndSortedBrands.length) {
      setSelectedBrands(new Set());
    } else {
      setSelectedBrands(new Set(filteredAndSortedBrands.map((b) => b.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBrands.size === 0) {
      toast.error('សូមជ្រើសរើសម៉ាកដើម្បីលុប');
      return;
    }

    const confirmed = confirm(
      `តើអ្នកប្រាកដថាចង់លុប ${selectedBrands.size} ម៉ាកមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const brandId of Array.from(selectedBrands)) {
        const response = await deleteBrandAction(brandId);
        if (response.success) {
          successCount++;
          setBrands((prev) => prev.filter((b) => b.id !== brandId));
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`បានលុប ${successCount} ម៉ាកដោយជោគជ័យ`);
        router.refresh();
      }
      if (failCount > 0) {
        toast.error(`បរាជ័យក្នុងការលុប ${failCount} ម៉ាក`);
      }
      
      setSelectedBrands(new Set());
    } catch (error) {
      console.error('Error deleting brands:', error);
      toast.error('បរាជ័យក្នុងការលុបម៉ាក។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (!session?.backendToken) {
      toast.error('ត្រូវការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ');
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportBrands(format, session.backendToken);
      
      if (!blob) {
        toast.error(`បរាជ័យក្នុងការនាំចេញម៉ាកទៅ ${format.toUpperCase()}`);
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brands_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`ម៉ាកត្រូវបាននាំចេញដោយជោគជ័យជា ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting brands:', error);
      toast.error('បរាជ័យក្នុងការនាំចេញម៉ាក។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSort = (newSortBy: 'name' | 'date') => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      if (!session?.backendToken) {
        toast.error('ត្រូវការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ');
        throw new Error('No authentication token');
      }

      toast.info('កំពុងផ្ទុករូបភាពឡើង... 📤');
      
      const response = await uploadFileAction(file, session.backendToken);
      
      if (response.success && response.data?.url) {
        toast.success('រូបភាពត្រូវបានផ្ទុកឡើងដោយជោគជ័យ! ✅');
        return response.data.url;
      } else {
        toast.error(response.message || 'បរាជ័យក្នុងការផ្ទុករូបភាពឡើង');
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('បរាជ័យក្នុងការផ្ទុករូបភាពឡើង។ សូមព្យាយាមម្តងទៀត។');
      throw error;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/50">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">គ្រប់គ្រងម៉ាក</h1>
                <p className="text-muted-foreground">គ្រប់គ្រងម៉ាក និងឡូហ្គោផលិតផល</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg" onClick={handleOpenDialog}>
                  <Plus className="w-5 h-5 mr-2" />
                  បន្ថែមម៉ាក
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {editingBrand ? 'កែសម្រួលម៉ាក' : 'បង្កើតម៉ាកថ្មី'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBrand ? 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មានម៉ាកខាងក្រោម' : 'បំពេញព័ត៌មានលម្អិតដើម្បីបន្ថែមម៉ាកថ្មី'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">ឈ្មោះម៉ាក *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="បញ្ចូលឈ្មោះម៉ាក"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ឡូហ្គោម៉ាក *</Label>
                    <ImageUpload
                      value={formData.logoUrl}
                      onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                      showUrlInput={false}
                      onFileSelect={handleFileUpload}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">ការពិពណ៌នា</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="បញ្ចូលការពិពណ៌នាម៉ាក..."
                      rows={4}
                      disabled={isLoading}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                      បោះបង់
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'កំពុងរក្សាទុក...' : editingBrand ? 'ធ្វើបច្ចុប្បន្នភាពម៉ាក' : 'បង្កើតម៉ាក'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ម៉ាកសរុប</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brands.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredAndSortedBrands.length} បានបង្ហាញ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">បានជ្រើសរើស</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedBrands.size}</div>
              <p className="text-xs text-muted-foreground">
                {selectedBrands.size > 0 ? 'ម៉ាកបានជ្រើសរើស' : 'មិនមានការជ្រើសរើស'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">សកម្មភាពរហ័ស</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={brands.length === 0}
                >
                  {selectedBrands.size === filteredAndSortedBrands.length ? 'ដកការជ្រើសរើសទាំងអស់' : 'ជ្រើសរើសទាំងអស់'}
                </Button>
                {selectedBrands.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    លុប {selectedBrands.size}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ផលិតផលសរុប</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {brandStats?.totalProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                គ្រប់ម៉ាកទាំងអស់
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">តម្លៃស្តុក</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(brandStats?.totalInventoryValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                តម្លៃសរុប
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAll}
            disabled={brands.length === 0}
          >
            {selectedBrands.size === filteredAndSortedBrands.length ? 'ដកការជ្រើសរើសទាំងអស់' : 'ជ្រើសរើសទាំងអស់'}
          </Button>
          {selectedBrands.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              លុប ({selectedBrands.size})
            </Button>
          )}
          
          {/* Export Buttons */}
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={isExporting || brands.length === 0}
            >
              {isExporting ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Download className="w-3 h-3 mr-1" />
              )}
              នាំចេញ CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={isExporting || brands.length === 0}
            >
              {isExporting ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3 h-3 mr-1" />
              )}
              នាំចេញ Excel
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="ស្វែងរកម៉ាក... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => toggleSort('name')}
                  className={cn(sortBy === 'name' && 'bg-primary/10')}
                >
                  ឈ្មោះ
                  {sortBy === 'name' && (
                    sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-2" /> : <SortDesc className="w-4 h-4 ml-2" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleSort('date')}
                  className={cn(sortBy === 'date' && 'bg-primary/10')}
                >
                  កាលបរិច្ឆេទ
                  {sortBy === 'date' && (
                    sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-2" /> : <SortDesc className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {searchQuery && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">តម្រងសកម្ម:</span>
                <Badge variant="secondary" className="gap-1">
                  <Search className="w-3 h-3" />
                  {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brands Display */}
        {filteredAndSortedBrands.length > 0 ? (
          viewMode === 'grid' ? (
            // Grid View
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAndSortedBrands.map((brand) => {
                const isSelected = selectedBrands.has(brand.id);
                const analytics = brandAnalytics.find((a) => a.brandId === brand.id);
                return (
                  <Card 
                    key={brand.id} 
                    className={cn(
                      "group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2",
                      isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/20"
                    )}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectBrand(brand.id)}
                        className="w-5 h-5 rounded border-2 cursor-pointer"
                      />
                    </div>

                    {/* Product Count Badge */}
                    {analytics && analytics.productCount > 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge variant="secondary" className="shadow-md">
                          <Package className="w-3 h-3 mr-1" />
                          {analytics.productCount} ផលិតផល
                        </Badge>
                      </div>
                    )}

                    {/* Logo Section */}
                    <div className="relative h-40 bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center overflow-hidden">
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="object-contain p-4 max-w-full max-h-full group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* Quick Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(brand)}
                          disabled={isLoading}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          កែសម្រួល
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(brand.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          លុប
                        </Button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <CardHeader className="text-center pb-3 space-y-2">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {brand.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
                        {brand.description || 'គ្មានការពិពណ៌នា'}
                      </CardDescription>
                    </CardHeader>

                    {/* Analytics & Actions Section */}
                    {analytics && (
                      <CardContent className="pt-0 pb-3 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="text-center">
                            <div className="text-muted-foreground">តម្លៃស្តុក</div>
                            <div className="font-semibold">
                              ${analytics.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">តម្លៃមធ្យម</div>
                            <div className="font-semibold">
                              ${analytics.avgProductPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        {analytics.productCount > 0 && (
                          <Link href={`/products?brandId=${brand.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              មើលផលិតផល
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    )}

                    {/* Mobile Actions (visible on small screens) */}
                    <CardContent className="pt-0 pb-4 md:hidden border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(brand)}
                          className="flex-1"
                          disabled={isLoading}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          កែសម្រួល
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(brand.id)}
                          className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          លុប
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // List View
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedBrands.size === filteredAndSortedBrands.length}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-2 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3 text-left">ឡូហ្គោ</th>
                        <th className="px-4 py-3 text-left">ឈ្មោះម៉ាក</th>
                        <th className="px-4 py-3 text-left">ការពិពណ៌នា</th>
                        <th className="px-4 py-3 text-center">ផលិតផល</th>
                        <th className="px-4 py-3 text-right">តម្លៃស្តុក</th>
                        <th className="px-4 py-3 text-left">កាលបរិច្ឆេទបង្កើត</th>
                        <th className="px-4 py-3 text-right">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedBrands.map((brand) => {
                        const isSelected = selectedBrands.has(brand.id);
                        const analytics = brandAnalytics.find((a) => a.brandId === brand.id);
                        return (
                          <tr 
                            key={brand.id}
                            className={cn(
                              "border-b hover:bg-muted/50 transition-colors",
                              isSelected && "bg-primary/5"
                            )}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectBrand(brand.id)}
                                className="w-4 h-4 rounded border-2 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <img
                                src={brand.logoUrl}
                                alt={brand.name}
                                className="w-12 h-12 object-contain rounded"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium">{brand.name}</td>
                            <td className="px-4 py-3 text-muted-foreground max-w-md truncate">
                              {brand.description || 'គ្មានការពិពណ៌នា'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {analytics ? (
                                <Badge variant="secondary">
                                  <Package className="w-3 h-3 mr-1" />
                                  {analytics.productCount}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {analytics ? (
                                `$${analytics.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(brand.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {analytics && analytics.productCount > 0 && (
                                  <Link href={`/products?brandId=${brand.id}`}>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      title="មើលផលិតផល"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(brand)}
                                  disabled={isLoading}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(brand.id)}
                                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  disabled={isLoading}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : brands.length === 0 ? (
          // Empty State
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">មិនទាន់មានម៉ាកនៅឡើយ</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  ចាប់ផ្តើមដោយបង្កើតម៉ាកដំបូងរបស់អ្នកដើម្បីរៀបចំផលិតផល
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                បង្កើតម៉ាកដំបូងរបស់អ្នក
              </Button>
            </CardContent>
          </Card>
        ) : (
          // No Results State
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">រកមិនឃើញម៉ាក</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  សូមសាកល្បងកែសម្រួលការស្វែងរក ឬតម្រង
                </p>
              </div>
              <Button onClick={() => setSearchQuery('')} variant="outline">
                សម្អាតការស្វែងរក
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
        title="លុបម៉ាក"
        description="តើអ្នកប្រាកដថាចង់លុបម៉ាកនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ ហើយអាចប៉ះពាល់ដល់ផលិតផលដែលជាប់ទាក់ទងនឹងម៉ាកនេះ។"
        confirmText="លុប"
        cancelText="បោះបង់"
        variant="destructive"
      />
    </div>
  );
}
