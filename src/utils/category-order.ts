/**
 * Default category order for all schools
 * Categories should be displayed in this order across projections, report cards, and daily goals
 */
export const DEFAULT_CATEGORY_ORDER = [
  'Math',
  'English',
  'Science',
  'Word Building',
  'Social Studies',
  'Electives'
] as const

/**
 * Get the sort order for a category
 * Returns a high number if category is not in the default order
 */
export function getCategoryOrder(category: string): number {
  const index = DEFAULT_CATEGORY_ORDER.indexOf(category as typeof DEFAULT_CATEGORY_ORDER[number])
  return index === -1 ? 999 : index
}

/**
 * Sort categories according to the default order
 * Categories not in the default order will appear at the end
 */
export function sortCategoriesByOrder(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const orderA = getCategoryOrder(a)
    const orderB = getCategoryOrder(b)
    return orderA - orderB
  })
}
