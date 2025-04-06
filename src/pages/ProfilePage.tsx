import React, { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Check, X, Edit, Key, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { UserPlanInfo } from '@/components/UserPlanInfo';
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  planId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  messagesSentThisMonth: number;
  plan: {
    id: string;
    name: string;
    price: string;
    period: string | null;
    maxAccounts: number;
    maxMessages: number;
    features: string; // JSON string
  };
  usage: {
    whatsappAccounts: {
      current: number;
      max: number;
    };
    messages: {
      current: number;
      max: number;
    };
  };
  features: {
    canAddMoreAccounts: boolean;
    canSendMessages: boolean;
    hasWebhookAccess: boolean;
    hasAdvancedApi: boolean;
  };
}

export function ProfilePage() {
  const { user, updateProfile, token, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [plans, setPlans] = useState<Array<{
    id: string;
    name: string;
    price: string;
    period: string | null;
    maxAccounts: number;
    maxMessages: number;
    features: string;
  }>>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (profile) {
      fetchPlans();
    }
  }, [profile, token]);

  const fetchProfile = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data profil');
      }
      
      const data = await response.json();
      console.log('Response dari /api/users/profile:', data);
      
      const { user } = data;
      console.log('User data:', user);
      
      // Parse features string jika ada
      if (user.plan && typeof user.plan.features === 'string') {
        try {
          user.plan.features = JSON.parse(user.plan.features);
        } catch (e) {
          console.error('Error parsing plan features:', e);
          user.plan.features = [];
        }
      }
      
      console.log('Profile setelah parsing:', user);
      setProfile(user);
      setName(user.name);
      setEmail(user.email);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data profil');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    if (!token || !profile?.plan?.id) {
      console.log('Token atau profile.plan.id tidak tersedia:', { token: !!token, planId: profile?.plan?.id });
      return;
    }
    
    try {
      const response = await fetch('/api/plans', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data paket');
      }
      
      const data = await response.json();
      console.log('Data paket yang diterima:', data);
      
      // Logika filter berdasarkan paket saat ini
      let availablePlans = [];
      
      const currentPlanId = profile.plan.id.toLowerCase();
      console.log('Paket saat ini:', currentPlanId);
      
      // Pastikan data adalah array dan tidak kosong
      if (!Array.isArray(data) || data.length === 0) {
        console.log('Data paket kosong atau bukan array');
        setPlans([]);
        return;
      }
      
      switch (currentPlanId) {
        case 'free':
          // Jika free, tampilkan paket professional dan enterprise
          availablePlans = data.filter((plan: any) => {
            const planId = plan.id?.toLowerCase();
            return planId === 'professional' || planId === 'enterprise';
          });
          break;
          
        case 'professional':
          // Jika professional, hanya tampilkan enterprise
          availablePlans = data.filter((plan: any) => 
            plan.id?.toLowerCase() === 'enterprise'
          );
          break;
          
        case 'enterprise':
          // Jika enterprise, tidak ada paket yang ditampilkan
          availablePlans = [];
          break;
          
        default:
          // Untuk kasus lain, tampilkan semua paket yang tersedia
          availablePlans = data.filter((plan: any) => 
            plan.id?.toLowerCase() !== currentPlanId
          );
      }
      
      console.log('Paket yang tersedia setelah filter:', availablePlans);
      setPlans(availablePlans);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal memuat data paket');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!name.trim()) {
        toast.error("Nama tidak boleh kosong");
        return;
      }
      
      setIsLoading(true);
      await updateProfile(name, email);
      setIsEditing(false);
      toast.success("Profil berhasil diperbarui");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      toast.error("Gagal memperbarui profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    setShowUpgradeDialog(true);
  };

  const handleConfirmUpgrade = () => {
    if (!selectedPlan) {
      toast.error('Silakan pilih paket terlebih dahulu');
      return;
    }

    const selectedPlanDetails = plans.find(p => p.id === selectedPlan);
    
    if (!selectedPlanDetails) {
      toast.error('Paket tidak ditemukan');
      return;
    }

    // Pastikan semua data yang diperlukan tersedia
    if (!profile?.name || !profile?.email || !profile?.id || !profile?.plan?.name) {
      toast.error('Data profil tidak lengkap');
      return;
    }

    // Buka email client dengan detail yang sudah diisi
    const subject = encodeURIComponent('Permintaan Upgrade Paket');
    const body = encodeURIComponent(`
Halo Tim Hexanest,

Saya ingin mengajukan permintaan upgrade paket:

Detail User:
- Nama: ${profile.name}
- Email: ${profile.email}
- ID: ${profile.id}
- Paket Saat Ini: ${profile.plan.name}
- Paket yang Diinginkan: ${selectedPlanDetails.name}

Mohon informasi lebih lanjut mengenai proses upgrade paket.

Terima kasih.
    `);

    window.location.href = `mailto:hexanest@hexanest.id?subject=${subject}&body=${body}`;
    setShowUpgradeDialog(false);
    setSelectedPlan('');
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Semua field password harus diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      await updatePassword(currentPassword, newPassword);
      
      setShowPasswordDialog(false);
      toast.success("Password berhasil diperbarui");
      
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Profil tidak ditemukan</h1>
        <Button onClick={() => navigate('/dashboard')}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Profil Pengguna</h1>
                <p className="text-muted-foreground mt-1">
                  {profile.name || 'Memuat...'}
                </p>
              </div>
            </div>
          </div>

          {/* Informasi Pribadi */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pribadi</CardTitle>
              <CardDescription>
                Informasi dasar tentang akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled={true}
                    type="email"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-2">
                  {isEditing ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        disabled={isLoading}
                      >
                        <X className="mr-2 h-3 w-3" />
                        Batal
                      </Button>
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-3 w-3" />
                            Simpan
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-3 w-3" />
                        Edit Profil
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowPasswordDialog(true)}
                      >
                        <Key className="mr-2 h-3 w-3" />
                        Ubah Password
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Langganan */}
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : profile && profile.plan ? (
            <Card>
              <CardHeader>
                <CardTitle>Status Langganan</CardTitle>
                <CardDescription>
                  Informasi tentang paket langganan Anda saat ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Paket:</span>
                    <Badge variant="default">
                      {profile.plan.name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Harga:</span>
                    <span className="text-muted-foreground">
                      {profile.plan.price} / {profile.plan.period}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={handleUpgradePlan}
                    >
                      Upgrade Paket
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-4">
              <p className="text-muted-foreground">Data paket tidak tersedia</p>
            </div>
          )}

          {/* Penggunaan dan Fitur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Penggunaan */}
            <Card>
              <CardHeader>
                <CardTitle>Penggunaan</CardTitle>
                <CardDescription>
                  Statistik penggunaan layanan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Penggunaan WhatsApp */}
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : profile?.usage ? (
                    <div>
                      <h4 className="font-medium mb-2">Penggunaan WhatsApp</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span>Akun WhatsApp</span>
                        <span className={profile.usage.whatsappAccounts.current >= profile.usage.whatsappAccounts.max ? "text-red-600" : "text-green-600"}>
                          {profile.usage.whatsappAccounts.current} / {profile.usage.whatsappAccounts.max}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            profile.usage.whatsappAccounts.current >= profile.usage.whatsappAccounts.max 
                              ? "bg-red-600" 
                              : "bg-green-600"
                          }`}
                          style={{ 
                            width: `${Math.min(
                              (profile.usage.whatsappAccounts.current / profile.usage.whatsappAccounts.max) * 100, 
                              100
                            )}%` 
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">Data penggunaan tidak tersedia</p>
                    </div>
                  )}

                  {/* Penggunaan Messages */}
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : profile?.usage?.messages ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Messages</span>
                        <span className="text-sm text-muted-foreground">
                          {profile.usage.messages.current} / {profile.usage.messages.max}
                        </span>
                      </div>
                      <Progress 
                        value={(profile.usage.messages.current / profile.usage.messages.max) * 100}
                        className="h-2"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">Data penggunaan pesan tidak tersedia</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fitur */}
            <Card>
              <CardHeader>
                <CardTitle>Fitur Tersedia</CardTitle>
                <CardDescription>
                  Fitur yang tersedia dalam paket Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : profile?.features ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Tambah Akun WhatsApp</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          profile.features.canAddMoreAccounts 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {profile.features.canAddMoreAccounts ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Kirim Pesan</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          profile.features.canSendMessages 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {profile.features.canSendMessages ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Webhook Access</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          profile.features.hasWebhookAccess 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {profile.features.hasWebhookAccess ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Advanced API</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          profile.features.hasAdvancedApi 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {profile.features.hasAdvancedApi ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">Data fitur tidak tersedia</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Paket</DialogTitle>
            <DialogDescription>
              Pilih paket yang Anda inginkan. Tim kami akan menghubungi Anda melalui email untuk proses selanjutnya.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {plans.length > 0 ? (
              <>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket yang diinginkan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price}{plan.period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedPlan && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Detail Paket:</h4>
                    {(() => {
                      const selectedPlanData = plans.find(p => p.id === selectedPlan);
                      if (!selectedPlanData) return null;
                      
                      let features: string[] = [];
                      try {
                        features = typeof selectedPlanData.features === 'string' 
                          ? JSON.parse(selectedPlanData.features) 
                          : selectedPlanData.features;
                      } catch (e) {
                        console.error('Error parsing features:', e);
                        return null;
                      }
                      
                      return features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4" />
                          <span>{feature}</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Tidak ada paket yang tersedia untuk upgrade
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleConfirmUpgrade}
              disabled={!selectedPlan || plans.length === 0}
            >
              Lanjutkan ke Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>
              Masukkan password lama dan password baru Anda
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Password Saat Ini</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 