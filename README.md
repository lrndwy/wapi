# WAPI
Aplikasi web untuk mengelola dan mengotomatisasi pesan WhatsApp menggunakan React, Tailwind CSS, dan Shadcn UI.

## ⚠️ Disclaimer Penting

Proyek ini menggunakan library tidak resmi untuk berinteraksi dengan WhatsApp. Harap diperhatikan:

1. Ini **BUKAN** API resmi WhatsApp
2. Penggunaan unofficial API melanggar Terms of Service WhatsApp
3. Akun WhatsApp yang digunakan berisiko untuk diblokir
4. Untuk penggunaan bisnis/komersial, disarankan menggunakan [WhatsApp Business API resmi](https://business.whatsapp.com/products/business-platform)

## ✨ Fitur

- 📱 Multi-akun WhatsApp
- 🔑 Manajemen API key
- 💬 Kirim & terima pesan
- 📊 Dashboard monitoring
- 🔔 Notifikasi pesan masuk
- 🎯 Webhook untuk integrasi
- 👥 Manajemen pengguna & role
- 📈 Batasan paket berdasarkan plan

## 🛠️ Tech Stack

- [Bun](https://bun.sh) - JavaScript runtime & package manager
- [React](https://reactjs.org) - UI library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Shadcn UI](https://ui.shadcn.com) - UI components
- [Prisma](https://prisma.io) - Database ORM
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time komunikasi

## 🚀 Instalasi

1. Clone repository
```bash
git clone [url-repository]
cd wa-web
```

2. Install dependencies
```bash
bun install
```

3. Setup environment variables
```bash
cp .env.example .env
```
Edit file `.env` sesuai konfigurasi Anda

4. Jalankan migrasi database
```bash
bun prisma migrate dev
```

5. Jalankan development server
```bash
bun dev
```

6. Untuk production
```bash
bun start
```

## 📝 Environment Variables

```env
WEBHOOK_SECRET="your-webhook-secret"
```

## 🔒 Keamanan

- Gunakan API key yang kuat
- Simpan credentials dengan aman
- Aktifkan HTTPS untuk production
- Monitor penggunaan API
- Batasi rate limiting

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

## ⚖️ Penggunaan yang Bertanggung Jawab

Proyek ini ditujukan untuk:
- Pembelajaran & pengembangan
- Pengujian & prototyping
- Penggunaan pribadi terbatas

TIDAK disarankan untuk:
- Layanan komersial
- Spam atau penyalahgunaan
- Pengumpulan data massal

## 🤝 Kontribusi

Kontribusi selalu diterima! Silakan buat pull request atau laporkan issues.
