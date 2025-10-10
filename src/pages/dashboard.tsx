export function DashboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Welcome to your dashboard. This is where your main content will go.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Card 1</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a sample card component.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Card 2</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This is another sample card component.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Card 3</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            And one more card component.
          </p>
        </div>
      </div>
    </div>
  )
}

