"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Building, Bell, Shield, Database } from "lucide-react"

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid gap-6">
        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>Dados cadastrais da transportadora</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Razão Social</Label>
                <Input id="company-name" defaultValue="TRL Transporte e Logística LTDA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" defaultValue="12.345.678/0001-90" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" defaultValue="contato@trltransporte.com.br" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" defaultValue="(11) 3456-7890" />
              </div>
            </div>
            <Button>Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configure os alertas do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Documentos</Label>
                <p className="text-sm text-muted-foreground">Receber notificações sobre documentos vencendo</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Manutenção</Label>
                <p className="text-sm text-muted-foreground">Receber notificações sobre manutenções programadas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Rodízio</Label>
                <p className="text-sm text-muted-foreground">Receber notificações diárias sobre rodízio</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="alert-days">Dias de antecedência para alertas</Label>
              <Input id="alert-days" type="number" defaultValue="15" className="w-24" />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>Configurações de acesso e senha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>
            <Button>Alterar Senha</Button>
          </CardContent>
        </Card>

        {/* API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Integração API
            </CardTitle>
            <CardDescription>Configurações para integração com sistemas externos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">URL da API</Label>
              <Input id="api-url" placeholder="https://api.exemplo.com.br/v1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">Chave de API</Label>
              <Input id="api-key" type="password" placeholder="••••••••••••" />
            </div>
            <Button variant="outline">Testar Conexão</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
