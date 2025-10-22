import { FileX } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function NotFoundPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileX className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Página No Encontrada
              </h2>
              <p className="text-muted-foreground">
                La página que buscas no existe o no está disponible.
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
