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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, UserCog, Package, Trash, UserPlus, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from "@/components/layouts/AdminLayout";

interface User {
  id: string;
  name: string;
  email: string;
  planId: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
}

export function UserManagementPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  
  // Form untuk menambahkan pengguna baru
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formPlanId, setFormPlanId] = useState('starter');
  
  // Form untuk mengedit pengguna
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formEditName, setFormEditName] = useState('');
  const [formEditEmail, setFormEditEmail] = useState('');
  const [formEditRole, setFormEditRole] = useState('');
  
  // Fetch users dan plans saat komponen dimuat
  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, [token]);
  
  // Filter users saat search query berubah
  useEffect(() => {
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          user => 
            user.name.toLowerCase().includes(lowercaseQuery) || 
            user.email.toLowerCase().includes(lowercaseQuery)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);
  
  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data pengguna');
      }
      
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPlans = async () => {
    if (!token) return;
    
    try {
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
    }
  };
  
  // Format tanggal untuk tampilan
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Buka dialog untuk mengubah paket pengguna
  const handleChangePlan = (user: User) => {
    setSelectedUser(user);
    setSelectedPlan(user.planId);
    setShowPlanDialog(true);
  };
  
  // Buka dialog untuk menghapus pengguna
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };
  
  // Buka dialog untuk membuat pengguna baru
  const handleOpenCreateUser = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormPlanId('starter');
    setShowCreateUserDialog(true);
  };
  
  // Buka dialog untuk mengedit pengguna
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormEditName(user.name);
    setFormEditEmail(user.email);
    setFormEditRole(user.role);
    setShowEditDialog(true);
  };
  
  // Mendapatkan nama paket berdasarkan ID
  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : 'Tidak diketahui';
  };
  
  // Membuat pengguna baru
  const createUser = async () => {
    if (!token) return;
    
    try {
      // Validasi input
      if (!formName || !formEmail || !formPassword) {
        toast.error('Nama, email, dan password harus diisi');
        return;
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          planId: formPlanId
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Gagal membuat pengguna');
      }
      
      toast.success('Pengguna berhasil dibuat');
      setShowCreateUserDialog(false);
      fetchUsers(); // Refresh daftar pengguna
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal membuat pengguna');
    }
  };
  
  // Ubah paket pengguna
  const updateUserPlan = async () => {
    if (!selectedUser || !selectedPlan || !token) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengubah paket pengguna');
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, planId: selectedPlan } 
            : user
        )
      );
      
      toast.success('Paket pengguna berhasil diubah');
      setShowPlanDialog(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengubah paket pengguna');
    }
  };
  
  // Toggle status aktif pengguna
  const toggleUserStatus = async (userId: string, isCurrentlyActive: boolean) => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isCurrentlyActive }),
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengubah status pengguna');
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isActive: !isCurrentlyActive } 
            : user
        )
      );
      
      toast.success(`Pengguna berhasil ${!isCurrentlyActive ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengubah status pengguna');
    }
  };
  
  // Hapus pengguna
  const deleteUser = async () => {
    if (!selectedUser || !token) return;
    
    try {
      console.log(`Mencoba menghapus pengguna dengan ID: ${selectedUser.id}`);
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log(`Response status: ${response.status}`);
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Gagal menghapus pengguna');
      }
      
      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
      
      toast.success('Pengguna berhasil dihapus');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error menghapus pengguna:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus pengguna');
    }
  };
  
  // Update pengguna
  const updateUser = async () => {
    if (!selectedUser || !token) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formEditName,
          email: formEditEmail,
          role: formEditRole,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengupdate pengguna');
      }
      
      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? { ...user, name: formEditName, email: formEditEmail, role: formEditRole }
            : user
        )
      );
      
      toast.success('Data pengguna berhasil diperbarui');
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengupdate pengguna');
    }
  };
  
  return (
    <AdminLayout>
      <div className="grid gap-4">
        <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Pengguna</CardTitle>
              <CardDescription>
                Kelola semua pengguna dan paket mereka di sini
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreateUser}>
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pengguna..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Tidak ada pengguna yang ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getPlanName(user.planId)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? "secondary" : "outline"}>
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.isActive ? "success" : "destructive"}
                              className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {user.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleChangePlan(user)}>
                                  <Package className="mr-2 h-4 w-4" />
                                  Ubah Paket
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleUserStatus(user.id, user.isActive)}>
                                  <UserCog className="mr-2 h-4 w-4" />
                                  {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                </DropdownMenuItem>
                                {user.role !== 'admin' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-destructive"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </>
                                )}
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

        {/* Dialog Tambah Pengguna */}
        <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Buat akun pengguna baru untuk sistem
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Nama
                </label>
                <Input
                  id="name"
                  placeholder="Nama Pengguna"
                  className="col-span-3"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="col-span-3"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="password" className="text-right">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="col-span-3"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="role" className="text-right">
                  Peran
                </label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="plan" className="text-right">
                  Paket
                </label>
                <Select value={formPlanId} onValueChange={setFormPlanId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price}{plan.period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>
                Batal
              </Button>
              <Button onClick={createUser}>
                Buat Pengguna
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Ubah Paket */}
        <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ubah Paket Pengguna</DialogTitle>
              <DialogDescription>
                Pilih paket baru untuk {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price}{plan.period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                Batal
              </Button>
              <Button onClick={updateUserPlan}>
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
                Apakah Anda yakin ingin menghapus pengguna {selectedUser?.name}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-red-500">
                Tindakan ini akan menghapus akun dan semua data terkait secara permanen.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={deleteUser}>
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Edit Pengguna */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>
                Edit informasi pengguna {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-name" className="text-right">
                  Nama
                </label>
                <Input
                  id="edit-name"
                  placeholder="Nama Pengguna"
                  className="col-span-3"
                  value={formEditName}
                  onChange={(e) => setFormEditName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-email" className="text-right">
                  Email
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email@example.com"
                  className="col-span-3"
                  value={formEditEmail}
                  onChange={(e) => setFormEditEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-role" className="text-right">
                  Peran
                </label>
                <Select value={formEditRole} onValueChange={setFormEditRole}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
              <Button onClick={updateUser}>
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 