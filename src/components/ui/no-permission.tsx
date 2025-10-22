import { Card, CardContent } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { GraduationCap } from "lucide-react"

interface NoPermissionProps {
  onBack?: () => void
  backTo?: string
  title?: string
  message?: string
}

export function NoPermission({
  onBack,
  backTo,
  title = "Sin Acceso",
  message = "No tienes permisos para acceder a esta sección"
}: NoPermissionProps) {
  return (
    <div className="space-y-6">
      {(onBack || backTo) && (
        <BackButton onClick={onBack} to={backTo}>
          Volver
        </BackButton>
      )}
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">
            {message}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
