import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Pricing() {
    return (
        <section id="pricing" className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div 
                    className="mx-auto max-w-2xl space-y-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">Harga yang Sesuai dengan Kebutuhan Anda</h1>
                    <p>Pilih paket yang sesuai dengan skala bisnis Anda. Upgrade atau downgrade kapan saja.</p>
                </motion.div>

                <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="h-full"
                    >
                        <Card className="flex h-full flex-col">
                            <CardHeader>
                                <CardTitle className="font-medium">Free</CardTitle>
                                <span className="my-3 block text-2xl font-semibold">Rp 0</span>
                                <CardDescription className="text-sm">Untuk mencoba layanan</CardDescription>
                                <Button asChild variant="outline" className="mt-4 w-full">
                                    <Link to="/register">Mulai Gratis</Link>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-4">
                                <hr className="border-dashed" />
                                <ul className="list-outside space-y-3 text-sm">
                                    {[
                                        '1 Nomor WhatsApp',
                                        '50 pesan/bulan',
                                        'API Basic'
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="h-full"
                    >
                        <Card className="relative flex h-full flex-col">
                            <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">Terpopuler</span>

                            <CardHeader>
                                <CardTitle className="font-medium">Professional</CardTitle>
                                <span className="my-3 block text-2xl font-semibold">Rp 299.000 / bulan</span>
                                <CardDescription className="text-sm">Untuk bisnis yang berkembang</CardDescription>
                                <Button asChild className="mt-4 w-full">
                                    <Link to="/register">Mulai Sekarang</Link>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-4">
                                <hr className="border-dashed" />
                                <ul className="list-outside space-y-3 text-sm">
                                    {[
                                        '5 Nomor WhatsApp',
                                        '10.000 pesan/bulan',
                                        'API & Webhook'
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="h-full"
                    >
                        <Card className="flex h-full flex-col">
                            <CardHeader>
                                <CardTitle className="font-medium">Enterprise</CardTitle>
                                <span className="my-3 block text-2xl font-semibold">Rp 999.000 / bulan</span>
                                <CardDescription className="text-sm">Untuk kebutuhan skala besar</CardDescription>
                                <Button asChild variant="outline" className="mt-4 w-full">
                                    <Link to="/register">Mulai Sekarang</Link>
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-4">
                                <hr className="border-dashed" />
                                <ul className="list-outside space-y-3 text-sm">
                                    {[
                                        '100 Nomor WhatsApp',
                                        '1.000.000 pesan/bulan',
                                        'Full API Access'
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
