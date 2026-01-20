"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Shield,
  LogOut,
  ChevronRight,
  Bell,
  Moon,
  Sun,
  UserCog,
  AlertTriangle,
  Clock,
  Wrench,
  FileText,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";

// Simulated data for tachograph check
const mockTodayTachograph = false; // Change to true to simulate having a tachograph entry today

export function DriverProfileView() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // --- MODAL STATES ---
  const [isPersonalDataOpen, setIsPersonalDataOpen] = useState(false);

  // --- FORM STATES ---
  const [phone, setPhone] = useState("(11) 98765-4321");
  const [email, setEmail] = useState(user?.email || "email@trl.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NOTIFICATION PREFERENCES ---
  const [notifTachograph, setNotifTachograph] = useState(true);
  const [notifCNH, setNotifCNH] = useState(true);
  const [notifMaintenance, setNotifMaintenance] = useState(true);

  // --- ALERTS BASED ON NOTIFICATIONS ---
  const [alerts, setAlerts] = useState<string[]>([]);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulated notification logic
  useEffect(() => {
    const newAlerts: string[] = [];

    // Check tachograph (if notification is enabled)
    if (notifTachograph && !mockTodayTachograph) {
      const now = new Date();
      const hour = now.getHours();
      // Alert if it's past 18h and no tachograph entry today
      if (hour >= 18) {
        newAlerts.push("Voce ainda nao lancou o tacografo hoje!");
      }
    }

    // Simulated CNH expiration check (30 days before)
    if (notifCNH) {
      // Simulate CNH expiring in 25 days
      const cnhExpirationDays = 25;
      if (cnhExpirationDays <= 30) {
        newAlerts.push(`Sua CNH vence em ${cnhExpirationDays} dias`);
      }
    }

    // Simulated maintenance check
    if (notifMaintenance) {
      // Simulate having pending maintenance
      const hasPendingMaintenance = true;
      if (hasPendingMaintenance) {
        newAlerts.push("Voce tem manutencoes pendentes aguardando atualizacao");
      }
    }

    setAlerts(newAlerts);
  }, [notifTachograph, notifCNH, notifMaintenance]);

  const handleSavePersonalData = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsPersonalDataOpen(false);
    // Reset password fields
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Don't render theme toggle until mounted to avoid hydration mismatch
  const isDarkMode = mounted && theme === "dark";

  return (
    <div className="space-y-6 pb-8">
      {/* Alert Banner (if any) */}
      {alerts.length > 0 && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-destructive">Atencao!</p>
              <ul className="space-y-1">
                {alerts.map((alert, i) => (
                  <li
                    key={i}
                    className="text-sm text-destructive/90 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-destructive/70" />
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informacoes e preferencias
        </p>
      </div>

      {/* Profile Card - Large Avatar */}
      <Card className="overflow-hidden">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center">
            {/* Large Avatar */}
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <span className="text-3xl font-bold text-primary">
                  {getInitials(user?.name || "Motorista")}
                </span>
              </div>
              {/* Status indicator */}
              <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-background flex items-center justify-center shadow-lg">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Name and Role */}
            <h2 className="text-xl font-bold text-foreground">
              {user?.name || "Motorista"}
            </h2>
            <p className="text-muted-foreground mb-3">{user?.email}</p>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1">
              <Shield className="w-3 h-3 mr-1" />
              Motorista
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Sections */}
      <div className="space-y-3">
        {/* 1. Dados Pessoais & Seguranca */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setIsPersonalDataOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <UserCog className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">
                  Dados Pessoais e Seguranca
                </p>
                <p className="text-sm text-muted-foreground">
                  Telefone, email e senha
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </Card>

        {/* 2. Aparencia (Tema) */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                {isDarkMode ? (
                  <Moon className="h-6 w-6" />
                ) : (
                  <Sun className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">Aparencia</p>
                <p className="text-sm text-muted-foreground">
                  {isDarkMode ? "Tema Escuro" : "Tema Claro"}
                </p>
              </div>
            </div>
            {mounted && (
              <Switch
                checked={isDarkMode}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
                className="data-[state=checked]:bg-purple-600"
              />
            )}
          </div>
        </Card>

        {/* 3. Central de Notificacoes */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Bell className="h-5 w-5" />
              </div>
              Central de Notificacoes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure alertas para nao esquecer o essencial
            </p>

            {/* Tachograph Reminder */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Lembrete de Tacografo</p>
                  <p className="text-xs text-muted-foreground">
                    Alertar se nao houver lancamento ate as 18h
                  </p>
                </div>
              </div>
              <Switch
                checked={notifTachograph}
                onCheckedChange={setNotifTachograph}
              />
            </div>

            <Separator />

            {/* CNH Expiration */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Vencimento de CNH</p>
                  <p className="text-xs text-muted-foreground">
                    Avisar 30 dias antes do vencimento
                  </p>
                </div>
              </div>
              <Switch checked={notifCNH} onCheckedChange={setNotifCNH} />
            </div>

            <Separator />

            {/* Maintenance Updates */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Manutencao Pendente</p>
                  <p className="text-xs text-muted-foreground">
                    Notificar atualizacoes nos meus chamados
                  </p>
                </div>
              </div>
              <Switch
                checked={notifMaintenance}
                onCheckedChange={setNotifMaintenance}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Documentacao
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">CNH</span>
            <span className="text-sm font-medium font-mono">
              {user?.cnh || "12345678901"}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Categoria</span>
            <Badge variant="outline">E</Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Validade CNH</span>
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              15/02/2026
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">MOPP</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
              Ativo
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Admissao</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              15/03/2022
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full h-14 text-base font-semibold gap-2"
        onClick={logout}
      >
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </Button>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        TRL Transporte v1.0.0
      </p>

      {/* DIALOG: DADOS PESSOAIS & SEGURANCA */}
      <Dialog open={isPersonalDataOpen} onOpenChange={setIsPersonalDataOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] p-0 flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle>Dados Pessoais e Seguranca</DialogTitle>
            <DialogDescription>
              Atualize suas informacoes de contato e senha
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6">
            <div className="space-y-6 pb-4">
              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Informacoes de Contato
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-12"
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Password Change */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Alterar Senha
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-12 pr-10"
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 pr-10"
                      placeholder="Digite a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pr-10"
                      placeholder="Confirme a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {newPassword &&
                    confirmPassword &&
                    newPassword !== confirmPassword && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <X className="h-3 w-3" />
                        As senhas nao coincidem
                      </p>
                    )}
                  {newPassword &&
                    confirmPassword &&
                    newPassword === confirmPassword && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Senhas coincidem
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 p-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsPersonalDataOpen(false)}
              className="flex-1 sm:flex-none h-12 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePersonalData}
              disabled={
                isSubmitting ||
                (newPassword !== "" && newPassword !== confirmPassword)
              }
              className="flex-1 sm:flex-none h-12"
            >
              {isSubmitting ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
