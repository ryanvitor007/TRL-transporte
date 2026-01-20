"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  LogOut,
  ChevronRight,
  Bell,
  Moon,
  HelpCircle,
} from "lucide-react";

export function DriverProfileView() {
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: Bell, label: "Notificacoes", badge: "3" },
    { icon: Moon, label: "Tema Escuro", toggle: true },
    { icon: HelpCircle, label: "Ajuda e Suporte" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informacoes pessoais
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-background flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Name and Role */}
            <h2 className="text-xl font-bold text-foreground">
              {user?.name || "Motorista"}
            </h2>
            <p className="text-muted-foreground mb-3">{user?.email}</p>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              Motorista Ativo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              Documentacao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">CNH</span>
              <span className="text-sm font-medium">12345678901</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Categoria</span>
              <Badge variant="outline">E</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Validade CNH
              </span>
              <span className="text-sm font-medium text-green-600">
                15/08/2027
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">MOPP</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Informacoes Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{user?.email || "email@trl.com"}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">(11) 98765-4321</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Sao Paulo, SP</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Admissao: 15/03/2022</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge variant="destructive" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 bg-transparent"
        onClick={logout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Sair da Conta
      </Button>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground">
        TRL Transporte v1.0.0
      </p>
    </div>
  );
}
