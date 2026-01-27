export function getRemarkBadgeStyle(remarks: string): string {
  const remark = remarks.toLowerCase().trim();

  // Task lifecycle remarks
  if (remark === 'created') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
  if (remark === 'edited') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  }
  if (remark === 'deleted') {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }

  // Submission remarks
  if (remark === 'on time') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
  if (remark === 'late') {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }

  // Review remarks
  if (remark === 'accepted') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  }
  if (remark === 'for revision' || remark === 'for_revision') {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  }
  if (remark === 'rejected') {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }

  // Default
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
}

export function getRemarkCategory(
  remarks: string
): 'lifecycle' | 'submission' | 'review' | 'other' {
  const remark = remarks.toLowerCase().trim();

  if (['created', 'edited', 'deleted'].includes(remark)) {
    return 'lifecycle';
  }
  if (['on time', 'late'].includes(remark)) {
    return 'submission';
  }
  if (['accepted', 'for revision', 'for_revision', 'rejected'].includes(remark)) {
    return 'review';
  }

  return 'other';
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverdue(dueDate: string, submittedAt: string): boolean {
  return new Date(submittedAt) > new Date(dueDate);
}
