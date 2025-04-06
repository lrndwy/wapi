import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MessageCircle, Shield, Zap, BarChart } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function Features() {
    return (
        <section id="features" className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="@container mx-auto max-w-5xl px-6">
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Fitur Unggulan</h2>
                    <p className="mt-4">Berbagai fitur yang memudahkan Anda mengintegrasikan WhatsApp ke sistem Anda</p>
                </motion.div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator>
                                    <MessageCircle className="size-6" aria-hidden />
                                </CardDecorator>

                                <h3 className="mt-6 font-medium">Integrasi WhatsApp</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-sm">Hubungkan WhatsApp dengan sistem Anda dengan mudah melalui API</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator>
                                    <Zap className="size-6" aria-hidden />
                                </CardDecorator>

                                <h3 className="mt-6 font-medium">Respon Cepat</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-sm">Kirim dan terima pesan secara real-time dengan webhook</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator>
                                    <Shield className="size-6" aria-hidden />
                                </CardDecorator>

                                <h3 className="mt-6 font-medium">Keamanan Terjamin</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-sm">Enkripsi end-to-end dan autentikasi yang aman</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <motion.div 
        className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-primary)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-primary)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-primary)15%,transparent)] dark:group-hover:bg-primary/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-primary)20%,transparent)]"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
    >
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div aria-hidden className="bg-radial to-background absolute inset-0 from-transparent to-75%" />
        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t border-primary/20">{children}</div>
    </motion.div>
)
