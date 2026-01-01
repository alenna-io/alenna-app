import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useApi } from "@/services/api"

interface Category {
  id: string
  name: string
}

interface Level {
  id: string
  name: string
  number?: number
}

interface CreateSubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  categories: Category[]
  levels: Level[]
}

export function CreateSubjectDialog({
  open,
  onOpenChange,
  onSuccess,
  categories,
  levels,
}: CreateSubjectDialogProps) {
  const api = useApi()
  const [name, setName] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [levelId, setLevelId] = React.useState("")
  const [startPace, setStartPace] = React.useState("")
  const [endPace, setEndPace] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Sort levels by number if available, otherwise by name
  const sortedLevels = React.useMemo(() => {
    return [...levels].sort((a, b) => {
      if (a.number !== undefined && b.number !== undefined) {
        return a.number - b.number
      }
      if (a.number !== undefined) return -1
      if (b.number !== undefined) return 1
      return a.name.localeCompare(b.name)
    })
  }, [levels])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !categoryId || !levelId || !startPace || !endPace) {
      toast.error("Please fill in all fields")
      return
    }

    const start = parseInt(startPace)
    const end = parseInt(endPace)

    if (isNaN(start) || isNaN(end) || start < 1001 || end < 1001) {
      toast.error("Pace values must be at least 1001")
      return
    }

    if (start >= end) {
      toast.error("Start pace must be smaller than end pace")
      return
    }

    setIsSubmitting(true)
    try {
      await api.subjects.create({
        name: name.trim(),
        categoryId,
        levelId,
        startPace: start,
        endPace: end,
      })

      toast.success("Subject created successfully")
      onSuccess()
      handleClose()
    } catch (error: unknown) {
      console.error("Error creating subject:", error)
      const errorMessage = (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data && typeof error.response.data.error === 'string') 
        ? error.response.data.error 
        : (error instanceof Error ? error.message : "Failed to create subject")
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName("")
    setCategoryId("")
    setLevelId("")
    setStartPace("")
    setEndPace("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>
            Create a new sub-subject with a complete sequence of paces from start to end.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Algebra II, Art, Music"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level *</Label>
              <Select value={levelId} onValueChange={setLevelId} required>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  {sortedLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startPace">Start Pace *</Label>
                <Input
                  id="startPace"
                  type="number"
                  min="1001"
                  value={startPace}
                  onChange={(e) => setStartPace(e.target.value)}
                  placeholder="1001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endPace">End Pace *</Label>
                <Input
                  id="endPace"
                  type="number"
                  min="1001"
                  value={endPace}
                  onChange={(e) => setEndPace(e.target.value)}
                  placeholder="1012"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

