import * as React from "react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { BackButton } from "@/components/ui/back-button"
import { Plus, Edit, Trash2, BookOpen } from "lucide-react"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"
import { usePersistedState } from "@/hooks/use-table-state"
import { MonthlyContentFormDialog } from "@/components/monthly-content-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"

interface CharacterTrait {
  id: string
  schoolId: string
  schoolYearId: string
  month: number
  characterTrait: string
  verseText: string
  verseReference: string
  createdAt: string
  updatedAt: string
}

interface SchoolYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export default function MonthlyContentPage() {
  const { t } = useTranslation()
  const api = useApi()
  const [loading, setLoading] = React.useState(true)
  const [characterTraits, setCharacterTraits] = React.useState<CharacterTrait[]>([])
  const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>([])
  const [selectedSchoolYear, setSelectedSchoolYear] = usePersistedState("selectedSchoolYear", "", "monthly-content")
  const [formDialogOpen, setFormDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedTrait, setSelectedTrait] = React.useState<CharacterTrait | null>(null)
  const [currentPage, setCurrentPage] = usePersistedState("currentPage", 1, "monthly-content")
  const itemsPerPage = 10

  React.useEffect(() => {
    loadSchoolYears()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (selectedSchoolYear || schoolYears.length > 0) {
      loadCharacterTraits()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchoolYear, schoolYears])

  const loadSchoolYears = async () => {
    try {
      setLoading(true)
      const years = await api.schoolYears.getAll()
      setSchoolYears(years)

      if (!selectedSchoolYear && years.length > 0) {
        const activeYear = years.find((y: SchoolYear) => y.isActive)
        setSelectedSchoolYear(activeYear?.id || years[0].id)
      }
    } catch (error: unknown) {
      console.error("Error loading school years:", error)
      toast.error(t("common.error.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const loadCharacterTraits = async () => {
    try {
      setLoading(true)
      const schoolYearId = selectedSchoolYear || (schoolYears.length > 0 ? schoolYears[0].id : undefined)
      if (!schoolYearId) return

      const traits = await api.characterTraits.getAll(schoolYearId)
      setCharacterTraits(traits)
    } catch (error: unknown) {
      console.error("Error loading character traits:", error)
      toast.error(t("common.error.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedTrait(null)
    setFormDialogOpen(true)
  }

  const handleEdit = (trait: CharacterTrait) => {
    setSelectedTrait(trait)
    setFormDialogOpen(true)
  }

  const handleDeleteClick = (trait: CharacterTrait) => {
    setSelectedTrait(trait)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedTrait) return

    try {
      await api.characterTraits.delete(selectedTrait.id)
      toast.success(t("monthlyContent.deleteSuccess"))
      loadCharacterTraits()
      setDeleteDialogOpen(false)
      setSelectedTrait(null)
    } catch (error: unknown) {
      console.error("Error deleting character trait:", error)
      toast.error(t("common.error.deleteFailed"))
    }
  }

  const handleFormSuccess = () => {
    loadCharacterTraits()
    setFormDialogOpen(false)
    setSelectedTrait(null)
  }

  const getMonthName = (month: number) => {
    return t(`common.months.${month}`)
  }

  const columns: AlennaTableColumn<CharacterTrait>[] = [
    {
      key: "month",
      label: t("monthlyContent.month"),
      render: (trait) => getMonthName(trait.month),
    },
    {
      key: "characterTrait",
      label: t("monthlyContent.characterTrait"),
      render: (trait) => trait.characterTrait,
    },
    {
      key: "verseText",
      label: t("monthlyContent.verseText"),
      render: (trait) => (
        <div className="max-w-md truncate" title={trait.verseText}>
          {trait.verseText}
        </div>
      ),
    },
    {
      key: "verseReference",
      label: t("monthlyContent.verseReference"),
      render: (trait) => trait.verseReference,
    },
  ]

  const actions: AlennaTableAction<CharacterTrait>[] = [
    {
      label: t("common.edit"),
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
    },
    {
      label: t("common.delete"),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteClick,
      variant: "destructive",
    },
  ]

  const paginatedTraits = characterTraits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading && schoolYears.length === 0) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <BackButton to="/school-settings">{t("common.back")}</BackButton>
        </div>
        <PageHeader
          moduleKey="schoolInfo"
          title={t("monthlyContent.title")}
          description={t("monthlyContent.description")}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Field className="w-64">
          <FieldLabel>{t("monthlyContent.schoolYear")}</FieldLabel>
          <Select
            value={selectedSchoolYear}
            onValueChange={setSelectedSchoolYear}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("monthlyContent.create")}
        </Button>
      </div>

      <AlennaTable
        columns={columns}
        data={paginatedTraits}
        actions={actions}
        pagination={{
          currentPage: currentPage,
          totalPages: Math.ceil(characterTraits.length / itemsPerPage),
          totalItems: characterTraits.length,
          onPageChange: setCurrentPage,
        }}
        tableId="monthly-content"
        loading={loading}
        emptyState={{
          icon: <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />,
          title: t("monthlyContent.emptyTitle"),
          message: t("monthlyContent.emptyDescription"),
          action: (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t("monthlyContent.create")}
            </Button>
          ),
        }}
      />

      <MonthlyContentFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        trait={selectedTrait}
        schoolYears={schoolYears}
        defaultSchoolYearId={selectedSchoolYear}
        onSuccess={handleFormSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("monthlyContent.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("monthlyContent.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

