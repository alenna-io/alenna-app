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
import { ChevronDown, ChevronUp, CheckCircle2, Trash2, XCircle, MoreVertical, Edit, Check, X, History, Info } from "lucide-react"
import type { QuarterData } from "@/types/pace"

interface QuarterlyTableProps {
  quarter: string
  quarterName: string
  data: QuarterData
  currentWeek?: number // 1-9 for the current week in this quarter, undefined if not current
  isActive?: boolean // Whether this quarter contains the current week
  isReadOnly?: boolean // Read-only mode for parents
  onPaceDrop?: (quarter: string, subject: string, fromWeek: number, toWeek: number) => void
  onPaceToggle?: (quarter: string, subject: string, weekIndex: number, grade?: number, comment?: string) => void
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
  onPaceDrop,
  onPaceToggle,
  onWeekClick,
  onAddPace,
  onDeletePace
}: QuarterlyTableProps) {
  const [isExpanded, setIsExpanded] = React.useState(isActive)
  const [draggedPace, setDraggedPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const [editingPace, setEditingPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [commentInput, setCommentInput] = React.useState("")
  const [gradePhase, setGradePhase] = React.useState<'grade' | 'comment' | null>(null)
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
    // Always open grade editor when clicking on a PACE, regardless of completion status
    setEditingPace({ subject, weekIndex })
    setGradeInput(pace.grade !== null ? pace.grade.toString() : "")
    setGradePhase('grade')
    setCommentInput("")
  }

  const handleEditGrade = (subject: string, weekIndex: number, currentGrade: number | null) => {
    // Open grade editor regardless of completion status
    setEditingPace({ subject, weekIndex })
    setGradeInput(currentGrade !== null ? currentGrade.toString() : "")
    setGradePhase('grade')
    setCommentInput("")
  }

  const handleGradeSubmit = (subject: string, weekIndex: number) => {
    const grade = parseInt(gradeInput)
    if (grade >= 0 && grade <= 100) {
      if (gradePhase === 'grade') {
        // Move to comment phase
        setGradePhase('comment')
      } else if (gradePhase === 'comment') {
        // Submit with comment
        onPaceToggle?.(quarter, subject, weekIndex, grade, commentInput.trim() || undefined)
        setEditingPace(null)
        setGradeInput("")
        setCommentInput("")
        setGradePhase(null)
      }
    }
  }

  const handleGradeSkipComment = (subject: string, weekIndex: number) => {
    const grade = parseInt(gradeInput)
    if (grade >= 0 && grade <= 100) {
      // Submit without comment
      onPaceToggle?.(quarter, subject, weekIndex, grade)
      setEditingPace(null)
      setGradeInput("")
      setCommentInput("")
      setGradePhase(null)
    }
  }

  const handleGradeCancel = () => {
    setEditingPace(null)
    setGradeInput("")
    setCommentInput("")
    setGradePhase(null)
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return "text-muted-foreground"
    if (grade >= 90) return "text-green-600 font-bold"
    if (grade >= 80) return "text-blue-600 font-semibold"
    return "text-red-600 font-semibold" // Below 80 is failing
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
    const paceExists = data[subject].some(pace => pace && pace.number === newPaceNumber)
    if (paceExists) {
      setAlertDialog({
        title: "Lección Duplicada",
        message: `La lección ${newPaceNumber} ya existe en ${subject}.\n\nNo se pueden duplicar lecciones en la misma materia.`
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
      data[subject].forEach(pace => {
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
            totalFailed += pace.gradeHistory.filter(h => h.grade < 80).length
          }
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
      data[subject].forEach((pace, weekIndex) => {
        if (pace && pace.gradeHistory) {
          const failedGrades = pace.gradeHistory.filter(h => h.grade < 80)
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
    })

    return attempts
  }, [data, subjects])

  return (
    <>
      <Card className={isActive ? "border-primary" : ""}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2 md:gap-3 text-lg">
                <span className="truncate">{quarterName}</span>
                <Badge variant="secondary" className="text-xs md:text-sm">
                  {quarter}
                </Badge>
                {isActive && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs md:text-sm">
                    Actual
                  </Badge>
                )}
              </CardTitle>
              {isQuarterOverloaded && (
                <Badge className="bg-red-100 text-red-800 border-red-500 text-xs md:text-sm">
                  Sobrecarga ({quarterStats.expected}/{MAX_PACES_PER_QUARTER})
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {currentWeek && (
                <Badge variant="outline" className="text-xs md:text-sm">
                  Semana {currentWeek}
                </Badge>
              )}
              <div className="flex items-center gap-2 text-xs md:text-sm">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 cursor-pointer text-xs md:text-sm h-8 md:h-9"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Ocultar</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Mostrar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="p-3 md:p-6">
            <div className="overflow-x-auto -mx-3 md:mx-0 border border-gray-300 rounded-md overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-1.5 px-2 font-semibold bg-background sticky left-0 z-10 min-w-[120px] border border-gray-300 text-sm">
                      Materia
                    </th>
                    {weeks.map((week, weekIdx) => {
                      const weekPaceCount = weekPaceCounts[weekIdx]

                      return (
                        <th
                          key={week}
                          className={`text-center py-1.5 px-2 font-semibold min-w-[90px] cursor-pointer hover:bg-muted transition-colors border border-gray-300 ${currentWeek === week
                            ? "bg-green-100"
                            : "bg-muted/50"
                            }`}
                          onClick={() => onWeekClick?.(quarter, week)}
                        >
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-semibold ${currentWeek === week ? "text-green-700" : ""}`}>
                              Semana {week}
                              {currentWeek === week && " ✓"}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {weekPaceCount} Lecciones
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
                      className="transition-colors hover:bg-blue-50 group"
                    >
                      <td
                        className={`py-1.5 px-2 font-semibold sticky left-0 z-10 border border-gray-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${getSubjectColor(subjectIndex).bg} ${getSubjectColor(subjectIndex).text} text-sm group-hover:bg-blue-50`}
                      >
                        {subject}
                      </td>
                      {data[subject].map((pace, weekIndex) => (
                        <td
                          key={weekIndex}
                          className="py-1.5 px-2 text-center align-middle border border-gray-300"
                          draggable={!isReadOnly && !!pace}
                          onDragStart={() => !isReadOnly && setDraggedPace({ subject, weekIndex })}
                          onDragOver={(e) => {
                            if (draggedPace && draggedPace.subject === subject) {
                              e.preventDefault()
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (!isReadOnly && draggedPace && draggedPace.subject === subject && draggedPace.weekIndex !== weekIndex) {
                              onPaceDrop?.(quarter, subject, draggedPace.weekIndex, weekIndex)
                            }
                            setDraggedPace(null)
                          }}
                          onDragEnd={() => setDraggedPace(null)}
                        >
                          {pace ? (
                            editingPace?.subject === subject && editingPace?.weekIndex === weekIndex ? (
                              <div className="inline-flex flex-col items-center gap-2 p-2 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                                {gradePhase === 'grade' || gradePhase === null ? (
                                  <>
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
                                      className="w-16 px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      autoFocus
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleGradeSubmit(subject, weekIndex)}
                                        className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
                                        title="Siguiente"
                                      >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleGradeSkipComment(subject, weekIndex)}
                                        className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer shadow-sm"
                                        title="Guardar sin comentario"
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={handleGradeCancel}
                                        className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
                                        title="Cancelar"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-xs text-center text-gray-600 mb-1">
                                      Grado: <span className="font-semibold">{gradeInput}%</span>
                                    </div>
                                    <textarea
                                      value={commentInput}
                                      onChange={(e) => setCommentInput(e.target.value)}
                                      placeholder="Comentario (opcional)..."
                                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                      rows={2}
                                      autoFocus
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleGradeSubmit(subject, weekIndex)}
                                        className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer shadow-sm"
                                        title="Guardar con comentario"
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => setGradePhase('grade')}
                                        className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
                                        title="Volver"
                                      >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="relative flex items-center justify-center w-full group/pace">
                                <div
                                  className={`inline-flex flex-col items-center ${!isReadOnly ? 'cursor-pointer' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isReadOnly) {
                                      handlePaceClick(subject, weekIndex, pace)
                                    }
                                  }}
                                >
                                  <Badge
                                    variant="outline"
                                    className={`font-mono text-sm px-3 py-1 relative cursor-pointer transition-all ${pace.isFailed || (pace.isCompleted && isPaceFailing(pace.grade))
                                      ? "bg-red-100 text-red-800 border-red-500 border-2"
                                      : pace.isCompleted
                                        ? "bg-green-100 text-green-800 border-green-500 border-2"
                                        : "bg-white text-gray-800 border-gray-300 border-2"
                                      }`}
                                  >
                                    {(pace.isFailed || pace.isCompleted) && (
                                      pace.isFailed || isPaceFailing(pace.grade) ? (
                                        <XCircle className="h-3 w-3 absolute -top-1 -right-1 text-red-600 fill-red-100" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-600 fill-green-100" />
                                      )
                                    )}
                                    {pace.number}
                                  </Badge>
                                  <span className={`text-xs mt-1 ${getGradeColor(pace.grade)}`}>
                                    {pace.grade !== null ? `${pace.grade}%` : "—"}
                                  </span>
                                </div>
                                {!isReadOnly && (
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
                            )
                          ) : addingPace?.subject === subject && addingPace?.weekIndex === weekIndex ? (
                            <div className="inline-flex flex-col items-center gap-2 p-2" onClick={(e) => e.stopPropagation()}>
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
                                className="w-20 px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAddPaceSubmit(subject, weekIndex)}
                                  className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
                                  title="Agregar"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleAddPaceCancel}
                                  className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : !isReadOnly ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddPaceClick(subject, weekIndex)
                              }}
                              className="h-full w-full min-h-[40px] flex items-center justify-center transition-all cursor-pointer group"
                            >
                              <span className="text-xl text-primary/0 group-hover:text-primary/80 transition-all group-hover:scale-125">
                                +
                              </span>
                            </div>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
                <div className="text-center p-2 md:p-3 rounded-lg bg-muted/50">
                  <p className="text-lg md:text-2xl font-bold text-primary">{quarterStats.expected}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Programados</p>
                </div>
                <div className="text-center p-2 md:p-3 rounded-lg bg-green-50">
                  <p className="text-lg md:text-2xl font-bold text-green-600">{quarterStats.completed}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Completados</p>
                </div>
                <div className="text-center p-2 md:p-3 rounded-lg bg-orange-50">
                  <p className="text-lg md:text-2xl font-bold text-orange-600">{quarterStats.expected - quarterStats.completed - quarterStats.failed}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Pendientes</p>
                </div>
                <div className="text-center p-2 md:p-3 rounded-lg bg-red-50">
                  <p className="text-lg md:text-2xl font-bold text-red-600">{quarterStats.failed}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Reprobados</p>
                </div>
                <button
                  onClick={() => setFailedAttemptsDialog(true)}
                  disabled={quarterStats.totalFailed === 0}
                  className="text-center p-2 md:p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="text-lg md:text-2xl font-bold text-purple-600">{quarterStats.totalFailed}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground flex items-center justify-center gap-1">
                    Total Intentos Fallidos
                    <Info className="h-3 w-3 inline" />
                  </p>
                </button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

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
              const pace = data[optionsMenu.subject][optionsMenu.weekIndex]
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
          {data[optionsMenu.subject][optionsMenu.weekIndex]?.isCompleted && (
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
              const pace = data[optionsMenu.subject][optionsMenu.weekIndex]
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
            disabled={!data[optionsMenu.subject][optionsMenu.weekIndex]?.gradeHistory || data[optionsMenu.subject][optionsMenu.weekIndex]?.gradeHistory?.length === 0}
          >
            <History className="h-4 w-4" />
            Ver Historial
          </button>
          <button
            onClick={() => {
              const pace = data[optionsMenu.subject][optionsMenu.weekIndex]
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
              Historial de Calificaciones
            </DialogTitle>
            <DialogDescription>
              {historyDialog && (
                <>
                  Lección: <span className="font-mono font-semibold">{historyDialog.paceNumber}</span><br />
                  Materia: <span className="font-semibold">{historyDialog.subject}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historyDialog?.history.map((entry, index) => (
              <div key={index} className={`p-3 rounded-lg border-2 ${entry.grade >= 80 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${entry.grade >= 90 ? 'text-green-600' : entry.grade >= 80 ? 'text-blue-600' : 'text-red-600'
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
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Failed Attempts Dialog */}
      <Dialog open={failedAttemptsDialog} onOpenChange={setFailedAttemptsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Total Intentos Fallidos - {quarter}
            </DialogTitle>
            <DialogDescription>
              Resumen de todos los intentos fallidos (calificación &lt; 80) en este trimestre
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {failedAttempts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>¡No hay intentos fallidos en este trimestre!</p>
              </div>
            ) : (
              failedAttempts.map((attempt, index) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{attempt.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        Lección: <span className="font-mono font-semibold">{attempt.paceNumber}</span> • Semana {attempt.weekNumber}
                      </p>
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      {attempt.failedGrades.length} intento{attempt.failedGrades.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {attempt.failedGrades.map((grade, gradeIndex) => (
                      <div key={gradeIndex} className="flex items-center justify-between bg-white p-2 rounded border border-red-300">
                        <span className="text-xl font-bold text-red-600">{grade.grade}%</span>
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
              Total de intentos fallidos: <span className="font-bold text-red-600">{quarterStats.totalFailed}</span>
            </p>
            <Button
              variant="outline"
              onClick={() => setFailedAttemptsDialog(false)}
              className="cursor-pointer"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overload Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmAddDialog}
        onOpenChange={(open) => !open && setConfirmAddDialog(null)}
        title="Sobrecarga de Bloque"
        message={confirmAddDialog ? `Este bloque ya tiene ${confirmAddDialog.weekCount} lecciones programadas.\n\nEl máximo recomendado es ${MAX_PACES_PER_QUARTER} lecciones por trimestre.\n\n¿Deseas agregar esta lección de todas formas?` : ""}
        confirmText="Agregar de Todas Formas"
        cancelText="Cancelar"
        variant="default"
        onConfirm={() => confirmOverloadAdd(false)}
      />
    </>
  );
}
