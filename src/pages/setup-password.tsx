import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

export function SetupPasswordPage() {
  const navigate = useNavigate()
  const api = useApi()
  const { t } = useTranslation()
  const { refetch } = useUser()

  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [passwordValidationError, setPasswordValidationError] = React.useState<string | null>(null)

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) {
      return t("passwordSetup.errors.minLength") || "La contraseña debe tener al menos 12 caracteres"
    }
    if (!/[A-Z]/.test(pwd)) {
      return t("passwordSetup.errors.uppercase") || "La contraseña debe contener al menos una letra mayúscula"
    }
    if (!/[a-z]/.test(pwd)) {
      return t("passwordSetup.errors.lowercase") || "La contraseña debe contener al menos una letra minúscula"
    }
    if (!/[0-9]/.test(pwd)) {
      return t("passwordSetup.errors.number") || "La contraseña debe contener al menos un número"
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) {
      return t("passwordSetup.errors.specialChar") || "La contraseña debe contener al menos un carácter especial (!@#$%^&*...)"
    }
    // Check for common weak patterns
    if (/^[a-zA-Z0-9]+$/.test(pwd) && pwd.length < 16) {
      return t("passwordSetup.errors.tooSimple") || "La contraseña es demasiado simple. Usa una combinación más compleja"
    }
    // Check for sequential characters (e.g., "1234", "abcd")
    if (/(.)\1{3,}/.test(pwd) || /(0123|1234|2345|3456|4567|5678|6789|7890|abcd|bcde|cdef|defg)/i.test(pwd)) {
      return t("passwordSetup.errors.sequential") || "La contraseña no debe contener secuencias obvias"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setPasswordValidationError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError(t("passwordSetup.errors.mismatch") || "Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      await api.auth.updatePassword(password)

      // Refetch user info to update the createdPassword flag
      await refetch()

      toast.success("Contraseña establecida exitosamente")

      // Redirect to dashboard
      navigate("/dashboard", { replace: true })
    } catch (err: unknown) {
      console.error("Error setting up password:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al establecer la contraseña. Por favor intenta de nuevo."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("passwordSetup.title") || "Establecer Contraseña"}
          </CardTitle>
          <CardDescription>
            {t("passwordSetup.description") || "Por favor establece una contraseña para tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                {t("passwordSetup.password") || "Contraseña"}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  const newPassword = e.target.value
                  setPassword(newPassword)
                  setError(null) // Clear submit error when user types
                  // Validate in real-time only if user has started typing
                  if (newPassword.length > 0) {
                    const validationError = validatePassword(newPassword)
                    setPasswordValidationError(validationError)
                  } else {
                    setPasswordValidationError(null)
                  }
                }}
                placeholder={t("passwordSetup.passwordPlaceholder") || "Mínimo 12 caracteres"}
                required
                disabled={isLoading}
                autoFocus
                className={passwordValidationError ? "border-destructive" : ""}
              />
              {passwordValidationError && (
                <p className="text-xs text-destructive mt-1">
                  {passwordValidationError}
                </p>
              )}
              {!passwordValidationError && password.length > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {t("passwordSetup.validPassword") || "✓ Contraseña válida"}
                </p>
              )}
              {password.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("passwordSetup.passwordHint") || "Debe tener al menos 12 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("passwordSetup.confirmPassword") || "Confirmar Contraseña"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("passwordSetup.confirmPasswordPlaceholder") || "Repite la contraseña"}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading
                ? (t("passwordSetup.settingUp") || "Estableciendo...")
                : (t("passwordSetup.setupPassword") || "Establecer Contraseña")
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

