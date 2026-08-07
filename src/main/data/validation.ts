import {
  CategoriesFileSchema,
  VideoManifestSchema,
  ProblemManifestSchema,
  type RawCategoriesFile,
  type RawVideoManifest,
  type RawProblemManifest
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
