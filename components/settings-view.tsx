"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building,
  Bell,
  Shield,
  Database,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useToastNotification } from "@/contexts/toast-context";

interface DriverFormData {
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cnh: string;
  cnhCategory: string;
  cnhExpiry: string;
  mopp: boolean;
  moppExpiry: string;
  admissionDate: string;
  branch: string;
  password: string;
}

const initialDriverForm: DriverFormData = {
  name: "",
  cpf: "",
  rg: "",
  birthDate: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  cnh: "",
  cnhCategory: "",
  cnhExpiry: "",
  mopp: false,
  moppExpiry: "",
  admissionDate: "",
  branch: "",
  password: "",
};

// Mock drivers data
const mockDriversList = [
  {
    id: "d1",
    name: "João Pereira",
    cpf: "123.456.789-00",
    cnh: "12345678901",
    cnhCategory: "E",
    cnhExpiry: "2027-05-15",
    phone: "(11) 99999-1111",
    branch: "São Paulo",
    status: "Ativo",
  },
  {
    id: "d2",
    name: "Carlos Silva",
    cpf: "234.567.890-11",
    cnh: "23456789012",
    cnhCategory: "E",
    cnhExpiry: "2026-08-20",
    phone: "(11) 99999-2222",
    branch: "São Paulo",
    status: "Ativo",
  },
  {
    id: "d3",
    name: "Roberto Mendes",
    cpf: "345.678.901-22",
    cnh: "34567890123",
    cnhCategory: "D",
    cnhExpiry: "2028-01-10",
    phone: "(81) 99999-3333",
    branch: "Recife",
    status: "Ativo",
  },
  {
    id: "d4",
    name: "Antonio Costa",
    cpf: "456.789.012-33",
    cnh: "45678901234",
    cnhCategory: "E",
    cnhExpiry: "2026-11-30",
    phone: "(81) 99999-4444",
    branch: "Recife",
    status: "Inativo",
  },
];

export function SettingsView() {
  const toast = useToastNotification();
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [driverForm, setDriverForm] =
    useState<DriverFormData>(initialDriverForm);
  const [drivers, setDrivers] = useState(mockDriversList);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const handleInputChange = (
    field: keyof DriverFormData,
    value: string | boolean
  ) => {
    let formattedValue = value;

    if (typeof value === "string") {
      if (field === "cpf") formattedValue = formatCPF(value);
      if (field === "phone") formattedValue = formatPhone(value);
      if (field === "zipCode") formattedValue = formatZipCode(value);
    }

    setDriverForm((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmitDriver = async () => {
    // Validation
    if (
      !driverForm.name ||
      !driverForm.cpf ||
      !driverForm.cnh ||
      !driverForm.email
    ) {
      toast.error(
        "Erro de Validação",
        "Preencha todos os campos obrigatórios."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/drivers', {
      //   method: editingDriverId ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...driverForm,
      //     id: editingDriverId || undefined,
      //   }),
      // })
      // const data = await response.json()

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingDriverId) {
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === editingDriverId
              ? {
                  ...d,
                  name: driverForm.name,
                  cpf: driverForm.cpf,
                  cnh: driverForm.cnh,
                  cnhCategory: driverForm.cnhCategory,
                  cnhExpiry: driverForm.cnhExpiry,
                  phone: driverForm.phone,
                  branch: driverForm.branch,
                }
              : d
          )
        );
        toast.success("Sucesso", "Motorista atualizado com sucesso!");
      } else {
        const newDriver = {
          id: `d${drivers.length + 1}`,
          name: driverForm.name,
          cpf: driverForm.cpf,
          cnh: driverForm.cnh,
          cnhCategory: driverForm.cnhCategory,
          cnhExpiry: driverForm.cnhExpiry,
          phone: driverForm.phone,
          branch: driverForm.branch,
          status: "Ativo",
        };
        setDrivers((prev) => [...prev, newDriver]);
        toast.success("Sucesso", "Motorista cadastrado com sucesso!");
      }

      setDriverForm(initialDriverForm);
      setEditingDriverId(null);
      setIsDriverDialogOpen(false);
    } catch {
      toast.error("Erro", "Falha ao salvar motorista.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDriver = (driver: (typeof mockDriversList)[0]) => {
    setDriverForm({
      ...initialDriverForm,
      name: driver.name,
      cpf: driver.cpf,
      cnh: driver.cnh,
      cnhCategory: driver.cnhCategory,
      cnhExpiry: driver.cnhExpiry,
      phone: driver.phone,
      branch: driver.branch,
    });
    setEditingDriverId(driver.id);
    setIsDriverDialogOpen(true);
  };

  const handleDeleteDriver = async (driverId: string) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/drivers/${driverId}`, { method: 'DELETE' })

    setDrivers((prev) => prev.filter((d) => d.id !== driverId));
    toast.success("Sucesso", "Motorista removido com sucesso!");
  };

  const getCNHStatusBadge = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      return <Badge variant="destructive">Vencida</Badge>;
    } else if (daysUntil <= 30) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Vencendo
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Válida
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Cadastro de Motoristas
                </CardTitle>
                <CardDescription>
                  Gerencie os motoristas da frota
                </CardDescription>
              </div>
              <Dialog
                open={isDriverDialogOpen}
                onOpenChange={setIsDriverDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setDriverForm(initialDriverForm);
                      setEditingDriverId(null);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Motorista
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDriverId
                        ? "Editar Motorista"
                        : "Cadastrar Novo Motorista"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingDriverId
                        ? "Atualize os dados do motorista"
                        : "Preencha os dados para cadastrar um novo motorista"}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 py-4">
                    {/* Dados Pessoais */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">
                        Dados Pessoais
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            Nome Completo{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="name"
                            placeholder="Ex: João da Silva"
                            value={driverForm.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cpf">
                            CPF <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            value={driverForm.cpf}
                            onChange={(e) =>
                              handleInputChange("cpf", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="rg">RG</Label>
                          <Input
                            id="rg"
                            placeholder="00.000.000-0"
                            value={driverForm.rg}
                            onChange={(e) =>
                              handleInputChange("rg", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="birthDate">Data de Nascimento</Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={driverForm.birthDate}
                            onChange={(e) =>
                              handleInputChange("birthDate", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            placeholder="(00) 00000-0000"
                            value={driverForm.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          E-mail <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="motorista@trl.com"
                          value={driverForm.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">
                        Endereço
                      </h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="address">Endereço</Label>
                          <Input
                            id="address"
                            placeholder="Rua, número, complemento"
                            value={driverForm.address}
                            onChange={(e) =>
                              handleInputChange("address", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">CEP</Label>
                          <Input
                            id="zipCode"
                            placeholder="00000-000"
                            value={driverForm.zipCode}
                            onChange={(e) =>
                              handleInputChange("zipCode", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            placeholder="São Paulo"
                            value={driverForm.city}
                            onChange={(e) =>
                              handleInputChange("city", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">Estado</Label>
                          <Select
                            value={driverForm.state}
                            onValueChange={(v) => handleInputChange("state", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Documentação */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">
                        Documentação
                      </h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="cnh">
                            Número da CNH{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="cnh"
                            placeholder="00000000000"
                            value={driverForm.cnh}
                            onChange={(e) =>
                              handleInputChange("cnh", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cnhCategory">Categoria</Label>
                          <Select
                            value={driverForm.cnhCategory}
                            onValueChange={(v) =>
                              handleInputChange("cnhCategory", v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                              <SelectItem value="D">D</SelectItem>
                              <SelectItem value="E">E</SelectItem>
                              <SelectItem value="AB">AB</SelectItem>
                              <SelectItem value="AC">AC</SelectItem>
                              <SelectItem value="AD">AD</SelectItem>
                              <SelectItem value="AE">AE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cnhExpiry">Validade CNH</Label>
                          <Input
                            id="cnhExpiry"
                            type="date"
                            value={driverForm.cnhExpiry}
                            onChange={(e) =>
                              handleInputChange("cnhExpiry", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <Label>MOPP (Produtos Perigosos)</Label>
                            <p className="text-sm text-muted-foreground">
                              Habilitação para transporte de cargas perigosas
                            </p>
                          </div>
                          <Switch
                            checked={driverForm.mopp}
                            onCheckedChange={(checked) =>
                              handleInputChange("mopp", checked)
                            }
                          />
                        </div>
                        {driverForm.mopp && (
                          <div className="space-y-2">
                            <Label htmlFor="moppExpiry">Validade MOPP</Label>
                            <Input
                              id="moppExpiry"
                              type="date"
                              value={driverForm.moppExpiry}
                              onChange={(e) =>
                                handleInputChange("moppExpiry", e.target.value)
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dados de Contratação */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">
                        Dados de Contratação
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="admissionDate">
                            Data de Admissão
                          </Label>
                          <Input
                            id="admissionDate"
                            type="date"
                            value={driverForm.admissionDate}
                            onChange={(e) =>
                              handleInputChange("admissionDate", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branch">Filial</Label>
                          <Select
                            value={driverForm.branch}
                            onValueChange={(v) =>
                              handleInputChange("branch", v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a filial" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="São Paulo">
                                São Paulo (Matriz)
                              </SelectItem>
                              <SelectItem value="Recife">Recife</SelectItem>
                              <SelectItem value="Piauí">Piauí</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Acesso ao Sistema */}
                    {!editingDriverId && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground border-b pb-2">
                          Acesso ao Sistema
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="password">Senha Inicial</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                value={driverForm.password}
                                onChange={(e) =>
                                  handleInputChange("password", e.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              O motorista usará o e-mail e esta senha para
                              acessar o sistema
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDriverDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmitDriver}
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : editingDriverId ? (
                        "Atualizar Motorista"
                      ) : (
                        "Cadastrar Motorista"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>CNH</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Validade CNH</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.cpf}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {driver.cnh}
                    </TableCell>
                    <TableCell>{driver.cnhCategory}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {new Date(driver.cnhExpiry).toLocaleDateString("pt-BR")}
                        {getCNHStatusBadge(driver.cnhExpiry)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{driver.branch}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          driver.status === "Ativo"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDriver(driver)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDriver(driver.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Dados cadastrais da transportadora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Razão Social</Label>
                <Input
                  id="company-name"
                  defaultValue="TRL Transporte e Logística LTDA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" defaultValue="12.345.678/0001-90" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-email">E-mail</Label>
                <Input
                  id="company-email"
                  type="email"
                  defaultValue="contato@trltransporte.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Telefone</Label>
                <Input id="company-phone" defaultValue="(11) 3456-7890" />
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
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre documentos vencendo
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre manutenções programadas
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Rodízio</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações diárias sobre rodízio
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="alert-days">
                Dias de antecedência para alertas
              </Label>
              <Input
                id="alert-days"
                type="number"
                defaultValue="15"
                className="w-24"
              />
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
            <CardDescription>
              Configurações para integração com sistemas externos
            </CardDescription>
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
  );
}
