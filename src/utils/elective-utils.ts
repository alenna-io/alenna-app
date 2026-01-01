const ELECTIVES_CATEGORY_NAME = 'Electives'

export function isElectivesCategory(categoryName: string): boolean {
  return categoryName === ELECTIVES_CATEGORY_NAME
}

export function formatElectiveDisplayName(subSubjectName: string): string {
  return `Elective: ${subSubjectName}`
}

