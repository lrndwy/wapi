import { LoginForm } from "@/components/auth/LoginForm";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
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
          <h1 className="text-2xl font-bold">Selamat Datang Kembali</h1>
          <p className="text-muted-foreground mt-2">Silakan masuk ke akun Anda</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <LoginForm onSubmit={handleLogin} error={error} />
        </motion.div>
        <motion.p 
          className="text-center mt-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Belum punya akun?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
} 