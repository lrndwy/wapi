import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export default function StatsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <section className="py-12 md:py-20">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                {/* <motion.div 
                    className="relative z-10 mx-auto max-w-xl space-y-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl font-medium lg:text-5xl">Platform yang Terpercaya</h2>
                    <p>Ribuan bisnis telah menggunakan platform kami untuk mengotomatisasi komunikasi WhatsApp mereka</p>
                </motion.div> */}

                <div ref={ref} className="grid gap-12 divide-y *:text-center md:grid-cols-4 md:gap-2 md:divide-x md:divide-y-0">
                    <motion.div 
                        className="space-y-4"
                        style={{
                            transform: isInView ? "none" : "translateY(20px)",
                            opacity: isInView ? 1 : 0,
                            transition: "all 0.5s cubic-bezier(0.17, 0.55, 0.55, 1) 0.1s"
                        }}
                    >
                        <div className="text-5xl font-bold">1000+</div>
                        <p>Pengguna Aktif</p>
                    </motion.div>
                    <motion.div 
                        className="space-y-4"
                        style={{
                            transform: isInView ? "none" : "translateY(20px)",
                            opacity: isInView ? 1 : 0,
                            transition: "all 0.5s cubic-bezier(0.17, 0.55, 0.55, 1) 0.2s"
                        }}
                    >
                        <div className="text-5xl font-bold">5M+</div>
                        <p>Pesan Terkirim</p>
                    </motion.div>
                    <motion.div 
                        className="space-y-4"
                        style={{
                            transform: isInView ? "none" : "translateY(20px)",
                            opacity: isInView ? 1 : 0,
                            transition: "all 0.5s cubic-bezier(0.17, 0.55, 0.55, 1) 0.3s"
                        }}
                    >
                        <div className="text-5xl font-bold">99.9%</div>
                        <p>Uptime</p>
                    </motion.div>
                    <motion.div 
                        className="space-y-4"
                        style={{
                            transform: isInView ? "none" : "translateY(20px)",
                            opacity: isInView ? 1 : 0,
                            transition: "all 0.5s cubic-bezier(0.17, 0.55, 0.55, 1) 0.4s"
                        }}
                    >
                        <div className="text-5xl font-bold">24/7</div>
                        <p>Dukungan</p>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
