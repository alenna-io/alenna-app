import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface LoadingSkeletonProps {
  variant?: "list" | "table" | "profile" | "default"
}

export function LoadingSkeleton({ variant = "default" }: LoadingSkeletonProps) {
  if (variant === "profile") {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="h-10 bg-muted rounded-md w-64" />

        {/* Profile card skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-muted rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-muted rounded-md w-48" />
                <div className="h-4 bg-muted rounded-md w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content cards skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 bg-muted rounded-md w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 bg-muted rounded-md w-full" />
                <div className="h-4 bg-muted rounded-md w-3/4" />
                <div className="h-4 bg-muted rounded-md w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "table") {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded-md w-48" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded-md w-3/4" />
                  <div className="h-3 bg-muted rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "list") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded-md w-3/4" />
                  <div className="h-3 bg-muted rounded-md w-1/2" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-muted rounded-md w-full" />
                <div className="h-3 bg-muted rounded-md w-5/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Default variant
  return (
    <div className="flex items-center justify-center py-12">
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}

