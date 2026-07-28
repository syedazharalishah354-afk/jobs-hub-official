export const QUALIFICATION_CATEGORIES = [
  'No Formal Education',
  'Primary',
  'Middle',
  'Matric',
  'Intermediate',
  'Diploma',
  'Bachelor',
  'Master',
  'MPhil',
  'PhD',
  'Not Specified'
] as const;

export type QualificationLevel = typeof QUALIFICATION_CATEGORIES[number];

/**
 * Returns numeric rank for qualification level:
 * 0: No Formal Education / Not Specified
 * 1: Primary
 * 2: Middle
 * 3: Matric
 * 4: Intermediate / Diploma
 * 5: Bachelor / BS
 * 6: Master / MA / MSc
 * 7: MPhil
 * 8: PhD
 */
export function getQualificationRank(qual: string): number {
  if (!qual) return 0;
  const q = qual.trim().toLowerCase();
  
  if (q.includes('phd') || q.includes('doctorate')) return 8;
  if (q.includes('mphil') || q.includes('m.phil')) return 7;
  if (q.includes('master') || q.includes('ma') || q.includes('msc') || q.includes('m.com') || q.includes('mba')) return 6;
  if (q.includes('bachelor') || q.includes('bs') || q.includes('ba') || q.includes('bsc') || q.includes('graduation')) return 5;
  if (q.includes('inter') || q.includes('hssc') || q.includes('12th') || q.includes('diploma') || q.includes('fa') || q.includes('fsc') || q.includes('ics') || q.includes('i.com')) return 4;
  if (q.includes('matric') || q.includes('ssc') || q.includes('10th')) return 3;
  if (q.includes('middle')) return 2;
  if (q.includes('primary')) return 1;
  if (q.includes('no formal') || q.includes('none') || q.includes('illiterate')) return 0;
  
  return 0;
}

/**
 * Returns min qualification rank for a job
 */
export function getMinQualificationRank(minQual: string): number {
  return getQualificationRank(minQual);
}

/**
 * Determines whether a job is unlocked for a given user qualification.
 * 
 * SPECIAL RULE FOR PRIVATE JOBS & FACTORY WORKER:
 * When the user selects "Matric":
 * - Show jobs requiring: No Formal Education, Primary, Middle, Matric.
 * - Do NOT show jobs requiring: Intermediate, Diploma, Bachelor, Master, MPhil, PhD.
 */
export function isJobUnlocked(userQual: string, jobMinQual: string, jobCategory?: string): boolean {
  const userRank = getQualificationRank(userQual);
  const jobRank = getMinQualificationRank(jobMinQual);
  const cat = (jobCategory || '').trim().toLowerCase();

  const isPrivateOrFactory = cat.includes('private') || cat.includes('factory');

  // If user selects "Matric" (rank 3) and job is Private / Factory:
  if (userRank === 3 && isPrivateOrFactory) {
    // Show jobs requiring <= Matric (rank <= 3)
    // Hide jobs requiring > Matric (rank > 3)
    return jobRank <= 3;
  }

  // General rule for all other cases
  return userRank >= jobRank;
}

/**
 * Returns summary message based on qualification level
 */
export function getQualificationUnlockMessage(userQual: string): {
  message: string;
  unlockedCount: number;
  badgeType: 'primary' | 'matric' | 'intermediate';
} {
  const rank = getQualificationRank(userQual);
  if (rank <= 2) {
    return {
      message: "Filter active: Showing jobs suitable for Primary / Middle education level.",
      unlockedCount: 0,
      badgeType: 'primary'
    };
  }
  if (rank === 3) {
    return {
      message: "Filter active: Showing jobs suitable for Matric qualification level.",
      unlockedCount: 0,
      badgeType: 'matric'
    };
  }
  return {
    message: "Filter active: Showing higher qualification jobs (Intermediate, Bachelor & Master level).",
    unlockedCount: 0,
    badgeType: 'intermediate'
  };
}

