import { readFile } from 'node:fs/promises'

// Sole responsibility: get JSON off disk into a JS value. No schema
// knowledge, no domain knowledge — validation.ts and normalization.ts own
// those steps separately.
export async function readJsonFile(absolutePath: string): Promise<unknown> {
  const raw = await readFile(absolutePath, 'utf-8')
  return JSON.parse(raw) as unknown
}
