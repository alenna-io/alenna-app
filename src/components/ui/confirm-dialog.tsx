import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  onConfirm: (rememberChoice?: boolean) => void
  onCancel: () => void
  showRememberOption?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
  onConfirm,
  onCancel,
  showRememberOption = false
}: ConfirmDialogProps) {
  const [rememberChoice, setRememberChoice] = React.useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(rememberChoice)
    setRememberChoice(false)
  }

  const handleCheckChange = (checked: boolean | "indeterminate") => {
    setRememberChoice(checked === true)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          headerBg: "bg-red-50 border-red-200",
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          confirmBg: "bg-red-600 hover:bg-red-700"
        }
      case "warning":
        return {
          headerBg: "bg-orange-50 border-orange-200",
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          confirmBg: "bg-orange-600 hover:bg-orange-700"
        }
      default:
        return {
          headerBg: "bg-blue-50 border-blue-200",
          icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
          confirmBg: "bg-primary hover:bg-primary/90"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className={`border-b ${styles.headerBg}`}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {styles.icon}
              <span>{title}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-6 w-6 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-foreground whitespace-pre-line">{message}</p>
          {showRememberOption && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Checkbox
                id="remember-choice"
                checked={rememberChoice}
                onCheckedChange={handleCheckChange}
              />
              <label
                htmlFor="remember-choice"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                No mostrar este mensaje por 10 minutos
              </label>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          {cancelText && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="cursor-pointer"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            className={`${styles.confirmBg} text-white cursor-pointer`}
          >
            {confirmText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

