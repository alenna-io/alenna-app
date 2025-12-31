import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, GraduationCap, BookOpen, Clock, Heart } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { AlennaSkeleton } from "@/components/ui/alenna-skeleton"
import { useTranslation } from "react-i18next"
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
    const fetchVerse = async () => {
      try {
        const today = new Date()
        const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)

        const verses = [
          { text: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5" },
          { text: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
          { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.", reference: "Jeremiah 29:11" },
          { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
          { text: "The LORD is my shepherd; I shall not want.", reference: "Psalm 23:1" },
        ]

        const selectedVerse = verses[dayOfYear % verses.length]
        setVerse(selectedVerse)
      } catch (err) {
        console.error("Error fetching verse:", err)
      }
    }

    fetchVerse()
  }, [])

  React.useEffect(() => {
    const fetchCharacterTrait = () => {
      try {
        const today = new Date()
        const month = today.getMonth()

        const traits = [
          "Faithful",
          "Compassionate",
          "Patient",
          "Kind",
          "Humble",
          "Generous",
          "Honest",
          "Courageous",
          "Perseverant",
          "Grateful",
          "Forgiving",
          "Loving",
        ]

        const selectedTrait = traits[month]
        setCharacterTrait(selectedTrait)
      } catch (err) {
        console.error("Error fetching character trait:", err)
      }
    }

    fetchCharacterTrait()
  }, [])

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
      {verse && (
        <Card className="hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.verseOfTheMonth") || "Verse of the Month"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-lavender" />
          </CardHeader>
          <CardContent>
            <p className="text-sm italic mb-2">"{verse.text}"</p>
            <p className="text-xs text-lavender font-medium">{verse.reference}</p>
          </CardContent>
        </Card>
      )}

      {/* Character Trait of the Month */}
      {characterTrait && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.characterTraitOfTheMonth") || "Character Trait of the Month"}
            </CardTitle>
            <Heart className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-coral">{characterTrait}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.focusTrait") || "Focus trait for this month"}
            </p>
          </CardContent>
        </Card>
      )}
      {/* Current School Year */}
      {currentWeekInfo?.schoolYear && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.currentSchoolYear") || "Current School Year"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentWeekInfo.schoolYear.name}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(currentWeekInfo.schoolYear.startDate).getFullYear()} - {new Date(currentWeekInfo.schoolYear.endDate).getFullYear()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Week and Quarter */}
      {currentWeekInfo?.currentQuarter && currentWeekInfo.currentWeek && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.currentPeriod") || "Current Period"}
            </CardTitle>
            <Clock className="h-4 w-4 text-lavender" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lavender">
              {getQuarterLabel(currentWeekInfo.currentQuarter.name)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("common.week")} {currentWeekInfo.currentWeek} {t("dashboard.ofQuarter") || "of quarter"}
            </p>
          </CardContent>
        </Card>
      )}

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

