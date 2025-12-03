import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Eye } from "lucide-react"
import { useTranslation } from "react-i18next"

interface GroupDisplay {
  id: string
  name: string | null
  teacherId: string
  teacherName: string
  schoolYearId: string
  schoolYearName: string
  studentCount: number
  students: Array<{ id: string; studentId: string; studentName: string }>
}

interface GroupsTableProps {
  groups: GroupDisplay[]
  onViewDetails: (groupId: string) => void
  canManage?: boolean
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function GroupsTable({
  groups,
  onViewDetails,
  canManage = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: GroupsTableProps) {
  const { t } = useTranslation()

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm [&:last-child]:w-16"
  const tdClass = "p-4 align-middle first:px-6 first:py-3 [&:last-child]:w-16"

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className={thClass}>
                  {t("groups.groupName")}
                </th>
                <th className={thClass}>
                  {t("groups.teacher")}
                </th>
                <th className={thClass}>
                  {t("groups.schoolYear")}
                </th>
                <th className={thClass}>
                  {t("groups.studentsAssigned")}
                </th>
                {canManage && (
                  <th className={thClass + " text-right"}>
                    {t("common.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="text-center py-8 text-muted-foreground">
                    {t("groups.noGroups")}
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr
                    key={group.id}
                    className="border-b group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onViewDetails(group.id)}
                  >
                    <td className={tdClass + " font-medium"}>
                      <div className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {group.name || t("groups.defaultGroupName")}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="text-sm text-foreground">
                        {group.teacherName}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="text-sm text-muted-foreground">
                        {group.schoolYearName}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <Badge variant="secondary">{group.studentCount}</Badge>
                    </td>
                    {canManage && (
                      <td className={tdClass + " text-right"} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetails(group.id)} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              {t("groups.viewDetails")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {t("common.showing", { start: startItem, end: endItem, total: totalItems })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t("common.next")}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
