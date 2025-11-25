import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

interface NotFoundPageProps {
  isUnauthorized?: boolean
}

export function NotFoundPage({ isUnauthorized = false }: NotFoundPageProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleBack = () => {
    navigate('/')
  }

  const title = t("common.pageNotFound")
  const message = t("common.pageNotFoundDescription")

  return (
    <div className="min-h-screen flex items-center justify-start">
      <Card className="max-w-6xl w-full mx-4 bg-transparent border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col items-start text-start space-y-4">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-900 mb-4">
                {title}
              </h2>
              <p className="text-muted-foreground text-md md:text-lg">
                {message}
              </p>
              {isUnauthorized && (
                <p className="text-sm md:text-md text-muted-foreground">
                  {t("common.pageNotFoundContactAdmin")}
                </p>
              )}
            </div>

            <Button
              onClick={handleBack}
              className="cursor-pointer"
            >
              {t("common.pageNotFoundBackToHome")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
