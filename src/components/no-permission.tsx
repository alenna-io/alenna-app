import { ShieldX } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface NoPermissionProps {
  message?: string
  onBack?: () => void
}

export function NoPermission({
  message = "No tienes permiso para acceder a esta página",
  onBack
}: NoPermissionProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-red-600 dark:text-red-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Acceso Denegado
              </h2>
              <p className="text-muted-foreground">
                {message}
              </p>
              <p className="text-sm text-muted-foreground">
                Si crees que esto es un error, contacta a tu administrador.
              </p>
            </div>

            <Button
              onClick={handleBack}
              className="cursor-pointer"
            >
              Volver al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

