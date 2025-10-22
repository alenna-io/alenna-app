import * as React from "react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface BackButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  to?: string
  onClick?: () => void
  children: React.ReactNode
}

const BackButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  BackButtonProps
>(({ to, onClick, children, className, ...props }, ref) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    } else {
      navigate(-1) // Go back in history
    }
  }

  return (
    <Button
      ref={ref}
      variant="outline"
      onClick={handleClick}
      className={cn("mb-4", className)}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      ← {children}
    </Button>
  )
})

BackButton.displayName = "BackButton"

export { BackButton }