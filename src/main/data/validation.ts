import {
  CategoriesFileSchema,
  VideoManifestSchema,
  ProblemManifestSchema,
  ArticleSchema,
  CodeSchema,
  ProblemSchema,
  type RawCategoriesFile,
  type RawVideoManifest,
  type RawProblemManifest,
  type RawArticle,
  type RawCode,
  type RawProblem
} from './schemas'

export class DataValidationError extends Error {}

// Sole responsibility: confirm a parsed JSON value matches the shape we
// expect. No filesystem access, no domain-model transformation.
export function parseCategoriesFile(raw: unknown): RawCategoriesFile {
  const result = CategoriesFileSchema.safeParse(raw)
  if (!result.success) {
    throw new DataValidationError(`Categories.json failed validation: ${result.error.message}`)
  }
  return result.data
}

export function parseCourseManifest(
  raw: unknown,
  problemBased: boolean
): RawVideoManifest | RawProblemManifest {
  const schema = problemBased ? ProblemManifestSchema : VideoManifestSchema
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new DataValidationError(`Course manifest failed validation: ${result.error.message}`)
  }
  return result.data
}

export function parseArticle(raw: unknown): RawArticle {
  const result = ArticleSchema.safeParse(raw)
  if (!result.success) {
    throw new DataValidationError(`article.json failed validation: ${result.error.message}`)
  }
  return result.data
}

export function parseCode(raw: unknown): RawCode {
  const result = CodeSchema.safeParse(raw)
  if (!result.success) {
    throw new DataValidationError(`code.json failed validation: ${result.error.message}`)
  }
  return result.data
}

export function parseProblem(raw: unknown): RawProblem {
  const result = ProblemSchema.safeParse(raw)
  if (!result.success) {
    throw new DataValidationError(`problem.json failed validation: ${result.error.message}`)
  }
  return result.data
}
