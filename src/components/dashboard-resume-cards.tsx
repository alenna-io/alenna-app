import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, GraduationCap, BookOpen, Clock, Heart, Info } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { AlennaSkeleton } from "@/components/ui/alenna-skeleton"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { CurrentWeekInfo } from "@/services/api"

interface DashboardResumeCardsProps {
  currentWeekInfo: CurrentWeekInfo | null
}

export function DashboardResumeCards({ currentWeekInfo }: DashboardResumeCardsProps) {
  const api = useApi()
  const { userInfo } = useUser()
  const { t } = useTranslation()
  const [studentsCount, setStudentsCount] = React.useState<number | null>(null)
  const [teachersCount, setTeachersCount] = React.useState<number | null>(null)
  const [loadingStudents, setLoadingStudents] = React.useState(true)
  const [loadingTeachers, setLoadingTeachers] = React.useState(true)
  const [verse, setVerse] = React.useState<{ text: string; reference: string } | null>(null)
  const [characterTrait, setCharacterTrait] = React.useState<string | null>(null)
  const [loadingMonthlyContent, setLoadingMonthlyContent] = React.useState(true)

  React.useEffect(() => {
    const fetchCounts = async () => {
      const schoolId = userInfo?.schoolId
      if (!schoolId) return

      try {
        const [students, teachers] = await Promise.all([
          api.schools.getStudentsCount(schoolId).catch(() => null),
          api.schools.getMyTeachersCount().catch(() => null),
        ])

        if (students !== null) {
          setStudentsCount(students.count || 0)
        }
        if (teachers !== null) {
          setTeachersCount(teachers.count || 0)
        }
      } catch (err) {
        console.error("Error fetching counts:", err)
      } finally {
        setLoadingStudents(false)
        setLoadingTeachers(false)
      }
    }

    fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.schoolId])

  React.useEffect(() => {
    const fetchMonthlyContent = async () => {
      try {
        setLoadingMonthlyContent(true)
        if (!currentWeekInfo?.schoolYear?.id) {
          return
        }

        const today = new Date()
        const currentCalendarMonth = today.getMonth() + 1

        const characterTraitData = await api.characterTraits.getByMonth(
          currentWeekInfo.schoolYear.id,
          currentCalendarMonth
        ).catch((err) => {
          console.error("[Dashboard] Error fetching character trait:", err)
          return null
        })

        if (characterTraitData) {
          setVerse({
            text: characterTraitData.verseText,
            reference: characterTraitData.verseReference,
          })
          setCharacterTrait(characterTraitData.characterTrait)
        } else {
          const fallbackVerses = [
            { text: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5" },
            { text: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
            { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.", reference: "Jeremiah 29:11" },
          ]
          const fallbackTraits = ["Faithful", "Compassionate", "Patient", "Kind", "Humble", "Generous"]

          const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
          setVerse(fallbackVerses[dayOfYear % fallbackVerses.length])
          setCharacterTrait(fallbackTraits[today.getMonth() % fallbackTraits.length])
        }
      } catch (err) {
        console.error("[Dashboard] Error in fetchMonthlyContent:", err)
      } finally {
        setLoadingMonthlyContent(false)
      }
    }

    fetchMonthlyContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekInfo?.schoolYear?.id])

  const getQuarterLabel = (quarterName: string) => {
    const quarterLabels: { [key: string]: string } = {
      'Q1': t("monthlyAssignments.quarterLabelQ1"),
      'Q2': t("monthlyAssignments.quarterLabelQ2"),
      'Q3': t("monthlyAssignments.quarterLabelQ3"),
      'Q4': t("monthlyAssignments.quarterLabelQ4"),
    }
    return quarterLabels[quarterName] || currentWeekInfo?.currentQuarter?.displayName || quarterName
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

      {/* Verse of the Day */}
      <Card className="hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.verseOfTheMonth") || "Verse of the Month"}
          </CardTitle>
          <BookOpen className="h-4 w-4 text-lavender" />
        </CardHeader>
        <CardContent>
          {loadingMonthlyContent || !verse ? (
            <>
              <AlennaSkeleton height={60} className="mb-2" />
              <AlennaSkeleton height={16} width="120px" />
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <p className="text-sm italic mb-2 flex-1">
                  "{verse.text.length > 100 ? `${verse.text.substring(0, 100)}...` : verse.text}"
                </p>
                {verse.text.length > 100 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-primary cursor-help shrink-0 mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="text-sm italic">"{verse.text}"</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xs text-lavender font-medium">{verse.reference}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Character Trait of the Month */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.characterTraitOfTheMonth") || "Character Trait of the Month"}
          </CardTitle>
          <Heart className="h-4 w-4 text-coral" />
        </CardHeader>
        <CardContent>
          {loadingMonthlyContent || !characterTrait ? (
            <>
              <AlennaSkeleton height={32} width="150px" />
              <AlennaSkeleton height={16} width="180px" className="mt-1" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-coral">{characterTrait}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("dashboard.focusTrait") || "Focus trait for this month"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      {/* Current School Year */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.currentSchoolYear") || "Current School Year"}
          </CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {!currentWeekInfo?.schoolYear ? (
            <>
              <AlennaSkeleton height={32} width="120px" />
              <AlennaSkeleton height={16} width="100px" className="mt-1" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-primary">{currentWeekInfo.schoolYear.name}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(currentWeekInfo.schoolYear.startDate).getFullYear()} - {new Date(currentWeekInfo.schoolYear.endDate).getFullYear()}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Current Week and Quarter */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.currentPeriod") || "Current Period"}
          </CardTitle>
          <Clock className="h-4 w-4 text-lavender" />
        </CardHeader>
        <CardContent>
          {!currentWeekInfo?.currentQuarter || !currentWeekInfo.currentWeek ? (
            <>
              <AlennaSkeleton height={32} width="100px" />
              <AlennaSkeleton height={16} width="120px" className="mt-1" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-lavender">
                {getQuarterLabel(currentWeekInfo.currentQuarter.name)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("common.week")} {currentWeekInfo.currentWeek} {t("dashboard.ofQuarter") || "of quarter"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Students */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.activeStudents") || "Active Students"}
          </CardTitle>
          <Users className="h-4 w-4 text-mint" />
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <AlennaSkeleton height={32} width="60px" />
          ) : (
            <div className="text-2xl font-bold text-mint">{studentsCount ?? 0}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {t("dashboard.studentsEnrolled") || "Students enrolled"}
          </p>
        </CardContent>
      </Card>

      {/* Active Teachers */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.activeTeachers") || "Active Teachers"}
          </CardTitle>
          <GraduationCap className="h-4 w-4 text-amber" />
        </CardHeader>
        <CardContent>
          {loadingTeachers ? (
            <AlennaSkeleton height={32} width="60px" />
          ) : (
            <div className="text-2xl font-bold text-amber">{teachersCount ?? 0}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {t("dashboard.teachersActive") || "Teachers active"}
          </p>
        </CardContent>
      </Card>


    </div>
  )
}

