import React from "react"
import { FileX } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface NotFoundPageProps {
  isUnauthorized?: boolean
}

export function NotFoundPage({ isUnauthorized = false }: NotFoundPageProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/')
  }

  const icon = FileX
  const iconColor = "text-gray-600 dark:text-gray-400"
  const iconBg = "bg-gray-100 dark:bg-gray-800"
  const title = "Página No Encontrada"
  const message = "La página que buscas no existe o no está disponible."

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`h-16 w-16 rounded-full ${iconBg} flex items-center justify-center`}>
              {React.createElement(icon, { className: `h-8 w-8 ${iconColor}` })}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <p className="text-muted-foreground">
                {message}
              </p>
              {isUnauthorized && (
                <p className="text-sm text-muted-foreground">
                  Si crees que esto es un error, contacta a tu administrador.
                </p>
              )}
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
