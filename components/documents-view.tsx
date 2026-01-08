"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, AlertTriangle, CheckCircle, Clock, DollarSign, Scale } from "lucide-react"
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
                      <TableRow key={doc.id}>
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
                      <TableRow key={fine.id}>
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
    </div>
  )
}
