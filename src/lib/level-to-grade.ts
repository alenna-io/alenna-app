/**
 * Maps level codes (L1-L12) to school grade translations
 */
export function getSchoolGradeFromLevel(level: string | undefined | null, t: (key: string) => string): string {
  if (!level) return '-'
  
  const levelKey = level.toUpperCase()
  
  const gradeMap: Record<string, string> = {
    'L1': 'students.firstGrade',
    'L2': 'students.secondGrade',
    'L3': 'students.thirdGrade',
    'L4': 'students.fourthGrade',
    'L5': 'students.fifthGrade',
    'L6': 'students.sixthGrade',
    'L7': 'students.seventhGrade',
    'L8': 'students.eighthGrade',
    'L9': 'students.ninthGrade',
    'L10': 'students.tenthGrade',
    'L11': 'students.eleventhGrade',
    'L12': 'students.twelvthGrade',
  }
  
  const translationKey = gradeMap[levelKey]
  if (translationKey) {
    return t(translationKey)
  }
  
  // Fallback to the level code if not found
  return level
}

