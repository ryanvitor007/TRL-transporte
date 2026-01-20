"use client";

import type React from "react";
import { Loader2 } from "lucide-react"; // Import Loader2

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Truck,
  Shield,
  BarChart3,
  ChevronLeft,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToastNotification } from "@/contexts/notification-context";
import { useAuth } from "@/contexts/auth-context";
import { useMobile } from "@/hooks/use-mobile";
import { LoaderTRL } from "@/components/ui/custom-loader";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToastNotification();
  const { login, isAuthenticated, user } = useAuth();
  const isMobile = useMobile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mobile welcome screen state
  const [showMobileForm, setShowMobileForm] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "motorista") {
        router.push("/motorista");
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Erro de Validação", "Por favor, preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      toast.error(
        "Erro de Validação",
        "A senha deve ter pelo menos 6 caracteres.",
      );
      return;
    }

    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      toast.success("Login Realizado", "Bem-vindo de volta!");
      // Redirect is handled by useEffect above based on role
    } else {
      toast.error("Erro de Login", "Credenciais inválidas. Tente novamente.");
      setIsLoading(false);
    }
  };

  // Mobile Welcome Screen
  if (isMobile && !showMobileForm) {
    return (
      <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="mobile-grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mobile-grid)" />
          </svg>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
          {/* Logo */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
              <Image
                src="/images/image.png"
                alt="TRL Transporte"
                width={96}
                height={96}
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Bem-vindo, Parceiro
            </h1>
            <p className="text-lg text-zinc-400 max-w-xs">
              Sistema de Gestao de Frota TRL Transporte
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-zinc-400">Jornada</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-zinc-400">Seguranca</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-zinc-400">Relatorios</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 p-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <Button
            onClick={() => setShowMobileForm(true)}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/25 transition-all duration-300 active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5 mr-3" />
            Acessar minha conta
          </Button>
        </div>
      </div>
    );
  }

  // Mobile Form Screen
  if (isMobile && showMobileForm) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileForm(false)}
            className="rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Image
              src="/images/image.png"
              alt="TRL Transporte"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="font-semibold text-foreground">
              TRL Transporte
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto px-6 py-8">
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-foreground">Entrar</h2>
            <p className="text-muted-foreground">
              Digite suas credenciais para acessar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="mobile-email" className="text-foreground">
                Email ou ID
              </Label>
              <Input
                id="mobile-email"
                type="text"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-base bg-background border-input focus:border-primary focus:ring-primary rounded-xl"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="mobile-password" className="text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="mobile-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 text-base pr-14 bg-background border-input focus:border-primary focus:ring-primary rounded-xl"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="mobile-remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  disabled={isLoading}
                  className="w-5 h-5"
                />
                <Label
                  htmlFor="mobile-remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Lembrar-me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl mt-4"
              disabled={isLoading}
            >
              {isLoading ? <LoaderTRL size="sm" /> : "Entrar"}
            </Button>
          </form>

          {/* Test Credentials */}
          <div className="mt-8 rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Credenciais de Teste:
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium">Admin:</span> admin@trl.com /
                admin123
              </p>
              <p>
                <span className="font-medium">Motorista:</span> joao@trl.com /
                motorista123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t border-border">
          <p className="text-xs text-muted-foreground">
            Problemas para acessar?{" "}
            <a href="#" className="font-medium text-primary">
              Contate o suporte
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Desktop Layout (unchanged)
  return (
    <div className="flex min-h-screen">
      {/* Left Side - Dark Professional Area */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-sidebar overflow-hidden">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-white"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-sidebar-accent opacity-90" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-sidebar-foreground">
          {/* Logo and Title */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/image.png"
                alt="TRL Transporte"
                width={56}
                height={56}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold">TRL Transporte</h1>
                <p className="text-sm text-sidebar-foreground/70">
                  Sistema de Gestão de Frota
                </p>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight text-balance">
              Gerencie sua frota com eficiência e controle total
            </h2>
            <p className="text-lg text-sidebar-foreground/80 max-w-md text-pretty">
              Monitoramento em tempo real, controle de documentos, manutenções
              preventivas e muito mais em uma única plataforma.
            </p>

            {/* Features */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary/20">
                  <Truck className="h-5 w-5 text-sidebar-primary" />
                </div>
                <div>
                  <p className="font-medium">Gestão Completa da Frota</p>
                  <p className="text-sm text-sidebar-foreground/70">
                    Controle todos os veículos em um só lugar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary/20">
                  <Shield className="h-5 w-5 text-sidebar-primary" />
                </div>
                <div>
                  <p className="font-medium">Documentação em Dia</p>
                  <p className="text-sm text-sidebar-foreground/70">
                    Alertas de vencimento automáticos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary/20">
                  <BarChart3 className="h-5 w-5 text-sidebar-primary" />
                </div>
                <div>
                  <p className="font-medium">Análise de Custos</p>
                  <p className="text-sm text-sidebar-foreground/70">
                    TCO e relatórios financeiros detalhados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-sidebar-foreground/60">
            © 2026 TRL Transporte. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <Image
              src="/images/image.png"
              alt="TRL Transporte"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-foreground">
              TRL Transporte
            </span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-muted-foreground">
              Por favor, faça login em sua conta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email ou ID
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background border-input focus:border-primary focus:ring-primary"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12 bg-background border-input focus:border-primary focus:ring-primary"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Lembrar-me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Credenciais de Teste:
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium">Admin:</span> admin@trl.com /
                admin123
              </p>
              <p>
                <span className="font-medium">Motorista:</span> joao@trl.com /
                motorista123
              </p>
            </div>
          </div>

          {/* Support Info */}
          <p className="text-center text-sm text-muted-foreground">
            Problemas para acessar?{" "}
            <a
              href="#"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Contate o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
