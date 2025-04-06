import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
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
import { Search, MoreVertical, UserCog, Package, Users, BarChart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminLayout } from "@/components/layouts/AdminLayout";

// Jenis plan dari pricing.tsx
const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "Rp 99.000",
    period: "/bulan",
  },
  {
    id: "professional",
    name: "Professional",
    price: "Rp 299.000",
    period: "/bulan",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
  }
];

interface User {
  id: string;
  name: string;
  email: string;
  planId: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export function AdminDashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [userCount, setUserCount] = useState<number>(0);
  const [planCount, setPlanCount] = useState<number>(0);

  // Cek apakah user memiliki role admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data pengguna');
        }
        
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Ubah plan pengguna
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
      
      setShowPlanDialog(false);
    } catch (error) {
      console.error('Error:', error);
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
    } catch (error) {
      console.error('Error:', error);
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

  // Tampilkan dialog ubah plan
  const handleChangePlan = (user: User) => {
    setSelectedUser(user);
    setSelectedPlan(user.planId);
    setShowPlanDialog(true);
  };

  // Mendapatkan nama plan berdasarkan ID
  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : 'Tidak diketahui';
  };

  useEffect(() => {
    if (token) {
      fetchUserCount();
      fetchPlanCount();
    }
  }, [token]);

  const fetchUserCount = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  };

  const fetchPlanCount = async () => {
    try {
      const response = await fetch('/api/admin/plans', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlanCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching plan count:', error);
    }
  };

  return (
    <AdminLayout>
    <div className="flex">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Pengguna</h3>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Pengguna Aktif</h3>
            <p className="text-3xl font-bold">
              {users.filter(user => user.isActive).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Paket</h3>
            <p className="text-3xl font-bold">{planCount}</p>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Pengguna Terbaru</h2>
          </div>
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="relative w-64">
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
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
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
          </div>
        </div>

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
      </div>
    </div>
    </AdminLayout>
  );
} 