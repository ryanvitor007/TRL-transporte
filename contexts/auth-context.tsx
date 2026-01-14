"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type UserRole = "admin" | "motorista";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cpf?: string;
  cnh?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: { email: string; password: string; user: User }[] = [
  {
    email: "admin@trl.com",
    password: "admin123",
    user: {
      id: "1",
      name: "Administrador",
      email: "admin@trl.com",
      role: "admin",
    },
  },
  {
    email: "joao@trl.com",
    password: "motorista123",
    user: {
      id: "d1",
      name: "João Pereira",
      email: "joao@trl.com",
      role: "motorista",
      cpf: "123.456.789-00",
      cnh: "12345678901",
    },
  },
  {
    email: "carlos@trl.com",
    password: "motorista123",
    user: {
      id: "d2",
      name: "Carlos Silva",
      email: "carlos@trl.com",
      role: "motorista",
      cpf: "234.567.890-11",
      cnh: "23456789012",
    },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const savedUser = localStorage.getItem("trl_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Replace with actual API call
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   body: JSON.stringify({ email, password }),
    // })
    // const data = await response.json()
    // if (data.success) {
    //   setUser(data.user)
    //   localStorage.setItem("trl_user", JSON.stringify(data.user))
    //   return true
    // }
    // return false

    // Mock validation - check against mock users
    const foundUser = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      setUser(foundUser.user);
      localStorage.setItem("trl_user", JSON.stringify(foundUser.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("trl_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
