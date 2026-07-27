export const QUALIFICATION_CATEGORIES = [
  'Primary',
  'Middle',
  'Matric',
  'Intermediate',
  'Diploma',
  'Technical Diploma',
  'Certification',
  'Associate Degree',
  'Bachelor',
  'BS',
  'Master',
  'Other Higher Qualification'
] as const;

export type QualificationLevel = typeof QUALIFICATION_CATEGORIES[number];

/**
 * Returns rank integer for user qualification:
 * 1: Primary, Middle
 * 2: Matric
 * 3: Intermediate & Above (Diploma, Bachelor, BS, Master, etc.)
 */
export function getQualificationRank(qual: string): number {
  if (!qual) return 1;
  const q = qual.trim().toLowerCase();
  
  if (q.includes('primary') || q.includes('middle')) {
    return 1;
  }
  if (q.includes('matric') || q.includes('ssc')) {
    return 2;
  }
  // All other qualifications are Intermediate or higher
  return 3;
}

/**
 * Returns min qualification rank for a job
 */
export function getMinQualificationRank(minQual: string): number {
  if (!minQual) return 1;
  const q = minQual.trim().toLowerCase();
  if (q.includes('primary') || q.includes('middle')) return 1;
  if (q.includes('matric')) return 2;
  return 3;
}

/**
 * Determines whether a job is unlocked for a given user qualification
 */
export function isJobUnlocked(userQual: string, jobMinQual: string): boolean {
  const userRank = getQualificationRank(userQual);
  const jobRank = getMinQualificationRank(jobMinQual);
  return userRank >= jobRank;
}

/**
 * Returns exact system message based on qualification level
 */
export function getQualificationUnlockMessage(userQual: string): {
  message: string;
  unlockedCount: number;
  badgeType: 'primary' | 'matric' | 'intermediate';
} {
  const rank = getQualificationRank(userQual);
  if (rank === 1) {
    return {
      message: "Based on your qualification, 10 jobs are currently available to you.",
      unlockedCount: 10,
      badgeType: 'primary'
    };
  }
  if (rank === 2) {
    return {
      message: "Based on your qualification, 15 jobs are currently available to you.",
      unlockedCount: 15,
      badgeType: 'matric'
    };
  }
  return {
    message: "Congratulations! You have access to all available freelance jobs.",
    unlockedCount: 25,
    badgeType: 'intermediate'
  };
}
