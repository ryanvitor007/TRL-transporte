"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { loginAPI } from "@/lib/api-service";

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
      id: "00000000-0000-4000-b000-000000000001",
      name: "Administrador",
      email: "admin@trl.com",
      role: "admin",
    },
  },
  {
    email: "joao@trl.com",
    password: "motorista123",
    user: {
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
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
      id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      name: "Carlos Silva",
      email: "carlos@trl.com",
      role: "motorista",
      cpf: "234.567.890-11",
      cnh: "23456789012",
    },
  },
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ensureUUID = (id: string | number | undefined | null, fallbackUuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"): string => {
  if (!id) return fallbackUuid;
  const strId = String(id).trim();
  if (UUID_REGEX.test(strId)) return strId;

  const knownMap: Record<string, string> = {
    "1": "11111111-1111-4111-b111-111111111101",
    "2": "22222222-2222-4222-b222-222222222202",
    "3": "33333333-3333-4333-b333-333333333303",
    "4": "44444444-4444-4444-b444-444444444404",
    "5": "55555555-5555-4555-b555-555555555505",
    "6": "66666666-6666-4666-b666-666666666606",
    "v1": "11111111-1111-4111-b111-111111111101",
    "v2": "22222222-2222-4222-b222-222222222202",
    "v3": "33333333-3333-4333-b333-333333333303",
    "d1": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "d2": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    "d3": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    "d4": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80",
    "d5": "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091",
    "d6": "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102",
  };

  if (knownMap[strId]) return knownMap[strId];

  const clean = strId.replace(/[^0-9a-f]/gi, "");
  const hex = (clean || "0").padStart(12, "0").slice(-12);
  return `00000000-0000-4000-8000-${hex}`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const savedUser = localStorage.getItem("trl_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          const sanitizedUser: User = {
            ...parsed,
            id: ensureUUID(parsed.id, "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"),
          };
          setUser(sanitizedUser);
          localStorage.setItem("trl_user", JSON.stringify(sanitizedUser));
        }
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Chamada real à API
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const data = await loginAPI({ email: trimmedEmail, password: trimmedPassword });
      const token =
        data.token || data.accessToken || data.access_token || data.jwt;

      // Mapeia a resposta do banco para o formato de usuário do front-end
      const userObj = data.user || data;
      const rawId = userObj.id || userObj.sub || userObj.userId;
      const userData: User = {
        id: ensureUUID(rawId, "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"),
        name: userObj.name || userObj.nome || "Motorista",
        email: userObj.email || email,
        role: (userObj.role || "motorista").toLowerCase() as UserRole,
        cpf: userObj.cpf,
        cnh: userObj.cnh,
      };

      setUser(userData);
      localStorage.setItem("trl_user", JSON.stringify(userData));
      if (token) {
        localStorage.setItem("trl_auth_token", token);
      }
      return true;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("trl_user");
    localStorage.removeItem("trl_auth_token");
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
