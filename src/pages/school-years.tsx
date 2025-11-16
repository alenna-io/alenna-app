import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// BackButton replaced with shadcn Button
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Navigate } from "react-router-dom";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Plus, Edit, Trash2, CheckCircle, Calendar } from "lucide-react";
import { useApi } from "@/services/api";
import type { SchoolYear, ModuleData } from "@/services/api";
import { toast } from "sonner";

// Helper function to format date strings without timezone issues
function formatDateString(dateString: string): string {
  // Parse the date string as local date to avoid timezone issues
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
}

// Helper function to format date strings with year
function formatDateStringWithYear(dateString: string): string {
  // Parse the date string as local date to avoid timezone issues
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

export default function SchoolYearsPage() {
  const navigate = useNavigate();
  const api = useApi();
  const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasPermission, setHasPermission] = React.useState(true);
  const [isReadOnly, setIsReadOnly] = React.useState(false);
  const [editingYear, setEditingYear] = React.useState<SchoolYear | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
  }>({ open: false, message: "" });

  // Form state
  const [formData, setFormData] = React.useState<{
    name: string;
    startDate: string;
    endDate: string;
    quarters: Array<{
      id?: string;
      name: string;
      displayName: string;
      startDate: string;
      endDate: string;
      order: number;
      weeksCount: number;
    }>;
  }>({
    name: "",
    startDate: "",
    endDate: "",
    quarters: [
      { name: "Q1", displayName: "Bloque 1", startDate: "", endDate: "", order: 1, weeksCount: 9 },
      { name: "Q2", displayName: "Bloque 2", startDate: "", endDate: "", order: 2, weeksCount: 9 },
      { name: "Q3", displayName: "Bloque 3", startDate: "", endDate: "", order: 3, weeksCount: 9 },
      { name: "Q4", displayName: "Bloque 4", startDate: "", endDate: "", order: 4, weeksCount: 9 },
    ],
  });

  // Check user permissions
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Check if user has write permissions
        const modules = await api.modules.getUserModules();
        const allPermissions = new Set<string>();
        modules.forEach((module: ModuleData) => {
          module.actions.forEach((action: string) => allPermissions.add(action));
        });

        // If user only has read permission, set read-only mode
        const canWrite = allPermissions.has('schoolYear.create') || allPermissions.has('schoolYear.update');
        setIsReadOnly(!canWrite);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load school years
  React.useEffect(() => {
    fetchSchoolYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSchoolYears = async () => {
    try {
      setLoading(true);
      const years = await api.schoolYears.getAll();
      setSchoolYears(years);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("permiso")) {
        setHasPermission(false);
      } else {
        setErrorDialog({
          open: true,
          title: "Error",
          message: errorMessage || "Error al cargar años escolares",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingYear(null);

    // Calculate suggested year based on latest school year
    const latestYear = schoolYears.length > 0
      ? schoolYears.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
      : null;

    let suggestedName = "";
    let suggestedStartDate = "";
    let suggestedEndDate = "";
    let suggestedQuarters = [
      { name: "Q1", displayName: "Bloque 1", startDate: "", endDate: "", order: 1, weeksCount: 9 },
      { name: "Q2", displayName: "Bloque 2", startDate: "", endDate: "", order: 2, weeksCount: 9 },
      { name: "Q3", displayName: "Bloque 3", startDate: "", endDate: "", order: 3, weeksCount: 9 },
      { name: "Q4", displayName: "Bloque 4", startDate: "", endDate: "", order: 4, weeksCount: 9 },
    ];

    if (latestYear) {
      // Suggest next year
      const [startYear] = latestYear.name.split("-").map(Number);
      suggestedName = `${startYear + 1}-${startYear + 2}`;

      // Suggest dates one year ahead
      const prevStartDate = new Date(latestYear.startDate);
      const prevEndDate = new Date(latestYear.endDate);
      suggestedStartDate = new Date(prevStartDate.setFullYear(prevStartDate.getFullYear() + 1)).toISOString().split('T')[0];
      suggestedEndDate = new Date(prevEndDate.setFullYear(prevEndDate.getFullYear() + 1)).toISOString().split('T')[0];

      // Suggest quarter dates one year ahead
      if (latestYear.quarters) {
        suggestedQuarters = latestYear.quarters.map(q => {
          const qStart = new Date(q.startDate);
          const qEnd = new Date(q.endDate);
          return {
            name: q.name,
            displayName: q.displayName,
            startDate: new Date(qStart.setFullYear(qStart.getFullYear() + 1)).toISOString().split('T')[0],
            endDate: new Date(qEnd.setFullYear(qEnd.getFullYear() + 1)).toISOString().split('T')[0],
            order: q.order,
            weeksCount: q.weeksCount,
          };
        });
      }
    }

    setFormData({
      name: suggestedName,
      startDate: suggestedStartDate,
      endDate: suggestedEndDate,
      quarters: suggestedQuarters,
    });
  };

  const handleEdit = (year: SchoolYear) => {
    setEditingYear(year);
    setIsCreating(false);
    setFormData({
      name: year.name,
      startDate: year.startDate.split("T")[0],
      endDate: year.endDate.split("T")[0],
      quarters: year.quarters?.map(q => ({
        id: q.id, // Include ID for updates
        name: q.name,
        displayName: q.displayName,
        startDate: q.startDate.split("T")[0],
        endDate: q.endDate.split("T")[0],
        order: q.order,
        weeksCount: q.weeksCount,
      })) || [],
    });
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        await api.schoolYears.create(formData);
      } else if (editingYear) {
        await api.schoolYears.update(editingYear.id, formData);
      }
      setIsCreating(false);
      setEditingYear(null);
      fetchSchoolYears();
      toast.success(isCreating ? "Año escolar creado correctamente" : "Año escolar actualizado correctamente");
    } catch (error) {
      console.error('Error saving school year:', error);
      setErrorDialog({
        open: true,
        title: "Error",
        message: error instanceof Error ? error.message : "Error al guardar año escolar",
      });
      toast.error(error instanceof Error ? error.message : "Error al guardar año escolar");
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.schoolYears.setActive(id);
      fetchSchoolYears();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al activar año escolar");
      setErrorDialog({
        open: true,
        title: "Error",
        message: error instanceof Error ? error.message : "Error al activar año escolar",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.schoolYears.delete(id);
      fetchSchoolYears();
      toast.success("Año escolar eliminado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar año escolar");
      setErrorDialog({
        open: true,
        title: "Error",
        message: error instanceof Error ? error.message : "Error al eliminar año escolar",
      });
    }
  };

  if (!hasPermission) {
    return <Navigate to="/404" replace />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-none">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate("/configuration")}
        className="mb-4"
      >
        ← Volver a Configuración
      </Button>

      <div className="flex justify-between items-center">
        <PageHeader
          title="Años Escolares"
          description="Gestiona los años escolares y sus trimestres"
        />
        {!isCreating && !editingYear && !isReadOnly && (
          <Button onClick={handleCreate} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Año Escolar
          </Button>
        )}
      </div>

      <Separator />

      {/* Form for creating/editing */}
      {(isCreating || editingYear) && (
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isCreating ? "Crear Nuevo Año Escolar" : "Editar Año Escolar"}
              </h2>
              <p className="text-sm text-gray-600">
                {isCreating ? "Configura un nuevo año académico para tu escuela" : "Modifica la configuración del año académico"}
              </p>
            </div>
          </div>

          {/* School Year Basic Info */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Información Básica
            </h3>
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="school-year-name">Nombre del Año Escolar</FieldLabel>
                  <Input
                    id="school-year-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: 2024-2025"
                    className="text-lg"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="school-year-start">Fecha de Inicio</FieldLabel>
                  <DatePicker
                    value={formData.startDate}
                    onChange={(date) => setFormData({ ...formData, startDate: date })}
                    placeholder="Selecciona fecha de inicio"
                    min="2020-01-01"
                    max="2050-12-31"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="school-year-end">Fecha de Fin</FieldLabel>
                  <DatePicker
                    value={formData.endDate}
                    onChange={(date) => setFormData({ ...formData, endDate: date })}
                    placeholder="Selecciona fecha de fin"
                    min="2020-01-01"
                    max="2050-12-31"
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>

          {/* Quarters */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Configuración de Trimestres
            </h3>
            <div className="space-y-4">
              {formData.quarters.map((quarter, index) => (
                <div key={quarter.name} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-green-700">{quarter.order}</span>
                    </div>
                    <h4 className="font-medium text-gray-900">{quarter.displayName}</h4>
                  </div>
                  <FieldGroup>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Field>
                        <FieldLabel htmlFor={`quarter-${index}-name`}>Nombre del Trimestre</FieldLabel>
                        <Input
                          id={`quarter-${index}-name`}
                          value={quarter.displayName}
                          onChange={(e) => {
                            const newQuarters = [...formData.quarters];
                            newQuarters[index].displayName = e.target.value;
                            setFormData({ ...formData, quarters: newQuarters });
                          }}
                          placeholder="Ej: Primer Trimestre"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`quarter-${index}-start`}>Fecha de Inicio</FieldLabel>
                        <DatePicker
                          value={quarter.startDate}
                          onChange={(date) => {
                            const newQuarters = [...formData.quarters];
                            newQuarters[index].startDate = date;
                            setFormData({ ...formData, quarters: newQuarters });
                          }}
                          placeholder="Fecha inicio"
                          min="2020-01-01"
                          max="2050-12-31"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`quarter-${index}-end`}>Fecha de Fin</FieldLabel>
                        <DatePicker
                          value={quarter.endDate}
                          onChange={(date) => {
                            const newQuarters = [...formData.quarters];
                            newQuarters[index].endDate = date;
                            setFormData({ ...formData, quarters: newQuarters });
                          }}
                          placeholder="Fecha fin"
                          min="2020-01-01"
                          max="2050-12-31"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`quarter-${index}-weeks`}>Semanas</FieldLabel>
                        <Input
                          id={`quarter-${index}-weeks`}
                          type="number"
                          value={quarter.weeksCount}
                          onChange={(e) => {
                            const newQuarters = [...formData.quarters];
                            newQuarters[index].weeksCount = parseInt(e.target.value) || 9;
                            setFormData({ ...formData, quarters: newQuarters });
                          }}
                          placeholder="9"
                          className="text-center"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingYear(null);
              }}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="cursor-pointer bg-blue-600 hover:bg-blue-700">
              {isCreating ? "Crear Año Escolar" : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      )}

      {/* List of school years */}
      {!isCreating && !editingYear && (
        <div className="grid gap-4">
          {schoolYears.map((year) => (
            <Card key={year.id} className="shadow-none">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{year.name}</CardTitle>
                      {year.isActive && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Activo
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {formatDateStringWithYear(year.startDate)} - {formatDateStringWithYear(year.endDate)}
                    </CardDescription>
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      {!year.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(year.id)}
                          className="cursor-pointer"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Activar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleEdit(year)} className="cursor-pointer">
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      {!year.isActive && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(year.id)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              {year.isActive && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {year.quarters?.map((quarter) => (
                      <Card key={quarter.id} className="bg-muted/50 shadow-none">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold">{quarter.displayName}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDateString(quarter.startDate)} - {formatDateString(quarter.endDate)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{quarter.weeksCount} semanas</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {schoolYears.length === 0 && !isCreating && !editingYear && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay años escolares configurados</h3>
            <p className="text-muted-foreground mb-4">Crea el primer año escolar para comenzar</p>
            <Button onClick={handleCreate} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Crear Año Escolar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title || "Error"}
        message={errorDialog.message}
        confirmText="Aceptar"
      />
    </div>
  );
}

