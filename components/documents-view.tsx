"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Scale,
  ExternalLink,
  Car,
  Calendar,
  MapPin,
  Hash,
} from "lucide-react"
import { mockDocuments, mockFines, type Document, type Fine } from "@/lib/mock-data"

const documentStatusConfig: Record<Document["status"], string> = {
  Válido: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Vencendo: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Vencido: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const fineStatusConfig: Record<Fine["status"], string> = {
  Pendente: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Paga: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Recurso: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
}

export function DocumentsView() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null)

  const validDocs = mockDocuments.filter((d) => d.status === "Válido").length
  const expiringDocs = mockDocuments.filter((d) => d.status === "Vencendo").length
  const expiredDocs = mockDocuments.filter((d) => d.status === "Vencido").length

  const pendingFines = mockFines.filter((f) => f.status === "Pendente")
  const totalPending = pendingFines.reduce((acc, f) => acc + f.value, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documentos & Multas</h1>
        <p className="text-muted-foreground">Gerencie documentação e infrações da frota</p>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{validDocs}</p>
              <p className="text-sm text-muted-foreground">Docs. Válidos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiringDocs}</p>
              <p className="text-sm text-muted-foreground">Vencendo</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredDocs}</p>
              <p className="text-sm text-muted-foreground">Vencidos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">Multas Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="fines" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Multas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documentação dos Veículos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDocuments.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <TableCell className="font-medium">{doc.vehiclePlate}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{new Date(doc.expirationDate).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge className={documentStatusConfig[doc.status]}>{doc.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines">
          <Card>
            <CardHeader>
              <CardTitle>Infrações e Multas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockFines.map((fine) => (
                      <TableRow
                        key={fine.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedFine(fine)}
                      >
                        <TableCell className="font-medium">{fine.vehiclePlate}</TableCell>
                        <TableCell>{new Date(fine.date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{fine.description}</TableCell>
                        <TableCell>
                          R${" "}
                          {fine.value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge className={fineStatusConfig[fine.status]}>{fine.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-[85vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes do Documento - {selectedDocument?.type}
            </DialogTitle>
            <DialogDescription>
              Informações completas do documento do veículo {selectedDocument?.vehiclePlate}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6 py-4">
              {/* Info Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Car className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Placa</p>
                        <p className="font-semibold">{selectedDocument.vehiclePlate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Hash className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">RENAVAM</p>
                        <p className="font-semibold">{selectedDocument.renavam || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vencimento</p>
                        <p className="font-semibold">
                          {new Date(selectedDocument.expirationDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes do Documento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do {selectedDocument.type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                      <p className="font-medium">{selectedDocument.type}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={documentStatusConfig[selectedDocument.status]}>{selectedDocument.status}</Badge>
                    </div>
                    {selectedDocument.valor && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="font-medium text-lg">
                          R$ {selectedDocument.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    {selectedDocument.parcelas && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Parcelas</p>
                        <p className="font-medium">
                          {selectedDocument.parcelasPagas || 0} de {selectedDocument.parcelas} pagas
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Botão para DETRAN */}
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => window.open(selectedDocument.detranUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Acessar Portal DETRAN / Órgão Responsável
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedFine} onOpenChange={() => setSelectedFine(null)}>
        <DialogContent className="max-w-[85vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Scale className="h-5 w-5 text-destructive" />
              Detalhes da Multa
            </DialogTitle>
            <DialogDescription>
              Informações completas da infração do veículo {selectedFine?.vehiclePlate}
            </DialogDescription>
          </DialogHeader>

          {selectedFine && (
            <div className="space-y-6 py-4">
              {/* Info Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <Car className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Placa</p>
                        <p className="font-semibold">{selectedFine.vehiclePlate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <Hash className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Auto de Infração</p>
                        <p className="font-semibold">{selectedFine.autoInfracao || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <Calendar className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data da Infração</p>
                        <p className="font-semibold">{new Date(selectedFine.date).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <DollarSign className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="font-semibold text-destructive">
                          R$ {selectedFine.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes da Multa */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações da Infração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="font-medium">{selectedFine.description}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={fineStatusConfig[selectedFine.status]}>{selectedFine.status}</Badge>
                    </div>
                    {selectedFine.local && (
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Local da Infração
                        </p>
                        <p className="font-medium">{selectedFine.local}</p>
                      </div>
                    )}
                    {selectedFine.pontos && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Pontos na CNH</p>
                        <p className="font-medium text-destructive">{selectedFine.pontos} pontos</p>
                      </div>
                    )}
                    {selectedFine.prazoRecurso && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Prazo para Recurso</p>
                        <p className="font-medium">{new Date(selectedFine.prazoRecurso).toLocaleDateString("pt-BR")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Aviso de Status */}
              {selectedFine.status === "Pendente" && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">Multa Pendente de Pagamento</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Efetue o pagamento ou apresente recurso dentro do prazo para evitar acréscimos e restrições no
                          veículo.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedFine.status === "Recurso" && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Scale className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Recurso em Análise</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Acompanhe o andamento do seu recurso no portal do DETRAN. O prazo de análise pode variar.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                <Button
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => window.open(selectedFine.detranUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Acessar Portal DETRAN
                </Button>
                {selectedFine.status === "Pendente" && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={() =>
                      window.open(
                        "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/infracoes/fichaservico/defesaDeMulta",
                        "_blank",
                      )
                    }
                  >
                    <Scale className="h-4 w-4" />
                    Apresentar Recurso
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
