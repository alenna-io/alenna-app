export function calculatePagesFromGoalText(text: string): number {
  if (!text || !text.trim()) {
    return 0;
  }

  const trimmed = text.trim();
  const lowerText = trimmed.toLowerCase();

  if (lowerText === 'st' || lowerText === 't') {
    return 3;
  }

  const singleNumberPattern = /^\d+$/;
  if (singleNumberPattern.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  const rangePattern = /^(\d+)-(\d+)$/;
  const rangeMatch = trimmed.match(rangePattern);
  if (rangeMatch) {
    const first = parseInt(rangeMatch[1], 10);
    const second = parseInt(rangeMatch[2], 10);
    if (first < second) {
      return second - first + 1;
    }
  }

  return 0;
}
