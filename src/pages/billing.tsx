import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, DollarSign, Calendar, CheckCircle, Clock, Info } from "lucide-react";

export default function BillingPage() {

  // Mock data - will be replaced with real API calls
  const subscription = {
    plan: "Professional",
    status: "active",
    price: "$99.00",
    billingCycle: "monthly",
    nextBillingDate: "2024-11-22",
    studentsLimit: 100,
    currentStudents: 5,
  };

  const recentInvoices = [
    { id: "INV-001", date: "2024-10-22", amount: "$99.00", status: "paid" },
    { id: "INV-002", date: "2024-09-22", amount: "$99.00", status: "paid" },
    { id: "INV-003", date: "2024-08-22", amount: "$99.00", status: "paid" },
  ];

  return (
    <div className="space-y-6">
      <BackButton to="/configuration">
        Volver a Configuración
      </BackButton>

      <div className="flex items-center justify-between">
        <PageHeader
          title="Facturación"
          description="Gestiona tu suscripción, pagos e historial de facturas"
        />
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Info className="mr-1 h-3 w-3" />
          Próximamente
        </Badge>
      </div>

      <Separator />

      <div className="space-y-6">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Suscripción Actual
            </CardTitle>
            <CardDescription>Plan y estado de tu suscripción</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Plan</label>
                <p className="text-2xl font-bold">{subscription.plan}</p>
                <Badge className="mt-2 bg-green-600 text-white">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {subscription.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Precio</label>
                <p className="text-2xl font-bold">{subscription.price}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription.billingCycle === "monthly" ? "mensual" : "anual"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Próximo Cobro
                </label>
                <p className="text-lg font-semibold">
                  {new Date(subscription.nextBillingDate).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Uso Actual
            </CardTitle>
            <CardDescription>Límites y uso de tu plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Estudiantes</span>
                  <span className="text-sm text-muted-foreground">
                    {subscription.currentStudents} / {subscription.studentsLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${(subscription.currentStudents / subscription.studentsLimit) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Facturas Recientes
            </CardTitle>
            <CardDescription>Historial de pagos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-lg">{invoice.amount}</p>
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Pagado
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Funcionalidad en Desarrollo</p>
                <p className="text-sm text-blue-700">
                  El módulo de facturación está en desarrollo. Pronto podrás gestionar pagos, actualizar
                  métodos de pago y descargar facturas directamente desde aquí.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

