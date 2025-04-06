export default function FAQs() {
    return (
        <section id="faq" className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-y-12 px-2 lg:[grid-template-columns:1fr_auto]">
                    <div className="text-center lg:text-left">
                        <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
                            Pertanyaan <br className="hidden lg:block" /> Umum
                        </h2>
                        <p>Jawaban untuk pertanyaan yang sering ditanyakan</p>
                    </div>

                    <div className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0">
                        <div className="pb-6">
                            <h3 className="font-medium">Apakah saya perlu menginstall aplikasi tambahan?</h3>
                            <p className="text-muted-foreground mt-4">Tidak perlu. Anda hanya perlu memindai QR code dengan WhatsApp di HP Anda untuk mulai menggunakan layanan kami.</p>
                        </div>
                        <div className="py-6">
                            <h3 className="font-medium">Berapa lama proses integrasi?</h3>
                            <p className="text-muted-foreground mt-4">Proses integrasi bisa dilakukan dalam hitungan menit. Kami menyediakan dokumentasi lengkap dan contoh kode untuk memudahkan proses integrasi.</p>
                        </div>
                        <div className="py-6">
                            <h3 className="font-medium">Apakah ada batasan jumlah pesan?</h3>
                            <p className="text-muted-foreground mt-4">Batasan jumlah pesan tergantung paket yang Anda pilih. Kami menyediakan berbagai paket sesuai kebutuhan bisnis Anda.</p>
                        </div>
                        <div className="py-6">
                            <h3 className="font-medium">Bagaimana dengan keamanan data?</h3>
                            <p className="text-muted-foreground mt-4">Kami menggunakan enkripsi end-to-end dan menjamin keamanan data Anda sesuai dengan standar industri.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
