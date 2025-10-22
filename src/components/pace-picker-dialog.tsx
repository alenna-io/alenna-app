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
import { Search, BookOpen } from "lucide-react"
import { useApi } from "@/services/api"

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
}

export function PacePickerDialog({
  open,
  onClose,
  onSelect,
  categoryFilter,
  levelFilter,
  title = "Seleccionar PACE"
}: PacePickerDialogProps) {
  const api = useApi()
  const [paces, setPaces] = React.useState<PaceCatalogItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    if (open) {
      fetchPaces()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoryFilter, levelFilter])

  const fetchPaces = async () => {
    try {
      setLoading(true)
      const filters: { category?: string, level?: string } = {}
      if (categoryFilter) filters.category = categoryFilter
      if (levelFilter) filters.level = levelFilter

      const data = await api.paceCatalog.get(filters)
      setPaces(data)
    } catch (error) {
      console.error('Error fetching PACEs:', error)
      setPaces([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPaces = paces.filter(pace => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      pace.code.toLowerCase().includes(search) ||
      pace.name.toLowerCase().includes(search) ||
      pace.subSubjectName.toLowerCase().includes(search)
    )
  })

  const handleSelectPace = (pace: PaceCatalogItem) => {
    onSelect(pace.id, pace.code)
    onClose()
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
            {categoryFilter && levelFilter
              ? `PACEs de ${categoryFilter} - ${levelFilter}`
              : 'Busca y selecciona un PACE del catálogo'}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nombre o tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* PACE List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Cargando PACEs...</p>
            </div>
          ) : filteredPaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-2 opacity-50" />
              <p>No se encontraron PACEs</p>
              {searchTerm && <p className="text-sm">Intenta con otro término de búsqueda</p>}
            </div>
          ) : (
            filteredPaces.map((pace) => (
              <button
                key={pace.id}
                onClick={() => handleSelectPace(pace)}
                className="w-full p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors text-left"
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
                  <Button size="sm" variant="outline" className="cursor-pointer">
                    Seleccionar
                  </Button>
                </div>
              </button>
            ))
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

