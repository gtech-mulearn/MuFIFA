// Kuzhiundo scoring constants — single source of truth for all routes
export const KUZHIUNDO_BASE_POINTS = 10; // Awarded on task-4 verify (one-time)
export const KUZHIUNDO_PER_SUBMISSION = 1; // µPoints per pothole report
export const KUZHIUNDO_SUBMISSION_TASK_ID = 100; // Dedicated repeatable task row

// XP breakdown awarded per individual submission
export const KUZHIUNDO_SUBMISSION_XP = {
  xp_creativity: 0,
  xp_branding: 0,
  xp_innovation: 0,
  xp_teamwork: 0,
  xp_execution: 1,
};
