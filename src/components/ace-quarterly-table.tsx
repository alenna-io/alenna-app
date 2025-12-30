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

interface QuarterlyTableProps {
  quarter: string
  quarterName: string
  data: QuarterData
  currentWeek?: number // 1-9 for the current week in this quarter, undefined if not current
  isActive?: boolean // Whether this quarter contains the current week
  isReadOnly?: boolean // Read-only mode for parents
  isQuarterClosed?: boolean // Whether this quarter is closed
  subjectToCategory?: Map<string, string> // Mapping from sub-subject to category
  onPaceDrop?: (quarter: string, subject: string, fromWeek: number, toWeek: number) => void
  onPaceToggle?: (quarter: string, subject: string, weekIndex: number, grade?: number) => void
  onWeekClick?: (quarter: string, week: number) => void
  onAddPace?: (quarter: string, subject: string, weekIndex: number, paceNumber: string) => void
  onDeletePace?: (quarter: string, subject: string, weekIndex: number) => void
}

// Simplified 2-color system: alternating between blue and gray
const getSubjectColor = (index: number) => {
  const isEven = index % 2 === 0
  return isEven
    ? { bg: "bg-white border-gray-200", text: "text-gray-800" }
    : { bg: "bg-slate-50 border-slate-200", text: "text-slate-900" }
}

export function ACEQuarterlyTable({
  quarter,
  quarterName,
  data,
  currentWeek,
  isActive = false,
  isReadOnly = false,
  isQuarterClosed = false,
  subjectToCategory: _subjectToCategory, // eslint-disable-line @typescript-eslint/no-unused-vars
  onPaceDrop,
  onPaceToggle,
  onWeekClick,
  onAddPace,
  onDeletePace
}: QuarterlyTableProps) {
  const { t } = useTranslation()
  const [draggedPace, setDraggedPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const dragImageRef = React.useRef<HTMLDivElement | null>(null)
  const [touchStart, setTouchStart] = React.useState<{ subject: string, weekIndex: number, x: number, y: number } | null>(null)
  const [touchDragPreview, setTouchDragPreview] = React.useState<{ paceNumber: string; isCompleted: boolean; x: number; y: number } | null>(null)
  const touchDragPreviewRef = React.useRef<HTMLDivElement | null>(null)
  const [editingPace, setEditingPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [addingPace, setAddingPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const [paceNumberInput, setPaceNumberInput] = React.useState("")
  const [deleteDialog, setDeleteDialog] = React.useState<{ subject: string, weekIndex: number, paceNumber: string } | null>(null)
  const [alertDialog, setAlertDialog] = React.useState<{ title: string, message: string } | null>(null)
  const [confirmAddDialog, setConfirmAddDialog] = React.useState<{ subject: string, weekIndex: number, weekCount: number } | null>(null)
  const [overloadRememberUntil, setOverloadRememberUntil] = React.useState<number | null>(null)
  const [optionsMenu, setOptionsMenu] = React.useState<{ subject: string, weekIndex: number, x: number, y: number } | null>(null)
  const [historyDialog, setHistoryDialog] = React.useState<{ subject: string, weekIndex: number, paceNumber: string, history: Array<{ grade: number, date: string, note?: string }> } | null>(null)
  const [failedAttemptsDialog, setFailedAttemptsDialog] = React.useState<boolean>(false)
  const optionsMenuRef = React.useRef<HTMLDivElement>(null)
  const subjects = Object.keys(data)
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
    // Directly call onAddPace to open the picker dialog
    onAddPace?.(quarter, subject, weekIndex, '')
  }

  const handleAddPaceSubmit = (subject: string, weekIndex: number) => {
    const newPaceNumber = paceNumberInput.trim()

    if (!newPaceNumber) {
      setAlertDialog({
        title: "Campo Requerido",
        message: "Por favor ingresa un número de Lección"
      })
      return
    }

    // Validate format: must start with 1 and be 4 digits
    if (!/^1\d{3}$/.test(newPaceNumber)) {
      setAlertDialog({
        title: "Formato Inválido",
        message: "El número de Lección debe tener 4 dígitos y comenzar con 1 (ej: 1001, 1234)"
      })
      return
    }

    // Check if pace already exists in this subject
    const paceExists = data[subject].some(paceOrArray => {
      if (!paceOrArray) return false
      const paces = Array.isArray(paceOrArray) ? paceOrArray : [paceOrArray]
      return paces.some(pace => pace && pace.number === newPaceNumber)
    })
    if (paceExists) {
      setAlertDialog({
        title: t("projections.duplicateLesson"),
        message: t("projections.duplicateLessonMessage", { paceNumber: newPaceNumber, subject })
      })
      return
    }

    // Check overload warning for QUARTER (max 18 per quarter)
    const currentQuarterPaces = quarterStats.expected
    const now = Date.now()
    const shouldShowWarning = !overloadRememberUntil || now > overloadRememberUntil

    if (currentQuarterPaces >= MAX_PACES_PER_QUARTER && shouldShowWarning) {
      setConfirmAddDialog({ subject, weekIndex, weekCount: currentQuarterPaces })
      return
    }

    onAddPace?.(quarter, subject, weekIndex, newPaceNumber)
    setAddingPace(null)
    setPaceNumberInput("")
  }

  const confirmOverloadAdd = (rememberFor10Min: boolean = false) => {
    if (confirmAddDialog && addingPace) {
      if (rememberFor10Min) {
        // Remember choice for 10 minutes
        const tenMinutesFromNow = Date.now() + (10 * 60 * 1000)
        setOverloadRememberUntil(tenMinutesFromNow)
      }
      onAddPace?.(quarter, addingPace.subject, addingPace.weekIndex, paceNumberInput.trim())
      setAddingPace(null)
      setPaceNumberInput("")
      setConfirmAddDialog(null)
    }
  }

  const handleDeletePace = (subject: string, weekIndex: number, paceNumber: string) => {
    setDeleteDialog({ subject, weekIndex, paceNumber })
    setOptionsMenu(null) // Ensure options menu closes when delete dialog opens
  }

  const confirmDelete = () => {
    if (deleteDialog) {
      onDeletePace?.(quarter, deleteDialog.subject, deleteDialog.weekIndex)
      setDeleteDialog(null)
    }
  }

  const handleAddPaceCancel = () => {
    setAddingPace(null)
    setPaceNumberInput("")
  }

  // Calculate paces per week for display
  const weekPaceCounts = React.useMemo(() => {
    const counts: number[] = Array(9).fill(0)
    subjects.forEach(subject => {
      data[subject].forEach((pace, weekIndex) => {
        if (pace) {
          counts[weekIndex]++
        }
      })
    })
    return counts
  }, [data, subjects])

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
  }, [data, subjects])

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
    <>
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
          <div className="overflow-x-auto mx-0 border border-border overflow-hidden bg-card rounded-b-xl">
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
                {subjects.map((subject, subjectIndex) => (
                  <tr
                    key={subject}
                    className="transition-colors hover:bg-primary-soft/20 group border-b border-border last:border-b-0"
                  >
                    <td
                      className={`py-2 md:py-3 px-3 md:px-4 font-semibold sticky left-0 z-10 border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] bg-card ${getSubjectColor(subjectIndex).bg} ${getSubjectColor(subjectIndex).text} text-xs md:text-sm group-hover:bg-primary-soft/20`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm font-semibold">
                          {subject}
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
                          draggable={!isReadOnly && !isQuarterClosed && !!primaryPace && !isArray && !(primaryPace.isUnfinished && primaryPace.originalQuarter === quarter)}
                          onDragStart={(e) => {
                            if (!isReadOnly && primaryPace && !isArray && !(primaryPace.isUnfinished && primaryPace.originalQuarter === quarter)) {
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

                            if (!isReadOnly && draggedPace && draggedPace.subject === subject && draggedPace.weekIndex !== weekIndex) {
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
                            if (!isReadOnly && primaryPace && !isArray && !(primaryPace.isUnfinished && primaryPace.originalQuarter === quarter)) {
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
                                    className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer shadow-sm"
                                    title="Guardar"
                                  >
                                    <Check className="h-3 w-3 md:h-4 md:w-4" />
                                  </button>
                                  <button
                                    onClick={handleGradeCancel}
                                    className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
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
                                      <span className={`text-[10px] md:text-xs mt-0.5 ${getGradeColor(pace.grade)}`}>
                                        {pace.grade !== null ? `${pace.grade}%` : "—"}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {!isReadOnly && !isArray && primaryPace && !(primaryPace.isUnfinished && primaryPace.originalQuarter === quarter) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setOptionsMenu({ subject, weekIndex, x: rect.right, y: rect.top })
                                    }}
                                    className="absolute right-1 opacity-0 group-hover/pace:opacity-100 transition-opacity cursor-pointer p-1 hover:bg-gray-100 rounded"
                                  >
                                    <MoreVertical className="h-4 w-4 text-gray-500" />
                                  </button>
                                )}
                              </div>
                            ) : null
                          ) : addingPace?.subject === subject && addingPace?.weekIndex === weekIndex ? (
                            <div className="inline-flex flex-col items-center gap-1.5 md:gap-2 p-1.5 md:p-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={paceNumberInput}
                                onChange={(e) => {
                                  const value = e.target.value
                                  // Only allow numbers and max 4 digits
                                  if (/^\d{0,4}$/.test(value)) {
                                    setPaceNumberInput(value)
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddPaceSubmit(subject, weekIndex)
                                  if (e.key === 'Escape') handleAddPaceCancel()
                                }}
                                placeholder="1XXX"
                                className="w-16 md:w-20 px-1.5 md:px-2 py-0.5 md:py-1 text-center text-xs md:text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAddPaceSubmit(subject, weekIndex)}
                                  className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-[#8B5CF6] text-white rounded-md hover:bg-[#7C3AED] transition-colors cursor-pointer shadow-sm"
                                  title={t("projections.add")}
                                >
                                  <Check className="h-3 w-3 md:h-4 md:w-4" />
                                </button>
                                <button
                                  onClick={handleAddPaceCancel}
                                  className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
                                  title="Cancelar"
                                >
                                  <X className="h-3 w-3 md:h-4 md:w-4" />
                                </button>
                              </div>
                            </div>
                          ) : !isReadOnly ? (
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
          <div className="text-center p-2 md:p-3 rounded-xl color-zone-primary bg-muted/50 overflow-hidden">
            <p className="text-lg md:text-2xl font-semibold text-primary tabular-nums">{quarterStats.expected}</p>
            <p className="text-[10px] md:text-xs text-muted">{t("projections.scheduled")}</p>
          </div>
          <div className="text-center p-2 md:p-3 rounded-xl color-zone-progress relative overflow-hidden">
            <p className="text-lg md:text-2xl font-semibold text-[#059669] relative z-10 tabular-nums">{quarterStats.completed}</p>
            <p className="text-[10px] md:text-xs text-muted relative z-10">{t("projections.completed")}</p>
          </div>
          <div className="text-center p-2 md:p-3 rounded-xl color-zone-highlight relative overflow-hidden">
            <p className="text-lg md:text-2xl font-semibold text-[#D97706] relative z-10 tabular-nums">{quarterStats.expected - quarterStats.completed - quarterStats.failed}</p>
            <p className="text-[10px] md:text-xs text-muted relative z-10">{t("projections.pending")}</p>
          </div>
          <div className="text-center p-2 md:p-3 rounded-xl color-zone-summary relative overflow-hidden">
            <p className="text-lg md:text-2xl font-semibold text-[#E11D48] relative z-10 tabular-nums">{quarterStats.failed}</p>
            <p className="text-[10px] md:text-xs text-muted relative z-10">{t("projections.failed")}</p>
          </div>
          <button
            onClick={() => setFailedAttemptsDialog(true)}
            disabled={quarterStats.totalFailed === 0}
            className="text-center p-2 md:p-3 rounded-xl color-zone-status bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
      {optionsMenu && (
        <div
          ref={optionsMenuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
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
            Editar Nota
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
                Marcar Incompleto
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
            Ver Historial
          </button>
          <button
            onClick={() => {
              const paceOrArray = data[optionsMenu.subject][optionsMenu.weekIndex]
              const pace = Array.isArray(paceOrArray) ? paceOrArray[0] : paceOrArray
              if (pace) {
                handleDeletePace(optionsMenu.subject, optionsMenu.weekIndex, pace.number)
                setOptionsMenu(null)
              }
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      )}

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
      {touchDragPreview && (
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
      )}

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

      {/* Overload Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmAddDialog}
        onOpenChange={(open) => !open && setConfirmAddDialog(null)}
        title={t("projections.quarterOverload")}
        message={confirmAddDialog ? t("projections.quarterOverloadMessage", { weekCount: confirmAddDialog.weekCount, maxPaces: MAX_PACES_PER_QUARTER }) : ""}
        confirmText={t("projections.addAnyway")}
        cancelText={t("common.cancel")}
        variant="default"
        onConfirm={() => confirmOverloadAdd(false)}
      />
    </>
  );
}
