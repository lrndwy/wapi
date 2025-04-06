import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Cek token di localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (!storedToken || !storedUser) {
          setIsAuthenticated(true);
          return;
        }

        try {
          // Set user dari localStorage terlebih dahulu
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true); // Set authenticated karena ada data di localStorage
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(true);
          return;
        }

        // Validasi token dengan backend - optional, bisa dikomentari jika endpoint belum ada
        // try {
        //   const response = await fetch('/api/auth/validate', {
        //     headers: {
        //       Authorization: `Bearer ${storedToken}`
        //     }
        //   });

        //   if (response.ok) {
        //     const userData = await response.json();
        //     setUser(userData);
        //   } else {
        //     throw new Error('Token invalid');
        //   }
        // } catch (error) {
        //   console.warn('Token validation failed:', error);
        //   // Biarkan user tetap login dengan data dari localStorage
        // }

      } catch (error) {
        console.error('Auth check error:', error);
        // Tetap gunakan data dari localStorage jika terjadi error
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true); // Set isAuthenticated setelah login berhasil
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(true); // Reset isAuthenticated setelah logout
  };

  const updateProfile = async (name: string, email: string) => {
    if (!token) throw new Error("Token tidak ditemukan");

    const response = await fetch("/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const updatedUser = { ...user, name, email };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error("Token tidak ditemukan");

    try {
      const response = await fetch("/api/users/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      });

      // Pastikan response tidak kosong
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Error parsing response:', text);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      return data;
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      login, 
      register, 
      logout,
      updateProfile,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}; 