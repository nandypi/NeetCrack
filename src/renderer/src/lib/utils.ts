import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Standard shadcn/ui helper: merges conditional classNames (clsx) and
// resolves conflicting Tailwind utility classes (tailwind-merge).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
