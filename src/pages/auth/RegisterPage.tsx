import { RegisterForm } from "@/components/auth/RegisterForm";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      await register(email, password, name);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative">
      <div>
        <Link 
          to="/"
          className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali</span>
        </Link>
      </div>
      <motion.div 
        className="w-full max-w-[350px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
          <p className="text-muted-foreground mt-2">Silakan daftar untuk membuat akun</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <RegisterForm onSubmit={handleRegister} error={error} />
        </motion.div>
        <motion.p 
          className="text-center mt-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}