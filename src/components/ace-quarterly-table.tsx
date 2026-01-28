import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { InfoDialog } from "@/components/ui/info-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { CheckCircle2, Trash2, XCircle, MoreVertical, Edit, Check, X, History, Info } from "lucide-react"
import type { QuarterData } from "@/types/pace"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface QuarterlyTableProps {
  quarter: string
  quarterName: string
  data: QuarterData
  currentWeek?: number // 1-9 for the current week in this quarter, undefined if not current
  isActive?: boolean // Whether this quarter contains the current week
  isReadOnly?: boolean // Read-only mode for parents
  isQuarterClosed?: boolean // Whether this quarter is closed
  editMode?: 'view' | 'moving' | 'editing' // Edit mode for projection editing
  subjectToCategory?: Map<string, string> // Mapping from sub-subject to category
  subjectToCategoryDisplayOrder?: Map<string, number> // Mapping from subject to category displayOrder
  categoryCounts?: Map<string, Map<string, number>> // quarter -> category -> count
  onPaceDrop?: (quarter: string, subject: string, fromWeek: number, toWeek: number) => void
  onPaceToggle?: (quarter: string, subject: string, weekIndex: number, grade?: number) => void
  onWeekClick?: (quarter: string, week: number) => void
  onAddPace?: (quarter: string, subject: string, weekIndex: number) => void
  onDeletePace?: (quarter: string, subject: string, weekIndex: number) => void
}

type OptionsMenuState = {
  subject: string
  weekIndex: number
  x: number
  y: number
  placement?: 'left' | 'right'
}


// Subject-specific color mapping with soft pastel backgrounds
const getSubjectColor = (subjectName: string) => {
  const normalizedSubject = subjectName.toLowerCase().trim()

  // Map subjects to soft pastel background colors with dark text
  if (normalizedSubject.includes("math")) {
    return { bg: "bg-amber-soft/15", text: "text-foreground" }
  }
  if (normalizedSubject.includes("english")) {
    return { bg: "bg-coral-soft/15", text: "text-foreground" }
  }
  if (normalizedSubject.includes("word building")) {
    return { bg: "bg-lavender-soft/15", text: "text-foreground" }
  }
  if (normalizedSubject.includes("science")) {
    return { bg: "bg-sky-soft/15", text: "text-foreground" }
  }
  if (normalizedSubject.includes("social studies")) {
    return { bg: "bg-mint-soft/15", text: "text-foreground" }
  }

  // Default fallback
  return { bg: "bg-card", text: "text-foreground" }
}

export function ACEQuarterlyTable({
  quarter,
  quarterName,
  data,
  currentWeek,
  isActive = false,
  isReadOnly = false,
  isQuarterClosed = false,
  editMode = 'view',
  subjectToCategory,
  subjectToCategoryDisplayOrder,
  categoryCounts,
  onPaceDrop,
  onPaceToggle,
  onWeekClick,
  onAddPace,
  onDeletePace
}: QuarterlyTableProps) {
  const { t } = useTranslation()

  const getDisplayName = (subjectName: string): string => {
    if (!subjectToCategory) return subjectName
    const categoryName = subjectToCategory.get(subjectName)
    if (!categoryName) return subjectName

    // Always show subject name for electives
    if (categoryName === 'Electives') return subjectName

    // Check if there are multiple subjects from the same category in this quarter
    if (categoryCounts) {
      const quarterCategoryCounts = categoryCounts.get(quarter)
      if (quarterCategoryCounts) {
        const count = quarterCategoryCounts.get(categoryName) || 0
        // If multiple subjects share the same category, show subject name to distinguish them
        if (count > 1) return subjectName
      }
    }

    // Single subject from this category, show category name
    return categoryName
  }
  const [draggedPace, setDraggedPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const dragImageRef = React.useRef<HTMLDivElement | null>(null)
  const [touchStart, setTouchStart] = React.useState<{ subject: string, weekIndex: number, x: number, y: number } | null>(null)
  const [touchDragPreview, setTouchDragPreview] = React.useState<{ paceNumber: string; isCompleted: boolean; x: number; y: number } | null>(null)
  const touchDragPreviewRef = React.useRef<HTMLDivElement | null>(null)
  const [editingPace, setEditingPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [deleteDialog, setDeleteDialog] = React.useState<{ subject: string, weekIndex: number, paceNumber: string } | null>(null)
  const [alertDialog, setAlertDialog] = React.useState<{ title: string, message: string } | null>(null)
  const [optionsMenu, setOptionsMenu] = React.useState<OptionsMenuState | null>(null)
  const [historyDialog, setHistoryDialog] = React.useState<{ subject: string, weekIndex: number, paceNumber: string, history: Array<{ grade: number, date: string, note?: string }> } | null>(null)
  const [failedAttemptsDialog, setFailedAttemptsDialog] = React.useState<boolean>(false)
  const optionsMenuRef = React.useRef<HTMLDivElement>(null)

  // Sort subjects by category displayOrder
  const subjects = React.useMemo(() => {
    const subjectList = Object.keys(data)
    if (!subjectToCategoryDisplayOrder) {
      return subjectList
    }
    return subjectList.sort((a, b) => {
      const orderA = subjectToCategoryDisplayOrder.get(a) ?? 999
      const orderB = subjectToCategoryDisplayOrder.get(b) ?? 999
      return orderA - orderB
    })
  }, [data, subjectToCategoryDisplayOrder])

  const weeks = Array.from({ length: 9 }, (_, i) => i + 1)
  const MAX_PACES_PER_QUARTER = 18 // Max 18 PACEs per quarter for nivelated students

  // Adjust options menu position to keep it on screen
  React.useEffect(() => {
    if (optionsMenu && optionsMenuRef.current) {
      const menu = optionsMenuRef.current
      const menuRect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let { x, y } = optionsMenu

      // Adjust horizontal position if menu goes off right edge
      if (x + menuRect.width > viewportWidth) {
        x = viewportWidth - menuRect.width - 10 // 10px padding from edge
      }

      // Adjust vertical position if menu goes off bottom edge
      if (y + menuRect.height > viewportHeight) {
        y = viewportHeight - menuRect.height - 10 // 10px padding from edge
      }

      // Ensure menu doesn't go off left edge
      if (x < 10) {
        x = 10
      }

      // Ensure menu doesn't go off top edge
      if (y < 10) {
        y = 10
      }

      // Update position if it changed
      if (x !== optionsMenu.x || y !== optionsMenu.y) {
        setOptionsMenu({ ...optionsMenu, x, y })
      }
    }
  }, [optionsMenu])

  // Close options menu on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside a dialog/modal
      const target = e.target as HTMLElement
      if (target.closest('[role="alertdialog"]') || target.closest('[role="dialog"]')) {
        return
      }
      setOptionsMenu(null)
    }
    if (optionsMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [optionsMenu])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (historyDialog) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [historyDialog])

  const handlePaceClick = (subject: string, weekIndex: number, pace: { number: string; grade: number | null; isCompleted: boolean }) => {
    setEditingPace({ subject, weekIndex })
    setGradeInput(pace.grade !== null ? pace.grade.toString() : "")
  }

  const handleEditGrade = (subject: string, weekIndex: number, currentGrade: number | null) => {
    setEditingPace({ subject, weekIndex })
    setGradeInput(currentGrade !== null ? currentGrade.toString() : "")
  }

  const handleGradeSubmit = (subject: string, weekIndex: number) => {
    const grade = parseInt(gradeInput)
    if (grade >= 0 && grade <= 100) {
      onPaceToggle?.(quarter, subject, weekIndex, grade)
      setEditingPace(null)
      setGradeInput("")
    }
  }

  const handleGradeCancel = () => {
    setEditingPace(null)
    setGradeInput("")
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return "text-muted-foreground"
    if (grade >= 90) return "text-[#059669] font-semibold" // Darker green for contrast
    if (grade >= 80) return "text-[#0284C7] font-semibold" // Darker blue for contrast
    return "text-[#E11D48] font-semibold" // Darker red for contrast (Below 80 is failing)
  }

  const isPaceFailing = (grade: number | null) => {
    return grade !== null && grade < 80
  }

  const handleAddPaceClick = (subject: string, weekIndex: number) => {
    // Call onAddPace to open the picker dialog (no paceNumber needed)
    onAddPace?.(quarter, subject, weekIndex)
  }

  const handleDeletePace = (subject: string, weekIndex: number, paceNumber: string) => {
    setDeleteDialog({ subject, weekIndex, paceNumber })
    setOptionsMenu(null)
  }

  const confirmDelete = () => {
    if (deleteDialog) {
      onDeletePace?.(quarter, deleteDialog.subject, deleteDialog.weekIndex)
      setDeleteDialog(null)
    }
  }

  // Calculate paces per week for display
  const weekPaceCounts = React.useMemo(() => {
    const counts: number[] = Array(9).fill(0)
    subjects.forEach(subject => {
      data[subject].forEach((paceOrArray, weekIndex) => {
        if (paceOrArray) {
          const paces = Array.isArray(paceOrArray) ? paceOrArray : [paceOrArray]
          paces.forEach(pace => {
            if (pace) {
              // Exclude unfinished paces that are in their original quarter (they're just for reference)
              const isUnfinishedReference = pace.isUnfinished && pace.originalQuarter === quarter
              if (!isUnfinishedReference) {
                counts[weekIndex]++
              }
            }
          })
        }
      })
    })
    return counts
  }, [data, subjects, quarter])

  // Calculate completed, failed, and expected paces for this quarter
  const quarterStats = React.useMemo(() => {
    let completed = 0
    let failed = 0
    let expected = 0
    let totalFailed = 0 // Total failed attempts across all PACEs

    subjects.forEach(subject => {
      data[subject].forEach(paceOrArray => {
        if (paceOrArray) {
          const paces = Array.isArray(paceOrArray) ? paceOrArray : [paceOrArray]
          paces.forEach(pace => {
            if (pace) {
              const isUnfinishedReference = pace.isUnfinished && pace.originalQuarter === quarter

              if (isUnfinishedReference) {
                // For unfinished references in original quarter: count in Scheduled and Pending
                // They represent work that was scheduled but not completed in this quarter
                expected++
                // They remain as pending (not completed, not failed)
                // Don't count failed attempts from history for references
                return
              }

              // Count all other paces normally
              expected++

              // Use explicit backend flag when available, otherwise fall back to grade
              if (pace.isFailed) {
                failed++
              } else if (pace.isCompleted) {
                if (isPaceFailing(pace.grade)) {
                  failed++
                } else {
                  completed++
                }
              }

              // Count total failed attempts from history
              if (pace.gradeHistory) {
                totalFailed += pace.gradeHistory.filter((h: { grade: number }) => h.grade < 80).length
              }
            }
          })
        }
      })
    })

    return { completed, failed, expected, totalFailed }
  }, [data, subjects, quarter])

  const completionPercentage = quarterStats.expected > 0
    ? Math.round((quarterStats.completed / quarterStats.expected) * 100)
    : 0

  const isQuarterComplete = quarterStats.expected > 0 && quarterStats.completed === quarterStats.expected
  const isQuarterOverloaded = quarterStats.expected > MAX_PACES_PER_QUARTER

  // Collect all failed attempts for the dialog
  const failedAttempts = React.useMemo(() => {
    const attempts: Array<{
      subject: string
      paceNumber: string
      weekNumber: number
      failedGrades: Array<{ grade: number, date: string, note?: string }>
    }> = []

    subjects.forEach((subject) => {
      data[subject].forEach((paceOrArray, weekIndex) => {
        if (paceOrArray) {
          const paces = Array.isArray(paceOrArray) ? paceOrArray : [paceOrArray]
          paces.forEach(pace => {
            if (pace && pace.gradeHistory) {
              const failedGrades = pace.gradeHistory.filter((h: { grade: number }) => h.grade < 80)
              if (failedGrades.length > 0) {
                attempts.push({
                  subject,
                  paceNumber: pace.number,
                  weekNumber: weekIndex + 1,
                  failedGrades
                })
              }
            }
          })
        }
      })
    })

    return attempts
  }, [data, subjects])

  return (
    <div className='relative'>
      <Card className={`${isActive ? "border-primary border-2" : "border-border/50"} transition-all duration-200`}>
        <CardHeader className="p-4 md:p-5 lg:p-6 border-b border-border/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg">
                <span className="truncate">{quarterName}</span>
                <Badge variant="secondary" className="text-[10px] md:text-xs lg:text-sm">
                  {quarter}
                </Badge>
                {isQuarterClosed && (
                  <Badge variant="status-closed" className="text-[10px] md:text-xs lg:text-sm">
                    {t("quarters.closed")}
                  </Badge>
                )}
                {isActive && !isQuarterClosed && (
                  <Badge variant="status-active" className="text-[10px] md:text-xs lg:text-sm">
                    {t("projections.current")}
                  </Badge>
                )}
              </CardTitle>
              {isQuarterOverloaded && (
                <Badge variant="status-failed" className="text-[10px] md:text-xs lg:text-sm">
                  {t("projections.quarterOverload")} ({quarterStats.expected}/{MAX_PACES_PER_QUARTER})
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {currentWeek && (
                <Badge variant="outline" className="text-[10px] md:text-xs lg:text-sm">
                  {t("projections.week")} {currentWeek}
                </Badge>
              )}
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs lg:text-sm">
                {isQuarterComplete ? (
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                ) : (
                  <XCircle className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                )}
                <span className="font-medium">
                  {quarterStats.completed} / {quarterStats.expected}
                </span>
                <span className="text-muted-foreground hidden sm:inline">
                  ({completionPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0! md:p-6">
          <div className="overflow-x-auto mx-0 border border-border overflow-hidden bg-card rounded-b-xs">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left py-2 md:py-3 px-3 md:px-4 font-semibold bg-card sticky left-0 z-10 min-w-[100px] max-w-[120px] md:min-w-[140px] md:max-w-none border-b border-r border-border text-xs md:text-sm">
                    {t("projections.subject")}
                  </th>
                  {weeks.map((week, weekIdx) => {
                    const weekPaceCount = weekPaceCounts[weekIdx]

                    return (
                      <th
                        key={week}
                        className={`text-center py-2 md:py-3 px-2 md:px-3 font-semibold min-w-[80px] md:min-w-[100px] cursor-pointer transition-all duration-200 border-b border-l border-border ${currentWeek === week
                          ? "bg-mint-soft/50 border-b-3 border-l-0 border-mint"
                          : "hover:bg-muted/40"
                          }`}
                        onClick={() => onWeekClick?.(quarter, week)}
                      >
                        <div className="flex flex-col items-center gap-0.5 md:gap-1">
                          <span className={`text-xs md:text-sm font-semibold ${currentWeek === week ? "text-[#059669]" : "text-foreground"}`}>
                            {t("projections.week")} {week}
                            {currentWeek === week && " ✓"}
                          </span>
                          <span className="text-[9px] md:text-[10px] text-muted-foreground">
                            {weekPaceCount} {t("projections.lessons")}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr
                    key={subject}
                    className={`transition-colors group border-b border-border last:border-b-0 bg-card hover:opacity-80`}
                  >
                    <td
                      className={`py-2 md:py-3 px-3 md:px-4 font-semibold sticky left-0 z-10 border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] bg-card ${getSubjectColor(subject).text} text-xs md:text-sm`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-xs md:text-sm font-semibold ${getSubjectColor(subject).text}`}>
                          {getDisplayName(subject)}
                        </span>
                      </div>
                    </td>
                    {data[subject].map((paceOrArray, weekIndex) => {
                      // Handle both single pace and array of paces
                      const isArray = Array.isArray(paceOrArray)
                      const paces = isArray ? paceOrArray : (paceOrArray ? [paceOrArray] : [])
                      const primaryPace = paces[0] || null

                      return (
                        <td
                          key={weekIndex}
                          data-week-index={weekIndex}
                          data-subject={subject}
                          className={`py-1.5 md:py-2 px-2 md:px-3 text-center align-middle border-l border-border ${currentWeek === weekIndex + 1 ? "bg-mint-soft/20" : ""} transition-colors`}
                          draggable={!isReadOnly && !isQuarterClosed && editMode === 'moving' && !!primaryPace && !isArray && !(primaryPace.isUnfinished && primaryPace.originalQuarter === quarter)}
                          onDragStart={(e) => {
                            if (!isReadOnly && editMode === 'moving' && primaryPace && !isArray && !(primaryPace.isUnfinished && primaryPace.originalQuarter === quarter)) {
                              setDraggedPace({ subject, weekIndex })

                              // Create a custom drag image
                              const dragPreview = document.createElement('div')
                              dragPreview.style.position = 'absolute'
                              dragPreview.style.top = '-1000px'
                              dragPreview.style.left = '-1000px'
                              dragPreview.style.padding = '8px 12px'
                              dragPreview.style.background = primaryPace.isCompleted
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)'
                              dragPreview.style.border = primaryPace.isCompleted
                                ? '2px solid #059669'
                                : '2px solid #9ca3af'
                              dragPreview.style.borderRadius = '6px'
                              dragPreview.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                              dragPreview.style.fontFamily = 'monospace'
                              dragPreview.style.fontSize = '14px'
                              dragPreview.style.fontWeight = '600'
                              dragPreview.style.color = primaryPace.isCompleted ? '#ffffff' : '#1f2937'
                              dragPreview.style.opacity = '0.95'
                              dragPreview.style.transform = 'rotate(5deg)'
                              dragPreview.style.zIndex = '10000'
                              dragPreview.textContent = primaryPace.number

                              document.body.appendChild(dragPreview)
                              dragImageRef.current = dragPreview

                              // Set custom drag image
                              e.dataTransfer.effectAllowed = 'move'
                              e.dataTransfer.setDragImage(dragPreview, dragPreview.offsetWidth / 2, dragPreview.offsetHeight / 2)

                              // Add visual feedback to the source cell
                              e.currentTarget.style.opacity = '0.5'
                              e.currentTarget.style.cursor = 'grabbing'
                            }
                          }}
                          onDragOver={(e) => {
                            if (draggedPace && draggedPace.subject === subject) {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = 'move'
                              // Add visual feedback to drop target
                              if (draggedPace.weekIndex !== weekIndex) {
                                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
                                e.currentTarget.style.borderColor = '#3b82f6'
                              }
                            }
                          }}
                          onDragLeave={(e) => {
                            // Remove visual feedback when leaving drop target
                            e.currentTarget.style.backgroundColor = ''
                            e.currentTarget.style.borderColor = ''
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            // Remove visual feedback
                            e.currentTarget.style.backgroundColor = ''
                            e.currentTarget.style.borderColor = ''

                            // Clean up drag image
                            if (dragImageRef.current && dragImageRef.current.parentNode) {
                              document.body.removeChild(dragImageRef.current)
                              dragImageRef.current = null
                            }

                            if (!isReadOnly && editMode === 'moving' && draggedPace && draggedPace.subject === subject && draggedPace.weekIndex !== weekIndex) {
                              const fromPaceRaw = data[subject][draggedPace.weekIndex]
                              const fromPace = Array.isArray(fromPaceRaw) ? fromPaceRaw[0] : fromPaceRaw
                              if (fromPace && fromPace.orderIndex !== undefined) {
                                const targetPaceRaw = data[subject][weekIndex]
                                const targetPace = Array.isArray(targetPaceRaw) ? targetPaceRaw[0] : targetPaceRaw
                                if (targetPace && targetPace.orderIndex !== undefined && targetPace.orderIndex < fromPace.orderIndex) {
                                  toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move pace: would break sequential order")
                                  setDraggedPace(null)
                                  return
                                }
                                const allPacesInSubject = data[subject]
                                  .map((pace, idx) => {
                                    if (!pace || Array.isArray(pace) || idx === draggedPace.weekIndex) return null
                                    return { orderIndex: pace.orderIndex || 0, weekIndex: idx }
                                  })
                                  .filter((item): item is { orderIndex: number; weekIndex: number } => item !== null)
                                const pacesAfterTarget = allPacesInSubject.filter(item => item.weekIndex >= weekIndex)
                                for (const paceAfter of pacesAfterTarget) {
                                  if (paceAfter.orderIndex < fromPace.orderIndex) {
                                    toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move pace: would break sequential order")
                                    setDraggedPace(null)
                                    return
                                  }
                                }
                              }
                              onPaceDrop?.(quarter, subject, draggedPace.weekIndex, weekIndex)
                            }
                            setDraggedPace(null)
                          }}
                          onDragEnd={(e) => {
                            setDraggedPace(null)
                            // Restore source cell appearance
                            e.currentTarget.style.opacity = '1'
                            e.currentTarget.style.cursor = ''
                            // Clean up drag image
                            if (dragImageRef.current && dragImageRef.current.parentNode) {
                              document.body.removeChild(dragImageRef.current)
                              dragImageRef.current = null
                            }
                            // Also clean up any drop target highlighting
                            const allCells = e.currentTarget.closest('table')?.querySelectorAll('td')
                            allCells?.forEach(cell => {
                              if (cell instanceof HTMLElement) {
                                cell.style.backgroundColor = ''
                                cell.style.borderColor = ''
                              }
                            })
                          }}
                          // Touch handlers for mobile/iPad
                          onTouchStart={(e) => {
                            if (!isReadOnly && editMode === 'moving' && primaryPace && !isArray && !(primaryPace.isUnfinished && primaryPace.originalQuarter === quarter)) {
                              const touch = e.touches[0]
                              setTouchStart({ subject, weekIndex, x: touch.clientX, y: touch.clientY })
                              // Create drag preview for touch devices
                              setTouchDragPreview({
                                paceNumber: primaryPace.number,
                                isCompleted: primaryPace.isCompleted,
                                x: touch.clientX,
                                y: touch.clientY
                              })
                              // Prevent text selection and default touch behavior
                              e.preventDefault()
                              // Disable text selection on the cell
                              if (e.currentTarget instanceof HTMLElement) {
                                e.currentTarget.style.userSelect = 'none'
                                e.currentTarget.style.webkitUserSelect = 'none'
                              }
                            }
                          }}
                          onTouchMove={(e) => {
                            if (touchStart && touchStart.subject === subject && touchStart.weekIndex === weekIndex && primaryPace && !isArray) {
                              // Prevent scrolling while dragging
                              e.preventDefault()
                              const touch = e.touches[0]
                              // Update drag preview position
                              setTouchDragPreview({
                                paceNumber: primaryPace.number,
                                isCompleted: primaryPace.isCompleted,
                                x: touch.clientX,
                                y: touch.clientY
                              })
                              // Add visual feedback to source cell
                              e.currentTarget.style.opacity = '0.5'
                              // Highlight potential drop targets
                              const element = document.elementFromPoint(touch.clientX, touch.clientY)
                              const targetCell = element?.closest('td[data-week-index]')
                              // Remove previous highlights
                              const allCells = e.currentTarget.closest('table')?.querySelectorAll('td[data-week-index]')
                              allCells?.forEach(cell => {
                                if (cell instanceof HTMLElement && cell !== e.currentTarget) {
                                  cell.style.backgroundColor = ''
                                  cell.style.borderColor = ''
                                }
                              })
                              // Highlight current target if valid
                              if (targetCell && targetCell instanceof HTMLElement) {
                                const targetWeekIndex = parseInt(targetCell.getAttribute('data-week-index') || '-1')
                                const targetSubject = targetCell.getAttribute('data-subject') || ''
                                if (targetSubject === subject && targetWeekIndex >= 0 && targetWeekIndex !== touchStart.weekIndex) {
                                  targetCell.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
                                  targetCell.style.borderColor = '#3b82f6'
                                }
                              }
                            }
                          }}
                          onTouchEnd={(e) => {
                            if (touchStart && touchStart.subject === subject) {
                              const touch = e.changedTouches[0]
                              // Try to find the target cell at touch end position
                              const element = document.elementFromPoint(touch.clientX, touch.clientY)
                              const targetCell = element?.closest('td[data-week-index]')

                              if (targetCell) {
                                const targetWeekIndex = parseInt(targetCell.getAttribute('data-week-index') || '-1')
                                const targetSubject = targetCell.getAttribute('data-subject') || ''

                                // Only drop if it's the same subject and different week
                                if (targetSubject === subject && targetWeekIndex >= 0 && targetWeekIndex !== touchStart.weekIndex) {
                                  onPaceDrop?.(quarter, subject, touchStart.weekIndex, targetWeekIndex)
                                }
                              }

                              // Clean up
                              e.currentTarget.style.opacity = '1'
                              e.currentTarget.style.userSelect = ''
                              e.currentTarget.style.webkitUserSelect = ''
                              const allCells = e.currentTarget.closest('table')?.querySelectorAll('td[data-week-index]')
                              allCells?.forEach(cell => {
                                if (cell instanceof HTMLElement) {
                                  cell.style.backgroundColor = ''
                                  cell.style.borderColor = ''
                                }
                              })
                            }
                            setTouchStart(null)
                            setTouchDragPreview(null)
                          }}
                        >
                          {primaryPace ? (
                            editingPace?.subject === subject && editingPace?.weekIndex === weekIndex ? (
                              <div className="inline-flex flex-col items-center gap-1.5 md:gap-2 p-1.5 md:p-2 min-w-[140px] md:min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={gradeInput}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    if (e.target.value === '' || (val >= 0 && val <= 100)) {
                                      setGradeInput(e.target.value)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleGradeSubmit(subject, weekIndex)
                                    if (e.key === 'Escape') handleGradeCancel()
                                  }}
                                  placeholder="0-100"
                                  className="w-14 md:w-16 px-1.5 md:px-2 py-0.5 md:py-1 text-center text-xs md:text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleGradeSubmit(subject, weekIndex)}
                                    className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-green-500 text-white rounded-xs hover:bg-green-600 transition-colors cursor-pointer shadow-sm"
                                    title="Guardar"
                                  >
                                    <Check className="h-3 w-3 md:h-4 md:w-4" />
                                  </button>
                                  <button
                                    onClick={handleGradeCancel}
                                    className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-gray-500 text-white rounded-xs hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
                                    title="Cancelar"
                                  >
                                    <X className="h-3 w-3 md:h-4 md:w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : paces.length > 0 ? (
                              <div className="relative flex flex-col items-center gap-1 w-full group/pace">
                                {paces.map((pace, paceIdx) => (
                                  <div
                                    key={paceIdx}
                                    className={`inline-flex flex-col items-center ${!isReadOnly && !isArray && !(pace.isUnfinished && pace.originalQuarter === quarter) ? 'cursor-pointer' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Don't allow editing unfinished copies in their original quarter
                                      if (!isReadOnly && !isArray && !(pace.isUnfinished && pace.originalQuarter === quarter)) {
                                        handlePaceClick(subject, weekIndex, pace)
                                      }
                                    }}
                                  >
                                    <Badge
                                      variant={
                                        pace.isUnfinished && pace.originalQuarter === quarter
                                          ? "status-unfinished"
                                          : pace.isFailed || (pace.isCompleted && isPaceFailing(pace.grade))
                                            ? "status-failed"
                                            : pace.isCompleted
                                              ? "status-completed"
                                              : "outline"
                                      }
                                      className="font-mono text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 cursor-pointer transition-all"
                                      title={pace.isUnfinished && pace.originalQuarter === quarter ? (pace.originalQuarter ? t("projections.unfinishedPace", { originalQuarter: pace.originalQuarter }) : t("projections.unfinishedPace")) : undefined}
                                    >
                                      {pace.number}
                                    </Badge>
                                    {paceIdx === 0 && (
                                      <span className={`text-[10px] md:text-xs mt-0.5 ${getGradeColor(pace.isUnfinished && pace.originalQuarter === quarter ? null : pace.grade)}`}>
                                        {pace.isUnfinished && pace.originalQuarter === quarter ? "—" : (pace.grade !== null ? `${pace.grade}%` : "—")}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {!isReadOnly && editMode === 'editing' && !isArray && primaryPace && !(primaryPace.isUnfinished && primaryPace.originalQuarter === quarter) && (
                                  <button
                                    // onClick={(e) => {
                                    //   e.stopPropagation()
                                    //   const button = e.currentTarget
                                    //   const parent = button.offsetParent as HTMLElement

                                    //   setOptionsMenu({
                                    //     subject,
                                    //     weekIndex,
                                    //     x: parent.offsetLeft + parent.offsetWidth,
                                    //     y: parent.offsetTop
                                    //   })
                                    // }}
                                    onClick={(e) => {
                                      e.stopPropagation()

                                      const button = e.currentTarget
                                      const parent = button.offsetParent as HTMLElement
                                      const rect = button.getBoundingClientRect()

                                      const MENU_WIDTH = 180
                                      const GAP = 60

                                      const spaceRight = window.innerWidth - rect.right
                                      const placeRight = spaceRight > MENU_WIDTH + GAP

                                      setOptionsMenu({
                                        subject,
                                        weekIndex,
                                        x: placeRight
                                          ? parent.offsetLeft + parent.offsetWidth
                                          : parent.offsetLeft - MENU_WIDTH + GAP,
                                        y: parent.offsetTop,
                                        placement: placeRight ? 'right' : 'left'
                                      })
                                    }}
                                    className="absolute right-1 opacity-0 group-hover/pace:opacity-100 transition-opacity cursor-pointer p-1 hover:bg-gray-100 rounded"
                                  >
                                    <MoreVertical className="h-4 w-4 text-gray-500" />
                                  </button>
                                )}
                              </div>
                            ) : null
                          ) : !isReadOnly && onAddPace ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddPaceClick(subject, weekIndex)
                              }}
                              className="h-full w-full min-h-[32px] md:min-h-[40px] flex items-center justify-center transition-all cursor-pointer group"
                            >
                              <span className="text-lg md:text-xl text-primary/0 group-hover:text-primary/80 transition-all group-hover:scale-125">
                                +
                              </span>
                            </div>
                          ) : null}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


        </CardContent>
      </Card>

      {/* Summary */}
      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          <div className="text-center p-2 md:p-3 rounded-md color-zone-primary bg-muted/50 overflow-hidden">
            <p className="text-lg md:text-2xl font-semibold text-primary tabular-nums">{quarterStats.expected}</p>
            <p className="text-[10px] md:text-xs text-muted">{t("projections.scheduled")}</p>
          </div>
          <div className="text-center p-2 md:p-3 rounded-md color-zone-progress relative overflow-hidden">
            <p className="text-lg md:text-2xl font-semibold text-[#059669] relative z-10 tabular-nums">{quarterStats.completed}</p>
            <p className="text-[10px] md:text-xs text-muted relative z-10">{t("projections.completed")}</p>
          </div>
          <div className="text-center p-2 md:p-3 rounded-md color-zone-highlight relative overflow-hidden">
            <p className="text-lg md:text-2xl font-semibold text-[#D97706] relative z-10 tabular-nums">{quarterStats.expected - quarterStats.completed - quarterStats.failed}</p>
            <p className="text-[10px] md:text-xs text-muted relative z-10">{t("projections.pending")}</p>
          </div>
          <div className="text-center p-2 md:p-3 rounded-md color-zone-summary relative overflow-hidden">
            <p className="text-lg md:text-2xl font-semibold text-[#E11D48] relative z-10 tabular-nums">{quarterStats.failed}</p>
            <p className="text-[10px] md:text-xs text-muted relative z-10">{t("projections.failed")}</p>
          </div>
          <button
            onClick={() => setFailedAttemptsDialog(true)}
            disabled={quarterStats.totalFailed === 0}
            className="text-center p-2 md:p-3 rounded-md color-zone-status bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <p className="text-lg md:text-2xl font-semibold text-sky-800 tabular-nums">{quarterStats.totalFailed}</p>
            <p className="text-[10px] md:text-xs text-muted flex items-center justify-center gap-1">
              {t("projections.totalFailedAttemptsLabel")}
              <Info className="h-3 w-3 inline" />
            </p>
          </button>
        </div>
      </div>

      {/* Options Menu Popup */}
      {
        optionsMenu && (
          <div
            ref={optionsMenuRef}
            className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            style={{ left: `${optionsMenu.x}px`, top: `${optionsMenu.y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const paceOrArray = data[optionsMenu.subject][optionsMenu.weekIndex]
                const pace = Array.isArray(paceOrArray) ? paceOrArray[0] : paceOrArray
                if (pace) {
                  handleEditGrade(optionsMenu.subject, optionsMenu.weekIndex, pace.grade)
                  setOptionsMenu(null)
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              {t("projections.editGrade")}
            </button>
            {(() => {
              const paceOrArray = data[optionsMenu.subject][optionsMenu.weekIndex]
              const pace = Array.isArray(paceOrArray) ? paceOrArray[0] : paceOrArray
              return pace?.isCompleted
            })() && (
                <button
                  onClick={() => {
                    onPaceToggle?.(quarter, optionsMenu.subject, optionsMenu.weekIndex)
                    setOptionsMenu(null)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  {t("projections.markIncomplete")}
                </button>
              )}
            <button
              onClick={() => {
                const paceOrArray = data[optionsMenu.subject][optionsMenu.weekIndex]
                const pace = Array.isArray(paceOrArray) ? paceOrArray[0] : paceOrArray
                if (pace && pace.gradeHistory && pace.gradeHistory.length > 0) {
                  setHistoryDialog({
                    subject: optionsMenu.subject,
                    weekIndex: optionsMenu.weekIndex,
                    paceNumber: pace.number,
                    history: pace.gradeHistory
                  })
                  setOptionsMenu(null)
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={(() => {
                const paceOrArray = data[optionsMenu.subject][optionsMenu.weekIndex]
                const pace = Array.isArray(paceOrArray) ? paceOrArray[0] : paceOrArray
                return !pace?.gradeHistory || pace.gradeHistory.length === 0
              })()}
            >
              <History className="h-4 w-4" />
              {t("projections.viewHistory")}
            </button>
            {editMode === 'editing' && (() => {
              const paceOrArray = data[optionsMenu.subject][optionsMenu.weekIndex]
              const pace = Array.isArray(paceOrArray) ? paceOrArray[0] : paceOrArray
              const canDelete = pace && pace.grade === null && onDeletePace
              if (!canDelete) return null
              return (
                <button
                  onClick={() => {
                    if (pace) {
                      handleDeletePace(optionsMenu.subject, optionsMenu.weekIndex, pace.number)
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("common.delete")}
                </button>
              )
            })()}
          </div>
        )
      }

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title="Eliminar Lección"
        message={deleteDialog ? `¿Estás seguro de que deseas eliminar la lección ${deleteDialog.paceNumber} de ${deleteDialog.subject}?\n\nEsta acción no se puede deshacer.` : ""}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {/* Alert Dialog */}
      <InfoDialog
        open={!!alertDialog}
        onOpenChange={(open) => !open && setAlertDialog(null)}
        title={alertDialog?.title || "Alerta"}
        message={alertDialog?.message || ""}
        buttonText="Entendido"
      />

      {/* Grade History Dialog */}
      <Dialog open={!!historyDialog} onOpenChange={(open) => !open && setHistoryDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("projections.gradeHistory")}
            </DialogTitle>
            <DialogDescription>
              {historyDialog && (
                <>
                  {t("projections.lessonLabel")} <span className="font-mono font-semibold">{historyDialog.paceNumber}</span><br />
                  {t("projections.subjectLabel")} <span className="font-semibold">{historyDialog.subject}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historyDialog?.history.map((entry, index) => (
              <div key={index} className={`p-3 rounded-lg border-2 ${entry.grade >= 80 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-semibold tabular-nums ${entry.grade >= 90 ? 'text-green-600' : entry.grade >= 80 ? 'text-blue-600' : 'text-red-600'
                    }`}>{entry.grade}%</span>
                  <span className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
                {entry.note && (
                  <p className="text-sm mt-2 text-gray-700">{entry.note}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setHistoryDialog(null)}
              className="cursor-pointer"
            >
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Touch Drag Preview for iPad/Mobile */}
      {
        touchDragPreview && (
          <div
            ref={touchDragPreviewRef}
            style={{
              position: 'fixed',
              left: `${touchDragPreview.x}px`,
              top: `${touchDragPreview.y}px`,
              transform: 'translate(-50%, -50%) rotate(5deg)',
              pointerEvents: 'none',
              zIndex: 10000,
              padding: '8px 12px',
              background: touchDragPreview.isCompleted
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
              border: touchDragPreview.isCompleted
                ? '2px solid #059669'
                : '2px solid #9ca3af',
              borderRadius: '6px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: '600',
              color: touchDragPreview.isCompleted ? '#ffffff' : '#1f2937',
              opacity: '0.95',
            }}
          >
            {touchDragPreview.paceNumber}
          </div>
        )
      }

      {/* Failed Attempts Dialog */}
      <Dialog open={failedAttemptsDialog} onOpenChange={setFailedAttemptsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              {t("projections.failedAttempts")} - {quarter}
            </DialogTitle>
            <DialogDescription>
              {t("projections.attemptsSummary")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {failedAttempts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>{t("projections.noFailedAttempts")}</p>
              </div>
            ) : (
              failedAttempts.map((attempt, index) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{attempt.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("projections.lessonLabel")} <span className="font-mono font-semibold">{attempt.paceNumber}</span> • {t("projections.week")} {attempt.weekNumber}
                      </p>
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      {attempt.failedGrades.length} {attempt.failedGrades.length > 1 ? t("projections.attempts") : t("projections.attempt")}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {attempt.failedGrades.map((grade, gradeIndex) => (
                      <div key={gradeIndex} className="flex items-center justify-between bg-white p-2 rounded border border-red-300">
                        <span className="text-xl font-semibold text-red-600 tabular-nums">{grade.grade}%</span>
                        <span className="text-xs text-gray-500">{new Date(grade.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t("projections.totalFailedAttempts")} <span className="font-semibold text-red-600 tabular-nums">{quarterStats.totalFailed}</span>
            </p>
            <Button
              variant="outline"
              onClick={() => setFailedAttemptsDialog(false)}
              className="cursor-pointer"
            >
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div >
  );
}
