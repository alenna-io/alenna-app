import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { AlennaTable, type AlennaTableColumn } from "@/components/ui/alenna-table"

interface PaceCatalogItem {
  id: string
  code: string
  name: string
  subSubjectName: string
  subSubjectId: string
  categoryName: string
  levelId: string
  difficulty?: string
}

interface LecturesTableProps {
  lectures: PaceCatalogItem[]
  sortField: "code" | "name" | "category" | "subject" | "level" | null
  sortDirection: "asc" | "desc"
  onSort: (field: "code" | "name" | "category" | "subject" | "level") => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  loading?: boolean
}

export function LecturesTable({
  lectures,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  loading = false,
}: LecturesTableProps) {
  const { t } = useTranslation()

  const columns: AlennaTableColumn<PaceCatalogItem>[] = [
    {
      key: 'name',
      label: t("lectures.name") || "Name",
      sortable: true,
      render: (lecture) => (
        <div className="text-sm">{lecture.name}</div>
      )
    },
    {
      key: 'code',
      label: t("lectures.code") || "Code",
      sortable: true,
      render: (lecture) => (
        <div className="text-sm">{lecture.code}</div>
      )
    },
    {
      key: 'category',
      label: t("lectures.category") || "Category",
      sortable: true,
      render: (lecture) => (
        <div className="text-sm">{lecture.categoryName}</div>
      )
    },
    {
      key: 'subject',
      label: t("lectures.subject") || "Subject",
      sortable: true,
      render: (lecture) => (
        <div className="text-sm">{lecture.subSubjectName}</div>
      )
    },
    {
      key: 'level',
      label: t("lectures.level") || "Level",
      sortable: true,
      render: (lecture) => (
        <Badge variant="secondary">
          {lecture.levelId}
        </Badge>
      )
    }
  ]

  return (
    <AlennaTable
      columns={columns}
      data={lectures}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        pageSize: 10,
        onPageChange
      }}
      loading={loading}
      emptyState={{
        message: t("lectures.noLecturesFound") || "No lectures found"
      }}
      sortField={sortField || undefined}
      sortDirection={sortDirection}
      onSort={(field) => {
        if (['code', 'name', 'category', 'subject', 'level'].includes(field)) {
          onSort(field as "code" | "name" | "category" | "subject" | "level")
        }
      }}
      getRowId={(lecture) => lecture.id}
    />
  )
}

