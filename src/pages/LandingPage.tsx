import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ChevronRight,
  MessageCircle,
  Zap,
  Shield,
  BarChart,
  Code,
  Users,
  Globe,
  Laptop,
  Phone,
  Clock,
  ArrowRight,
  Star
} from "lucide-react";
import { useEffect } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import Features from "@/components/ui/features-1";
import StatsSection from "@/components/ui/stats";
import FooterSection from '@/components/ui/footer';
import Pricing from "@/components/ui/pricing";
import FAQs from "@/components/ui/faq";
import HeroSection from '@/components/ui/hero-sections'
import CallToAction from '@/components/ui/cta'
// Tambahkan komponen Counter
function Counter({ from, to, duration = 2 }: { from: number; to: number; duration?: number }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, to, { duration });
    return controls.stop;
  }, [count, to, duration]);

  return <motion.span>{rounded}</motion.span>;
}

export function LandingPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const pricingPlans = [
    {
      name: "Starter",
      price: "Rp 99.000",
      period: "/bulan",
      features: [
        "1 Nomor WhatsApp",
        "1.000 pesan/bulan",
        "Webhook basic",
        "Support email"
      ],
      recommended: false
    },
    {
      name: "Professional",
      price: "Rp 299.000",
      period: "/bulan",
      features: [
        "5 Nomor WhatsApp",
        "10.000 pesan/bulan",
        "Webhook advanced",
        "Support prioritas",
        "API rate limit lebih tinggi",
        "Dashboard analitik"
      ],
      recommended: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: [
        "Unlimited nomor WhatsApp",
        "Unlimited pesan",
        "Webhook custom",
        "Dedicated support",
        "Custom integration",
        "SLA guarantee"
      ],
      recommended: false
    }
  ];

  const stats = [
    {
      number: 1000,
      suffix: "+",
      label: "Pengguna Aktif",
      icon: <Users className="w-8 h-8" />,
      description: "Bisnis telah mempercayai platform kami"
    },
    {
      number: 5000000,
      suffix: "+",
      label: "Pesan Terkirim",
      icon: <MessageCircle className="w-8 h-8" />,
      description: "Pesan berhasil terkirim setiap bulan"
    },
    {
      number: 99.9,
      suffix: "%",
      label: "Uptime",
      icon: <Shield className="w-8 h-8" />,
      description: "Ketersediaan layanan yang terjamin"
    },
    {
      number: 24,
      suffix: "/7",
      label: "Dukungan",
      icon: <Clock className="w-8 h-8" />,
      description: "Tim support siap membantu Anda"
    }
  ];

  const testimonials = [
    {
      quote: "WhatsApp API ini sangat membantu bisnis kami dalam berkomunikasi dengan pelanggan secara efisien. Integrasi yang mudah dan fitur yang lengkap membuat proses automasi pesan menjadi sangat simpel.",
      name: "Ahmad Rizki",
      title: "CEO, TechCorp Indonesia"
    },
    {
      quote: "Kami telah menghemat banyak waktu sejak menggunakan platform ini. Fitur webhook dan API yang powerful memungkinkan kami mengotomatisasi seluruh proses komunikasi dengan pelanggan.",
      name: "Siti Rahma",
      title: "Marketing Manager, Digital Marketing ID"
    },
    {
      quote: "Layanan support yang responsif dan dokumentasi API yang sangat jelas. Tim technical support selalu siap membantu ketika kami membutuhkan bantuan dalam integrasi.",
      name: "Budi Santoso",
      title: "Product Owner, E-Commerce Solutions"
    },
    {
      quote: "Platform yang sangat stabil dengan uptime luar biasa. Kami belum pernah mengalami gangguan sejak menggunakan layanan ini untuk sistem notifikasi kami.",
      name: "Diana Putri",
      title: "CTO, Fintech Solutions"
    },
    {
      quote: "Fitur multi-account sangat membantu kami mengelola berbagai lini bisnis. Dashboard yang intuitif membuat monitoring pesan menjadi sangat mudah.",
      name: "Rudi Hermawan",
      title: "Operations Manager, Retail Group"
    }
  ];

  const integrations = [
    { icon: <Code className="w-6 h-6" />, name: "REST API" },
    { icon: <Globe className="w-6 h-6" />, name: "Webhook" },
    { icon: <Laptop className="w-6 h-6" />, name: "Dashboard" },
    { icon: <Phone className="w-6 h-6" />, name: "Mobile Ready" }
  ];

  return (
    <div className="min-h-screen">
      {/* Ganti navbar dan hero section dengan HeroSection */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section - Diganti dengan komponen Features baru */}
      <Features />

      {/* Testimonials Section */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Apa Kata Mereka?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Testimoni dari pengguna yang telah mempercayai platform kami
            </p>
          </motion.div>
        </div>

        <div className="relative">
          {/* First row */}
          <div>
            <InfiniteMovingCards
              items={testimonials}
              direction="left"
              speed="slow"
            />
          </div>

          {/* Second row */}
          <div>
            <InfiniteMovingCards
              items={[
                // Tambahkan testimonial berbeda untuk variasi
                {
                  quote: "Dashboard analitik yang sangat membantu dalam monitoring performa pesan. Kami bisa melihat engagement rate dengan mudah.",
                  name: "Linda Wijaya",
                  title: "Digital Marketing Lead, Tech Startup"
                },
                {
                  quote: "Fitur webhook sangat reliable. Integrasi dengan sistem internal kami berjalan lancar tanpa kendala.",
                  name: "Hendra Susanto",
                  title: "System Architect, Payment Gateway"
                },
                {
                  quote: "Rate limit yang tinggi dan stabilitas sistem yang luar biasa. Perfect untuk kebutuhan enterprise.",
                  name: "Dewi Pratiwi",
                  title: "Head of Engineering, E-commerce Platform"
                },
                // ... tambahkan 2-3 testimonial lagi untuk row kedua
              ]}
              direction="right"
              speed="slow"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/register">
              <Button variant="outline" size="lg" className="gap-2">
                Bergabung Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="bg-gradient-to-r from-zinc-200 to-zinc-100">

        {/* FAQ Section - diganti dengan komponen FAQs */}
        <FAQs />

        {/* Pricing Section */}
        <Pricing />

        {/* CTA Section */}
        <CallToAction />

        {/* Footer */}
        <FooterSection />
      </div>


    </div>
  );
} 