import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, BookOpen, Plus } from "lucide-react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { useTranslation } from "react-i18next"

interface PaceCatalogItem {
  id: string
  code: string
  name: string
  subSubjectName: string
  categoryName: string
  levelId: string
  difficulty: number
}

interface PacePickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (paceId: string, paceCode: string) => void
  categoryFilter?: string
  levelFilter?: string
  title?: string
  existingPaceCatalogIds?: string[] // IDs of paces already in the projection
}

export function PacePickerDialog({
  open,
  onClose,
  onSelect,
  categoryFilter,
  // levelFilter is deprecated - level filtering is now handled by the dropdown in the dialog
  title = "Seleccionar Lección",
  existingPaceCatalogIds = []
}: PacePickerDialogProps) {
  const api = useApi()
  const { t } = useTranslation()
  const [paces, setPaces] = React.useState<PaceCatalogItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedLevel, setSelectedLevel] = React.useState<string>("all")

  React.useEffect(() => {
    if (open) {
      fetchPaces()
      setSelectedLevel("all") // Reset level filter when dialog opens
      setSearchTerm("") // Reset search when dialog opens
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoryFilter])

  const fetchPaces = async () => {
    try {
      setLoading(true)
      // Fetch ALL paces for the category (no level filter)
      const filters: { category?: string } = {}
      if (categoryFilter) {
        filters.category = categoryFilter
      }

      const data = await api.paceCatalog.get(filters)
      // Sort by level first, then by code
      const sortedData = [...data].sort((a, b) => {
        // First sort by level (L1, L2, etc., with Electives at the end)
        const getLevelSortValue = (levelId: string): string => {
          if (levelId === 'Electives') return '99' // Put Electives at the end
          const match = levelId.match(/L(\d+)/)
          if (match) {
            return match[1].padStart(2, '0')
          }
          return levelId // Fallback for other formats
        }

        const levelA = getLevelSortValue(a.levelId)
        const levelB = getLevelSortValue(b.levelId)

        if (levelA !== levelB) {
          return levelA.localeCompare(levelB)
        }
        // Then sort by code
        const codeA = parseInt(a.code) || 0
        const codeB = parseInt(b.code) || 0
        return codeA - codeB
      })
      setPaces(sortedData)
    } catch (error) {
      console.error('Error fetching Lectures:', error)
      setPaces([])
    } finally {
      setLoading(false)
    }
  }

  // Get unique levels from paces
  const availableLevels = React.useMemo(() => {
    const levels = new Set<string>()
    paces.forEach(pace => {
      if (pace.levelId) {
        levels.add(pace.levelId)
      }
    })
    return Array.from(levels).sort((a, b) => {
      // Sort levels: L1, L2, ..., L12, Electives
      if (a === 'Electives') return 1
      if (b === 'Electives') return -1
      const numA = parseInt(a.replace('L', '')) || 0
      const numB = parseInt(b.replace('L', '')) || 0
      return numA - numB
    })
  }, [paces])

  const filteredPaces = React.useMemo(() => {
    let filtered = paces

    // Filter by level if selected
    if (selectedLevel && selectedLevel !== "all") {
      filtered = filtered.filter(pace => pace.levelId === selectedLevel)
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(pace =>
        pace.code.toLowerCase().includes(search) ||
        pace.name.toLowerCase().includes(search) ||
        pace.subSubjectName.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [paces, selectedLevel, searchTerm])

  const handleSelectPace = (pace: PaceCatalogItem) => {
    // Don't allow selecting paces that are already in the projection
    if (existingPaceCatalogIds.includes(pace.id)) {
      return
    }
    onSelect(pace.id, pace.code)
    onClose()
  }

  const isPaceAlreadyAdded = (paceId: string) => {
    return existingPaceCatalogIds.includes(paceId)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "bg-green-100 text-green-800"
    if (difficulty === 3) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', 'Muy Fácil', 'Fácil', 'Moderado', 'Difícil', 'Muy Difícil']
    return labels[difficulty] || 'N/A'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {categoryFilter
              ? `Lecciones de ${categoryFilter}`
              : 'Busca y selecciona una lección del catálogo'}
          </DialogDescription>
        </DialogHeader>

        {/* Search and Level Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, nombre o tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              {availableLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PACE List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loading variant="spinner" message={t("projections.loadingLessons")} className="py-0" />
            </div>
          ) : filteredPaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-2 opacity-50" />
              <p>No se encontraron Lecciones</p>
              {searchTerm && <p className="text-sm">Intenta con otro término de búsqueda</p>}
            </div>
          ) : (
            filteredPaces.map((pace) => {
              const isAlreadyAdded = isPaceAlreadyAdded(pace.id)
              return (
                <div
                  key={pace.id}
                  className={`w-full p-4 border rounded-lg transition-colors ${isAlreadyAdded
                    ? 'opacity-50 bg-muted'
                    : 'hover:bg-accent hover:border-primary'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-sm">
                          {pace.code}
                        </Badge>
                        <Badge className={getDifficultyColor(pace.difficulty)}>
                          {getDifficultyLabel(pace.difficulty)}
                        </Badge>
                        {isAlreadyAdded && (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                            Ya agregada
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium mb-1 truncate">{pace.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{pace.subSubjectName}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {pace.levelId}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectPace(pace)
                      }}
                      size="sm"
                      disabled={isAlreadyAdded}
                      className={`cursor-pointer ${isAlreadyAdded
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      <Plus className="h-4 w-4" />
                      {isAlreadyAdded ? 'Agregada' : 'Agregar'}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

