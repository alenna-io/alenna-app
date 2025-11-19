import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/string-utils"
import { Users } from "lucide-react"

import type { Parent } from "@/types/student"

interface ParentProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parent: Parent
}

export function ParentProfileDialog({
  open,
  onOpenChange,
  parent,
}: ParentProfileDialogProps) {

  const fullName = parent.firstName && parent.lastName
    ? `${parent.firstName} ${parent.lastName}`
    : parent.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Perfil del Padre/Madre
          </DialogTitle>
          <DialogDescription>
            Información del padre/madre del estudiante
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{fullName}</CardTitle>
                  {parent.email && (
                    <p className="text-muted-foreground">
                      {parent.email}
                    </p>
                  )}
                  {parent.relationship && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {parent.relationship}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Personal Information - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nombre
                  </label>
                  <p className="text-sm mt-1">{parent.firstName || parent.name.split(' ')[0] || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Apellido
                  </label>
                  <p className="text-sm mt-1">{parent.lastName || parent.name.split(' ').slice(1).join(' ') || 'No especificado'}</p>
                </div>
                {parent.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-sm mt-1 break-all">{parent.email}</p>
                  </div>
                )}
                {parent.relationship && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Relación con el Estudiante
                    </label>
                    <p className="text-sm mt-1">{parent.relationship}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    ID de Usuario
                  </label>
                  <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                    {parent.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

