import * as React from "react"
import { Navigate } from "react-router-dom"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { useTranslation } from "react-i18next"
import { useQuarterStatus } from "@/hooks/useQuarterStatus"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { toast } from "sonner"
import { Lock, Unlock, Clock } from "lucide-react"

export default function QuartersManagementPage() {
  const api = useApi()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()

  const [schoolYears, setSchoolYears] = React.useState<Array<{ id: string; name: string; isActive?: boolean }>>([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = React.useState<string | null>(null)
  const [closingQuarterId, setClosingQuarterId] = React.useState<string | null>(null)
  const [showCloseDialog, setShowCloseDialog] = React.useState(false)

  const { quarters, loading: quartersLoading, error: quartersError } = useQuarterStatus(selectedSchoolYearId)

  const canCloseQuarters = userInfo?.permissions.includes('quarters.close') ?? false

  React.useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const data = await api.schoolYears.getAll() as Array<{ id: string; name: string; isActive?: boolean }>
        setSchoolYears(data)

        const active = data.find(sy => sy.isActive)
        if (active) {
          setSelectedSchoolYearId(active.id)
        } else if (data.length > 0) {
          setSelectedSchoolYearId(data[0].id)
        }
      } catch (err) {
        console.error('Error fetching school years:', err)
      }
    }

    if (!isLoadingUser) {
      fetchSchoolYears()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser]) // api is stable from useApi hook, no need to include it

  const handleCloseQuarter = async () => {
    if (!closingQuarterId) return

    try {
      await api.quarters.close(closingQuarterId)
      toast.success(t("quarters.redistributionComplete"))
      setShowCloseDialog(false)
      setClosingQuarterId(null)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("quarters.errorClosing"))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'closed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            {t("quarters.closed")}
          </Badge>
        )
      case 'gracePeriod':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3" />
            {t("quarters.gracePeriod")}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Unlock className="h-3 w-3" />
            {t("quarters.open")}
          </Badge>
        )
    }
  }

  if (isLoadingUser) {
    return <Loading message={t("common.loading")} />
  }

  if (!canCloseQuarters) {
    return <Navigate to="/404" replace />
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t("quarters.title") || "Quarter Management"}
        description={t("quarters.description") || "Manage quarter closing and status"}
      />

      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium">{t("common.schoolYear")}:</h2>
        <Select
          value={selectedSchoolYearId || ""}
          onValueChange={(value) => setSelectedSchoolYearId(value || null)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("projections.selectSchoolYear")}>
              {selectedSchoolYearId ? (
                schoolYears.find(sy => sy.id === selectedSchoolYearId)?.name
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {schoolYears.map(year => (
              <SelectItem key={year.id} value={year.id}>
                {year.name} {year.isActive && <Badge className="ml-2">{t("projections.active")}</Badge>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {quartersLoading && <Loading message={t("common.loading")} />}

      {quartersError && (
        <div className="text-destructive">{quartersError}</div>
      )}

      {!quartersLoading && !quartersError && selectedSchoolYearId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quarters.map((quarterStatus) => {
            const quarter = quarterStatus.quarter
            return (
              <Card key={quarter.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{quarter.displayName}</CardTitle>
                    {getStatusBadge(quarterStatus.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <div>{t("common.startDate")}: {new Date(quarter.startDate).toLocaleDateString()}</div>
                    <div>{t("common.endDate")}: {new Date(quarter.endDate).toLocaleDateString()}</div>
                    {quarter.closedAt && (
                      <div className="mt-2 text-xs">
                        {t("quarters.closedAt") || "Closed at"}: {new Date(quarter.closedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {quarterStatus.canClose && (
                    <Button
                      onClick={() => {
                        setClosingQuarterId(quarter.id)
                        setShowCloseDialog(true)
                      }}
                      className="w-full"
                      variant="default"
                    >
                      {t("quarters.closeQuarter")}
                    </Button>
                  )}

                  {quarterStatus.status === 'closed' && (
                    <div className="text-xs text-muted-foreground">
                      {t("quarters.closedMessage") || "This quarter is closed. No further edits are allowed."}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmationDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        title={t("quarters.closeQuarter")}
        message={t("quarters.closeConfirmation")}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        onConfirm={handleCloseQuarter}
        variant="destructive"
      />
    </div>
  )
}

