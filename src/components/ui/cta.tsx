import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function CallToAction() {
    return (
        <section className="py-20">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mx-auto max-w-3xl px-6 text-center"
            >
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-balance text-4xl font-semibold lg:text-5xl"
                >
                    Mulai Bangun Sistem Komunikasi Anda
                </motion.h2>
                
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-6 text-lg text-muted-foreground"
                >
                    Tingkatkan efisiensi komunikasi bisnis Anda dengan platform WhatsApp API kami yang handal dan mudah diintegrasikan.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-8 flex flex-wrap justify-center gap-4"
                >
                    <Button asChild size="lg" className="w-full md:w-auto px-8">
                        <Link to="/">
                            <span>Mulai Sekarang</span>
                        </Link>
                    </Button>

                    <Button asChild size="lg" variant="outline" className="w-full md:w-auto px-8">
                        <Link to="/">
                            <span>Jadwalkan Demo</span>
                        </Link>
                    </Button>
                </motion.div>
            </motion.div>
        </section>
    )
}
