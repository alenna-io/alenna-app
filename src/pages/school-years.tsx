import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { NoPermission } from "@/components/no-permission";
import { Plus, Edit, Trash2, CheckCircle, Calendar } from "lucide-react";
import { useApi } from "@/services/api";
import type { SchoolYear, ModuleData } from "@/services/api";

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
          module.permissions.forEach((perm: string) => allPermissions.add(perm));
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
    } catch (error) {
      setErrorDialog({
        open: true,
        title: "Error",
        message: error instanceof Error ? error.message : "Error al guardar año escolar",
      });
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.schoolYears.setActive(id);
      fetchSchoolYears();
    } catch (error) {
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
    } catch (error) {
      setErrorDialog({
        open: true,
        title: "Error",
        message: error instanceof Error ? error.message : "Error al eliminar año escolar",
      });
    }
  };

  if (!hasPermission) {
    return <NoPermission onBack={() => navigate("/configuration")} />;
  }

  if (loading) {
    return <LoadingSkeleton variant="profile" />;
  }

  return (
    <div className="space-y-6">
      <BackButton onClick={() => navigate("/configuration")}>
        Volver a Configuración
      </BackButton>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Años Escolares</h1>
          <p className="text-muted-foreground">Gestiona los años escolares y sus trimestres</p>
        </div>
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{isCreating ? "Crear Nuevo Año Escolar" : "Editar Año Escolar"}</CardTitle>
            <CardDescription>Define el año escolar y sus 4 trimestres con fechas de inicio y fin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* School Year Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre del Año Escolar</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="2024-2025"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha de Inicio</label>
                <DatePicker
                  value={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                  placeholder="Selecciona fecha de inicio"
                  min="2020-01-01"
                  max="2050-12-31"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha de Fin</label>
                <DatePicker
                  value={formData.endDate}
                  onChange={(date) => setFormData({ ...formData, endDate: date })}
                  placeholder="Selecciona fecha de fin"
                  min="2020-01-01"
                  max="2050-12-31"
                />
              </div>
            </div>

            {/* Quarters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Trimestres</h3>
              {formData.quarters.map((quarter, index) => (
                <Card key={quarter.name} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Nombre</label>
                        <Input
                          value={quarter.displayName}
                          onChange={(e) => {
                            const newQuarters = [...formData.quarters];
                            newQuarters[index].displayName = e.target.value;
                            setFormData({ ...formData, quarters: newQuarters });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
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
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
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
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Orden</label>
                        <Input type="number" value={quarter.order} disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Semanas</label>
                        <Input
                          type="number"
                          value={quarter.weeksCount}
                          onChange={(e) => {
                            const newQuarters = [...formData.quarters];
                            newQuarters[index].weeksCount = parseInt(e.target.value) || 9;
                            setFormData({ ...formData, quarters: newQuarters });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
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
              <Button onClick={handleSave} className="cursor-pointer">
                {isCreating ? "Crear" : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List of school years */}
      {!isCreating && !editingYear && (
        <div className="grid gap-4">
          {schoolYears.map((year) => (
            <Card key={year.id} className={year.isActive ? "border-2 border-green-500" : ""}>
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
                    <CardDescription>
                      {new Date(year.startDate).toLocaleDateString("es-MX")} - {new Date(year.endDate).toLocaleDateString("es-MX")}
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
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {year.quarters?.map((quarter) => (
                    <Card key={quarter.id} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">{quarter.displayName}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(quarter.startDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" })} - {new Date(quarter.endDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{quarter.weeksCount} semanas</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
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
      <AlertDialog
        isOpen={errorDialog.open}
        title={errorDialog.title || "Error"}
        message={errorDialog.message}
        onConfirm={() => setErrorDialog({ ...errorDialog, open: false })}
        confirmText="Aceptar"
      />
    </div>
  );
}

