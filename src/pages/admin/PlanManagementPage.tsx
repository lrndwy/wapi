import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Pencil, Trash, Plus, Package, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from "@/components/layouts/AdminLayout";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  maxAccounts: number;
  maxMessages: number;
  features: string;
  createdAt: string;
  updatedAt: string;
}

export function PlanManagementPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  // Form values
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formPeriod, setFormPeriod] = useState('');
  const [formMaxAccounts, setFormMaxAccounts] = useState(1);
  const [formMaxMessages, setFormMaxMessages] = useState(1000);
  const [formFeatures, setFormFeatures] = useState('[]');
  
  // Fetch plans when component mounts
  useEffect(() => {
    fetchPlans();
  }, [token]);
  
  const fetchPlans = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/plans', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data paket');
      }
      
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data paket');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormId('');
    setFormName('');
    setFormPrice('');
    setFormPeriod('');
    setFormMaxAccounts(1);
    setFormMaxMessages(1000);
    setFormFeatures('[]');
  };
  
  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };
  
  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormId(plan.id);
    setFormName(plan.name);
    setFormPrice(plan.price);
    setFormPeriod(plan.period || '');
    setFormMaxAccounts(plan.maxAccounts);
    setFormMaxMessages(plan.maxMessages);
    setFormFeatures(plan.features);
    setShowEditDialog(true);
  };
  
  const openDeleteDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowDeleteDialog(true);
  };
  
  const handleCreatePlan = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: formId,
          name: formName,
          price: formPrice,
          period: formPeriod,
          maxAccounts: Number(formMaxAccounts),
          maxMessages: Number(formMaxMessages),
          features: formFeatures
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal membuat paket');
      }
      
      toast.success('Paket berhasil dibuat');
      setShowCreateDialog(false);
      fetchPlans();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal membuat paket');
    }
  };
  
  const handleUpdatePlan = async () => {
    if (!token || !selectedPlan) return;
    
    try {
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          price: formPrice,
          period: formPeriod,
          maxAccounts: Number(formMaxAccounts),
          maxMessages: Number(formMaxMessages),
          features: formFeatures
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal memperbarui paket');
      }
      
      toast.success('Paket berhasil diperbarui');
      setShowEditDialog(false);
      fetchPlans();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui paket');
    }
  };
  
  const handleDeletePlan = async () => {
    if (!token || !selectedPlan) return;
    
    try {
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menghapus paket');
      }
      
      toast.success('Paket berhasil dihapus');
      setShowDeleteDialog(false);
      fetchPlans();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus paket');
    }
  };
  
  // For displaying features in the table
  const formatFeatures = (featuresStr: string) => {
    try {
      const features = JSON.parse(featuresStr);
      if (Array.isArray(features) && features.length > 0) {
        return features.slice(0, 2).join(', ') + (features.length > 2 ? ', ...' : '');
      }
      return 'Tidak ada fitur';
    } catch (e) {
      return featuresStr;
    }
  };
  
  return (
    <AdminLayout>
      <div className="grid gap-4">
        <h1 className="text-3xl font-bold">Manajemen Paket</h1>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Paket</CardTitle>
              <CardDescription>
                Kelola paket langganan untuk pengguna
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Paket
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Max Akun</TableHead>
                      <TableHead>Max Pesan</TableHead>
                      <TableHead>Fitur</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Tidak ada paket yang ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.id}</TableCell>
                          <TableCell>{plan.name}</TableCell>
                          <TableCell>{plan.price}{plan.period}</TableCell>
                          <TableCell>{plan.maxAccounts}</TableCell>
                          <TableCell>{plan.maxMessages}</TableCell>
                          <TableCell>{formatFeatures(plan.features)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(plan)}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Tambah Paket */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Paket Baru</DialogTitle>
              <DialogDescription>
                Buat paket baru untuk ditawarkan kepada pengguna
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="id" className="text-right">
                  ID
                </label>
                <Input
                  id="id"
                  placeholder="starter"
                  className="col-span-3"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Nama
                </label>
                <Input
                  id="name"
                  placeholder="Starter"
                  className="col-span-3"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="price" className="text-right">
                  Harga
                </label>
                <Input
                  id="price"
                  placeholder="Rp 99.000"
                  className="col-span-3"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="period" className="text-right">
                  Periode
                </label>
                <Input
                  id="period"
                  placeholder="/bulan"
                  className="col-span-3"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="maxAccounts" className="text-right">
                  Max Akun
                </label>
                <Input
                  id="maxAccounts"
                  type="number"
                  className="col-span-3"
                  value={formMaxAccounts}
                  onChange={(e) => setFormMaxAccounts(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="maxMessages" className="text-right">
                  Max Pesan
                </label>
                <Input
                  id="maxMessages"
                  type="number"
                  className="col-span-3"
                  value={formMaxMessages}
                  onChange={(e) => setFormMaxMessages(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="features" className="text-right pt-2">
                  Fitur
                </label>
                <Textarea
                  id="features"
                  placeholder='["Fitur 1", "Fitur 2"]'
                  className="col-span-3"
                  rows={4}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleCreatePlan}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Edit Paket */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Paket</DialogTitle>
              <DialogDescription>
                Ubah informasi paket {selectedPlan?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Nama
                </label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="price" className="text-right">
                  Harga
                </label>
                <Input
                  id="price"
                  className="col-span-3"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="period" className="text-right">
                  Periode
                </label>
                <Input
                  id="period"
                  className="col-span-3"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="maxAccounts" className="text-right">
                  Max Akun
                </label>
                <Input
                  id="maxAccounts"
                  type="number"
                  className="col-span-3"
                  value={formMaxAccounts}
                  onChange={(e) => setFormMaxAccounts(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="maxMessages" className="text-right">
                  Max Pesan
                </label>
                <Input
                  id="maxMessages"
                  type="number"
                  className="col-span-3"
                  value={formMaxMessages}
                  onChange={(e) => setFormMaxMessages(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="features" className="text-right pt-2">
                  Fitur
                </label>
                <Textarea
                  id="features"
                  className="col-span-3"
                  rows={4}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleUpdatePlan}>
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Konfirmasi Hapus */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus paket "{selectedPlan?.name}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-red-500">
                Paket tidak dapat dihapus jika masih digunakan oleh pengguna.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDeletePlan}>
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 