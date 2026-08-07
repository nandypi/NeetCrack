import { z } from 'zod'

// Raw shapes of the scraped DATA/ JSON files, validated as-is. Never
// imported by the renderer — main-process-only. See docs/data-model.md.

export const CourseEntrySchema = z.object({
  id: z.string(),
  link: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string(),
  duration: z.string(),
  difficulty: z.string(),
  jsonPath: z.string(),
  problemBased: z.boolean(),
  completed: z.number(),
  total: z.number()
})

export const CategoriesFileSchema = z.object({
  categories: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      courses: z.array(CourseEntrySchema)
    })
  )
})

export type RawCategoriesFile = z.infer<typeof CategoriesFileSchema>
export type RawCourseEntry = z.infer<typeof CourseEntrySchema>

// Video-based course manifest (docs/data-model.md §3)
const VideoLessonSchema = z.object({
  name: z.string(),
  vimeo: z.string().optional(),
  free: z.boolean().optional(),
  code: z.record(z.string(), z.string()).optional(),
  suggestedProblems: z.array(z.string()).optional(),
  cheatsheet: z.string().optional(),
  customProblem: z.string().optional(),
  length: z.number().optional()
})

export const VideoManifestSchema = z.object({
  data: z.object({
    name: z.string(),
    baseCodeUrl: z.string().optional(),
    sections: z.array(
      z.object({
        name: z.string(),
        lessons: z.array(VideoLessonSchema)
      })
    )
  })
})

export type RawVideoManifest = z.infer<typeof VideoManifestSchema>

// Problem-based course manifest (docs/data-model.md §7, entity summary)
const ProblemLessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  completed: z.boolean()
})

export const ProblemManifestSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string(),
    sections: z.array(
      z.object({
        name: z.string(),
        lessons: z.array(ProblemLessonSchema)
      })
    )
  })
})

export type RawProblemManifest = z.infer<typeof ProblemManifestSchema>
