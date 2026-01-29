import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock, Check } from "lucide-react"
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
      return t("passwordSetup.errors.minLength") || "Password must be at least 12 characters long"
    }
    if (!/[A-Z]/.test(pwd)) {
      return t("passwordSetup.errors.uppercase") || "Password must contain at least one uppercase letter"
    }
    if (!/[a-z]/.test(pwd)) {
      return t("passwordSetup.errors.lowercase") || "Password must contain at least one lowercase letter"
    }
    if (!/[0-9]/.test(pwd)) {
      return t("passwordSetup.errors.number") || "Password must contain at least one number"
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) {
      return t("passwordSetup.errors.specialChar") || "Password must contain at least one special character (!@#$%^&*...)"
    }
    // Check for common weak patterns
    if (/^[a-zA-Z0-9]+$/.test(pwd) && pwd.length < 16) {
      return t("passwordSetup.errors.tooSimple") || "Password is too simple. Use a more complex combination"
    }
    // Check for sequential characters (e.g., "1234", "abcd")
    if (/(.)\1{3,}/.test(pwd) || /(0123|1234|2345|3456|4567|5678|6789|7890|abcd|bcde|cdef|defg)/i.test(pwd)) {
      return t("passwordSetup.errors.sequential") || "Password must not contain obvious sequences"
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
      setError(t("passwordSetup.errors.mismatch") || "Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      await api.auth.updatePassword(password)

      // Refetch user info to update the createdPassword flag
      await refetch()

      toast.success(t("passwordSetup.success") || "Password set successfully")

      // Redirect to dashboard
      navigate("/dashboard", { replace: true })
    } catch (err: unknown) {
      console.error("Error setting up password:", err)
      const errorMessage = err instanceof Error ? err.message : t("passwordSetup.error") || "Error setting password. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md rounded-2xl bg-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] border border-gray-100">
        <CardHeader className="space-y-1 text-center px-8 pt-9 pb-6">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
            <Lock className="h-5 w-5 text-indigo-500" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
            {t("passwordSetup.title") || "Set Password"}
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-gray-500 leading-relaxed">
            {t("passwordSetup.description") || "Please set a password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-9">
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t("passwordSetup.password") || "Password"}
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
                  placeholder={t("passwordSetup.passwordPlaceholder") || "Minimum 12 characters"}
                  required
                  disabled={isLoading}
                  autoFocus
                  className={`mt-2 w-full rounded-lg border ${passwordValidationError
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    } px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition`}
                />
                {passwordValidationError && (
                  <p className="mt-1 text-xs text-red-600">
                    {passwordValidationError}
                  </p>
                )}
                {!passwordValidationError && password.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    {t("passwordSetup.validPassword") || "Valid password"}
                  </p>
                )}
                {password.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t("passwordSetup.passwordHint") || "Must have at least 12 characters, including uppercase, lowercase, numbers, and special characters"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  {t("passwordSetup.confirmPassword") || "Confirm Password"}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("passwordSetup.confirmPasswordPlaceholder") || "Repeat password"}
                  required
                  disabled={isLoading}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 w-full rounded-xs bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading
                ? (t("passwordSetup.settingUp") || "Setting up...")
                : (t("passwordSetup.setupPassword") || "Set Password")
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

