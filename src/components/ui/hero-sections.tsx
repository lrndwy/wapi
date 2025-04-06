'use client'
import React from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/logo'
import { ArrowRight, Menu, Rocket, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const menuItems = [
    { name: 'Fitur', to: 'features' },
    { name: 'Solusi', to: 'solution' },
    { name: 'Harga', to: 'pricing' },
    { name: 'FAQ', to: 'faq' },
]

export default function HeroSection() {
    const [menuState, setMenuState] = React.useState(false)

    const handleScroll = (id: string) => {
        setMenuState(false) // Tutup menu mobile jika terbuka
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }
    }

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    }

    const staggerChildren = {
        animate: {
            transition: {
                delayChildren: 0.4,
                staggerChildren: 0.1
            }
        }
    }

    return (
        <>
            <header className="h-[72px]">
                <nav data-state={menuState && 'active'} className="fixed z-50 w-full border-b border-dashed bg-white/80 backdrop-blur-md">
                    <div className="m-auto max-w-5xl px-6">
                        <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex w-full justify-between lg:w-auto"
                            >
                                <Link to="/" aria-label="home" className="flex items-center space-x-2">
                                    <Logo />
                                </Link>

                                <button onClick={() => setMenuState(!menuState)} aria-label={menuState == true ? 'Close Menu' : 'Open Menu'} className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                    <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                    <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                                </button>
                            </motion.div>

                            <motion.div 
                                variants={staggerChildren}
                                initial="initial"
                                animate="animate"
                                className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent"
                            >
                                <div className="lg:pr-4">
                                    <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                                        {menuItems.map((item, index) => (
                                            <motion.li 
                                                key={index}
                                                variants={fadeIn}
                                            >
                                                <button 
                                                    onClick={() => handleScroll(item.to)}
                                                    className="text-muted-foreground hover:text-accent-foreground block duration-150 w-full text-left"
                                                >
                                                    <span>{item.name}</span>
                                                </button>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                <motion.div 
                                    variants={fadeIn}
                                    className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:pl-6"
                                >
                                    <Button asChild variant="outline" size="sm">
                                        <Link to="/login">
                                            <span>Login</span>
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link to="/register">
                                            <span>Register</span>
                                        </Link>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </nav>
            </header>
            <main className="overflow-hidden">
                <section className="relative">
                    <div className="relative py-24 lg:py-28">
                        <div className="mx-auto max-w-7xl px-6 md:px-12">
                            <motion.div 
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-center sm:mx-auto sm:w-10/12 lg:mr-auto lg:mt-0 lg:w-4/5"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    <Link to="/" className="rounded-(--radius) mx-auto flex w-fit items-center gap-2 border p-1 pr-3">
                                        <span className="bg-muted rounded-[calc(var(--radius)-0.25rem)] px-2 py-1 text-xs">Baru</span>
                                        <span className="text-sm">WhatsApp API untuk Bisnis Anda</span>
                                        <span className="bg-(--color-border) block h-4 w-px"></span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </motion.div>

                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="mt-8 text-4xl font-semibold md:text-5xl xl:text-5xl xl:[line-height:1.125]"
                                >
                                    Otomatisasi Komunikasi <br /> WhatsApp Bisnis Anda
                                </motion.h1>
                                <motion.p 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="mx-auto mt-8 hidden max-w-2xl text-wrap text-lg sm:block"
                                >
                                    Platform WhatsApp API yang powerful dengan fitur lengkap untuk mengotomatisasi 
                                    komunikasi bisnis Anda. Integrasi mudah, performa tinggi, dan dukungan 24/7.
                                </motion.p>
                                <motion.p 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="mx-auto mt-6 max-w-2xl text-wrap sm:hidden"
                                >
                                    Solusi WhatsApp API terpercaya untuk mengotomatisasi komunikasi bisnis Anda.
                                </motion.p>

                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                    className="mt-8 flex justify-center gap-4"
                                >
                                    <Button size="lg" asChild>
                                        <Link to="#">
                                            <Rocket className="relative size-4 mr-2" />
                                            <span className="text-nowrap">Mulai Sekarang</span>
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <Link to="#">
                                            <span className="text-nowrap">Jadwalkan Demo</span>
                                        </Link>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}
