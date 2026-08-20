// ============================================================
// Story Elements Exercises
// Pre-built exercises for the Story Elements Map widget
// ============================================================

export interface StoryMapExerciseData {
  id: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  band: 'K-5' | '6-8' | '9-12'
  question: string
  excerpt: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanations: [string, string, string]
}

// Placeholder — exercises will be added later
export const STORY_MAP_EXERCISES: StoryMapExerciseData[] = []
