import packageJson from '../../package.json'

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="w-full py-3 pr-6">
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">alenna</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
            v{packageJson.version}
          </span>
        </div>
      </div>
    </footer>
  )
}

