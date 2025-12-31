// Map module keys to icon file names
const iconMap: Record<string, string | null> = {
  students: "students",
  projections: "projections",
  paces: "lectures",
  monthlyAssignments: "assingments",
  reportCards: "report-cards",
  groups: "groups",
  teachers: "teachers",
  school_admin: "school-settings",
  users: null, // No icon file exists
  schools: null, // No icon file exists
  configuration: "settings",
  billing: "billing",
}

export function hasModuleIcon(moduleKey: string): boolean {
  return iconMap[moduleKey] !== null && iconMap[moduleKey] !== undefined
}

export function getModuleIconPath(moduleKey: string): string | null {
  return iconMap[moduleKey] ?? null
}

