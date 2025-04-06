import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/AdminSidebar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminLayout } from "@/components/layouts/AdminLayout";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  category: string;
  description: string;
  metadata?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    email: string;
    name: string;
  };
}

export function AuditLogPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [category, setCategory] = useState<string>("ALL");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Tambahkan state untuk modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `/api/admin/audit-logs?page=${page}&limit=50`;
      if (category && category !== "ALL") url += `&category=${category}`;
      if (startDate) url += `&startDate=${startDate.toISOString()}`;
      if (endDate) url += `&endDate=${endDate.toISOString()}`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengambil data audit log");
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data audit log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, page, category, startDate, endDate, searchTerm]);

  // Tambahkan debounce untuk pencarian
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2 || searchTerm.trim().length === 0) {
        setPage(1);
        fetchLogs();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Fungsi untuk memformat metadata JSON
  const formatMetadata = (metadata: string | undefined) => {
    if (!metadata) return null;
    try {
      const parsed = JSON.parse(metadata);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return metadata;
    }
  };

  return (
    <AdminLayout>
    <div className="flex">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Audit Log</h1>

        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              <SelectItem value="AUTH">Autentikasi</SelectItem>
              <SelectItem value="USER">Pengguna</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="PLAN">Paket</SelectItem>
              <SelectItem value="API">API</SelectItem>
            </SelectContent>
          </Select>

          {/* Start Date Picker */}
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "dd MMMM yyyy", { locale: id })
                ) : (
                  <span>Tanggal Mulai</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date);
                  setStartDateOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* End Date Picker */}
          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, "dd MMMM yyyy", { locale: id })
                ) : (
                  <span>Tanggal Akhir</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date);
                  setEndDateOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Cari berdasarkan deskripsi, aksi, nama pengguna, email, atau IP..."
            className="w-full"
          />
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="whitespace-nowrap">IP Address</TableHead>
                <TableHead>User Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Tidak ada data log
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow 
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.user.name}</TableCell>
                    <TableCell>{log.category}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell className="font-mono">{log.ipAddress || "unknown"}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{(log.userAgent || "unknown").slice(0, 20)}...</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detail Modal */}
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detail Audit Log</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <ScrollArea className="max-h-[80vh]">
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Waktu</h3>
                      <p>{formatDate(selectedLog.createdAt)}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Kategori</h3>
                      <p>{selectedLog.category}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Aksi</h3>
                      <p>{selectedLog.action}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Pengguna</h3>
                    <p>{selectedLog.user.name} ({selectedLog.user.email})</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Deskripsi</h3>
                    <p>{selectedLog.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">IP Address</h3>
                      <p className="font-mono">{selectedLog.ipAddress || "unknown"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">User Agent</h3>
                      <p className="text-sm break-all">{selectedLog.userAgent || "unknown"}</p>
                    </div>
                  </div>

                  {selectedLog.metadata && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Metadata</h3>
                      <pre className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-auto">
                        {formatMetadata(selectedLog.metadata)}
                      </pre>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Sebelumnya
          </Button>
          <Button variant="outline" disabled>
            Halaman {page} dari {totalPages}
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
} 