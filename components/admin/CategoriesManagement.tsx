'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tag, Plus, Pencil, Trash2, FolderTree, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Category } from '@/types/category.types';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/actions/categories/categories.action';
import { useRouter } from 'next/navigation';

interface CategoriesManagementProps {
  categories: Category[];
}

export default function CategoriesManagement({ categories: initialCategories }: CategoriesManagementProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId: string | null }>({
    open: false,
    categoryId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: 'none', // 'none' for root, or UUID for subcategory
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('ឈ្មោះប្រភេទត្រូវបានទាមទារ');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare category data
      const categoryData = {
        name: formData.name,
        description: formData.description,
        // If 'none' is selected, don't send parentId (creates root category)
        // If UUID is selected, send it (creates subcategory)
        ...(formData.parentId !== 'none' && { parentId: formData.parentId }),
      };

      if (editingCategory) {
        const response = await updateCategoryAction(editingCategory.id, categoryData);
        
        if (response.success && response.data) {
          setCategories(categories.map(c => 
            c.id === editingCategory.id ? response.data! : c
          ));
          toast.success('ប្រភេទត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ! 🎉');
          router.refresh();
        } else {
          toast.error(response.message || 'បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពប្រភេទ');
        }
      } else {
        const response = await createCategoryAction(categoryData);
        
        if (response.success && response.data) {
          setCategories([...categories, response.data]);
          toast.success('ប្រភេទត្រូវបានបង្កើតដោយជោគជ័យ! 🎉');
          router.refresh();
        } else {
          toast.error(response.message || 'បរាជ័យក្នុងការបង្កើតប្រភេទ');
        }
      }
      resetForm();
    } catch (error) {
      toast.error('បរាជ័យក្នុងការរក្សាទុកប្រភេទ។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      parentId: category.parentId || 'none',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const hasChildren = categories.some(c => c.parentId === id);
    
    if (hasChildren) {
      toast.error('មិនអាចលុបប្រភេទដែលមានប្រភេទរងបានទេ។ សូមលុបឬផ្លាស់ប្តូរប្រភេទរងជាមុនសិន។');
      return;
    }

    setDeleteDialog({ open: true, categoryId: id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.categoryId) return;

    setIsLoading(true);

    try {
      const response = await deleteCategoryAction(deleteDialog.categoryId);
      
      if (response.success) {
        setCategories(categories.filter(c => c.id !== deleteDialog.categoryId));
        toast.success('ប្រភេទត្រូវបានលុបដោយជោគជ័យ! ✅');
        router.refresh();
      } else {
        toast.error(response.message || 'បរាជ័យក្នុងការលុបប្រភេទ');
      }
    } catch (error) {
      toast.error('បរាជ័យក្នុងការលុបប្រភេទ។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsLoading(false);
      setDeleteDialog({ open: false, categoryId: null });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', parentId: 'none' });
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const getParentCategories = () => {
    return categories.filter(c => c.parentId === null);
  };

  const getSubCategories = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/50">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">ប្រភេទ</h1>
                <p className="text-muted-foreground">រៀបចំផលិតផលរបស់អ្នក</p>
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg" onClick={() => { setEditingCategory(null); resetForm(); }}>
                <Plus className="w-5 h-5 mr-2" />
                បន្ថែមប្រភេទ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingCategory ? 'កែសម្រួលប្រភេទ' : 'បង្កើតប្រភេទថ្មី'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មានប្រភេទខាងក្រោម' : 'បំពេញព័ត៌មានលម្អិតដើម្បីបន្ថែមប្រភេទថ្មី'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ឈ្មោះប្រភេទ *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="បញ្ចូលឈ្មោះប្រភេទ"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">ការពិពណ៌នា</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="បញ្ចូលការពិពណ៌នាប្រភេទ..."
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent">ប្រភេទមេ</Label>
                  <Select 
                    value={formData.parentId} 
                    onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ជ្រើសរើសប្រភេទមេ (ស្រេចចិត្ត)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">គ្មាន (ប្រភេទឫស)</SelectItem>
                      {getParentCategories()
                        .filter(c => !editingCategory || c.id !== editingCategory.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    ទុកជា "គ្មាន" ដើម្បីបង្កើតប្រភេទឫស ឬជ្រើសរើសប្រភេទមេដើម្បីបង្កើតប្រភេទរង
                  </p>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                    បោះបង់
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'កំពុងរក្សាទុក...' : editingCategory ? 'ធ្វើបច្ចុប្បន្នភាពប្រភេទ' : 'បង្កើតប្រភេទ'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ប្រភេទសរុប</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                ប្រភេទទាំងអស់
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ប្រភេទឫស</CardTitle>
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{getParentCategories().length}</div>
              <p className="text-xs text-muted-foreground">
                កម្រិតកំពូល
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ប្រភេទរង</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {categories.filter(c => c.parentId !== null).length}
              </div>
              <p className="text-xs text-muted-foreground">
                ប្រភេទដែលស្ថិតក្រោម
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        {categories.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ឈ្មោះ</TableHead>
                  <TableHead>ការពិពណ៌នា</TableHead>
                  <TableHead>ប្រភេទ</TableHead>
                  <TableHead>ប្រភេទមេ</TableHead>
                  <TableHead className="text-right">សកម្មភាព</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const parentCategory = categories.find(c => c.id === category.parentId);
                  const subcategoryCount = getSubCategories(category.id).length;
                  
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-md">
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {category.description || 'គ្មានការពិពណ៌នា'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {category.parentId ? (
                          <Badge variant="secondary">
                            <Layers className="w-3 h-3 mr-1" />
                            ប្រភេទរង
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-600">
                            <FolderTree className="w-3 h-3 mr-1" />
                            ឫស
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {parentCategory ? (
                          <span className="text-sm">{parentCategory.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                        {subcategoryCount > 0 && !category.parentId && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {subcategoryCount} រង
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            disabled={isLoading}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-destructive hover:bg-destructive/10"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                <Tag className="w-10 h-10 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">មិនទាន់មានប្រភេទនៅឡើយ</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  ចាប់ផ្តើមដោយបង្កើតប្រភេទដំបូងរបស់អ្នកដើម្បីរៀបចំផលិតផល
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                បង្កើតប្រភេទដំបូងរបស់អ្នក
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, categoryId: null })}
        onConfirm={confirmDelete}
        title="លុបប្រភេទ"
        description="តើអ្នកប្រាកដថាចង់លុបប្រភេទនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។"
        confirmText="លុប"
        cancelText="បោះបង់"
        variant="destructive"
      />
    </div>
  );
}
